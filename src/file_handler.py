"""
Модуль для роботи з файлами зображень.

Містить допоміжні функції для генерації унікальних імен,
збереження файлів у локальну директорію
та видалення файлів із файлової системи.
"""

import uuid
from pathlib import Path

IMAGES_DIR = Path(__file__).parent.parent / 'images'


def generate_unique_filename(original_name):
    """
    Генерує унікальне ім'я файлу на основі UUID.

    Розширення файлу зберігається,
    а базова частина імені замінюється випадковим UUID,
    щоб уникнути конфлікту між файлами.

    :param original_name: початкове ім'я файлу
    :return: унікальне ім'я нового файлу
    """
    ext = original_name.lower().split('.')[-1]
    unique_name = f"{uuid.uuid4()}.{ext}"
    return unique_name


def save_file(file_data, filename):
    """
    Зберігає файл у локальну директорію зображень.

    Функція створює цільову папку, якщо її ще немає,
    генерує нове унікальне ім'я, записує байти у файл
    і повертає нове ім'я для подальшого використання.

    :param file_data: байтовий вміст файлу
    :param filename: оригінальне ім'я файлу
    :return: унікальне ім'я збереженого файлу
    """
    IMAGES_DIR.mkdir(exist_ok=True)
    unique_name = generate_unique_filename(filename)
    filepath = IMAGES_DIR / unique_name

    with open(filepath, 'wb') as f:
        f.write(file_data)

    print(f"File saved successfully: {unique_name}")
    return unique_name


def delete_file(filename):
    """
    Видаляє файл із локальної директорії зображень.

    :param filename: ім'я файлу для видалення
    :return: `True`, якщо файл існував і був видалений, інакше `False`
    """
    filepath = IMAGES_DIR / filename
    if filepath.exists():
        filepath.unlink()
        return True
    return False
