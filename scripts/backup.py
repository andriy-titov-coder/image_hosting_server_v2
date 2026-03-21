"""
Скрипт для резервного копіювання PostgreSQL у Docker-середовищі.

Підтримує три основні сценарії:
- створення SQL-бекапу бази даних
- перегляд доступних бекапів у локальній директорії
- відновлення бази даних із вибраного SQL-файлу
"""

import subprocess
import sys
from datetime import datetime
import os
import argparse

BACKUP_DIR = os.getenv("BACKUP_DIR", "./backups")
CONTAINER_NAME = os.getenv("DB_CONTAINER_NAME", "group6_image_hosting_server-db-1")
DB_NAME = os.getenv("DB_NAME", "group6_image_hosting_server_db")
DB_USER = os.getenv("DB_USER", "postgres")


def create_backup():
    """
    Створює SQL-бекап бази даних через `pg_dump` усередині Docker-контейнера.

    Функція формує ім'я файлу з часовою міткою, запускає команду
    `docker exec ... pg_dump`, а потім зберігає результат у папку бекапів.
    Якщо команда завершується з помилкою, робота скрипта припиняється.
    """
    timestamp = datetime.now().strftime("%Y-%m-%d_%H%M%S")
    filename = f"backup_{timestamp}.sql"
    filepath = os.path.join(BACKUP_DIR, filename)

    os.makedirs(BACKUP_DIR, exist_ok=True)

    cmd = [
        "docker", "exec", CONTAINER_NAME,
        "pg_dump", "-U", DB_USER, "-d", DB_NAME
    ]

    try:
        result = subprocess.run(cmd, capture_output=True, text=True, check=True)
        with open(filepath, 'w') as f:
            f.write(result.stdout)
        print(f"Backup created: {filename}")
    except subprocess.CalledProcessError as e:
        print(f"Error creating backup: {e.stderr}")
        sys.exit(1)
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)


def list_backups():
    """
    Виводить список усіх доступних SQL-бекапів у директорії резервних копій.

    Якщо папка не існує або в ній немає жодного `.sql` файлу,
    користувач отримує відповідне повідомлення.
    """
    if not os.path.exists(BACKUP_DIR):
        print(f"The directory {BACKUP_DIR} does not exist.")
        return

    files = sorted([f for f in os.listdir(BACKUP_DIR) if f.endswith('.sql')])

    if not files:
        print("No backups found")
        return

    print(f"Backups found: {len(files)}")
    print("-" * 40)

    for file in files:
        print(f"{file}")


def restore_backup(filename):
    """
    Відновлює базу даних із вибраного SQL-файлу.

    Функція перевіряє наявність файлу бекапу, читає його вміст
    і передає SQL-команди в `psql` усередині Docker-контейнера.

    :param filename: ім'я файлу бекапу для відновлення
    """
    if not filename.endswith('.sql'):
        filename += '.sql'

    filepath = os.path.join(BACKUP_DIR, filename)

    if not os.path.exists(filepath):
        print(f"File {filename} not found in {BACKUP_DIR}")
        sys.exit(1)

    with open(filepath, 'r') as f:
        sql_content = f.read()

    cmd = [
        "docker", "exec", "-i", CONTAINER_NAME,
        "psql", "-U", DB_USER, "-d", DB_NAME
    ]

    try:
        subprocess.run(cmd, input=sql_content, text=True, check=True)
        print(f"The database has been restored from backup: {filename}")
    except subprocess.CalledProcessError as e:
        print(f"Restore error: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)


def main():
    """
    Обробляє аргументи командного рядка та запускає потрібну операцію.

    Підтримуються команди:
    - `create` для створення бекапу
    - `list` для перегляду всіх бекапів
    - `restore` для відновлення з указаного файлу
    """
    parser = argparse.ArgumentParser(
        description="PostgreSQL database backup script",
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )

    parser.add_argument(
        'command',
        choices=['create', 'list', 'restore'],
        help='Command to execute'
    )

    parser.add_argument(
        'filename',
        nargs='?',
        help='File name for restoration (only for the restore command)'
    )

    args = parser.parse_args()

    if args.command == "create":
        create_backup()
    elif args.command == "list":
        list_backups()
    elif args.command == "restore":
        if not args.filename:
            print("Enter the name of the file to restore")
            sys.exit(1)
        restore_backup(args.filename)


if __name__ == "__main__":
    main()
