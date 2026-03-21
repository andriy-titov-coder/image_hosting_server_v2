"""
Модуль для роботи з PostgreSQL.

Інкапсулює створення підключення до бази даних
і базові операції над таблицею зображень:
збереження, отримання списку та видалення записів.
"""

import psycopg2
from psycopg2.extras import RealDictCursor
import os
from dotenv import load_dotenv

load_dotenv()


class DatabaseManager:
    """
    Клас для взаємодії з PostgreSQL у межах застосунку.

    Зберігає активне з'єднання з базою даних
    і надає методи для роботи з таблицею `images`.
    """
    def __init__(self):
        """
        Ініціалізує менеджер бази даних без активного підключення.
        """
        self.connection = None

    def connect(self):
        """
        Встановлює з'єднання з PostgreSQL на основі змінних середовища.
        """
        try:
            self.connection = psycopg2.connect(
                host=os.getenv('DB_HOST'),
                database=os.getenv('DB_NAME'),
                user=os.getenv('DB_USER'),
                password=os.getenv('DB_PASSWORD'),
                port=os.getenv('DB_PORT')
            )
            print("Connected to PostgreSQL")
        except Exception as e:
            print(f"Connection error: {e}")

    def disconnect(self):
        """
        Закриває активне з'єднання з базою даних, якщо воно існує.
        """
        if self.connection:
            self.connection.close()
            print("Disconnected from PostgreSQL")

    def save_metadata(self, filename, original_name, size, file_type):
        """
        Зберігає метадані файлу в таблицю `images`.

        :param filename: унікальне ім'я файлу в системі
        :param original_name: оригінальне ім'я файлу
        :param size: розмір файлу в байтах
        :param file_type: розширення або тип файлу
        :return: `True`, якщо запис успішно створено, інакше `False`
        """
        try:
            with self.connection.cursor() as cursor:
                cursor.execute("""
                    INSERT INTO images (filename, original_name, size, file_type)
                    VALUES (%s, %s, %s, %s)
                """, (filename, original_name, size, file_type))
                self.connection.commit()
                return True
        except Exception as e:
            print(f"Save error: {e}")
            return False

    def get_all_images(self, page=1, per_page=10):
        """
        Повертає список зображень із пагінацією та загальну кількість записів.

        :param page: номер сторінки
        :param per_page: кількість записів на сторінці
        :return: список зображень і загальна кількість записів
        """
        try:
            with self.connection.cursor(cursor_factory=RealDictCursor) as cursor:
                offset = (page - 1) * per_page
                cursor.execute("""
                    SELECT * FROM images
                    ORDER BY upload_time DESC
                    LIMIT %s OFFSET %s
                """, (per_page, offset))
                images = cursor.fetchall()

                cursor.execute("SELECT COUNT(*) FROM images")
                total = cursor.fetchone()['count']

                return images, total
        except Exception as e:
            print(f"Retrieval error: {e}")
            return [], 0

    def delete_image(self, image_id):
        """
        Видаляє запис про зображення з бази даних за його ідентифікатором.

        Перед видаленням метод отримує ім'я файлу,
        щоб його можна було видалити і з файлової системи.

        :param image_id: ідентифікатор зображення
        :return: ім'я файлу, якщо запис знайдено, інакше `False`
        """
        try:
            with self.connection.cursor() as cursor:
                cursor.execute("SELECT filename FROM images WHERE id = %s", (image_id,))
                result = cursor.fetchone()
                if not result:
                    return False

                filename = result[0]
                cursor.execute("DELETE FROM images WHERE id = %s", (image_id,))
                self.connection.commit()
                return filename
        except Exception as e:
            print(f"Delete error: {e}")
            return False
