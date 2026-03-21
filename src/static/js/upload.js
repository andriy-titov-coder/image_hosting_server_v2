/**
 * Скрипт сторінки завантаження зображень.
 *
 * Він обробляє вибір файлів, drag-and-drop, відправку на сервер,
 * показ повідомлень, копіювання URL
 * і збереження локальних даних про файли в localStorage.
 */
document.addEventListener('DOMContentLoaded', function () {
    document.addEventListener('keydown', function (event) {
        if (event.key === 'Escape' || event.key === 'F5') {
            event.preventDefault();
            window.location.href = '/';
        }
    });

    const fileUpload = document.getElementById('file-upload');
    const imagesButton = document.getElementById('images-tab-btn');
    const dropzone = document.querySelector('.upload__dropzone');
    const currentUploadInput = document.querySelector('.upload__input');
    const copyButton = document.querySelector('.upload__copy');

    if (imagesButton) {
        imagesButton.addEventListener('click', () => window.location.href = '/images-list');
    }

    /**
     * Показує повідомлення про успішну дію або помилку під формою завантаження.
     *
     * Якщо елемент повідомлення ще не створено, функція додає його в DOM.
     *
     * @param {string} message Текст повідомлення для користувача.
     * @param {boolean} [isError=false] Ознака повідомлення про помилку.
     */
    const showMessage = (message, isError = false) => {
        let msgEl = document.querySelector('.upload__message');
        if (!msgEl) {
            msgEl = document.createElement('p');
            msgEl.className = 'upload__message';
            dropzone?.parentNode?.insertBefore(msgEl, dropzone.nextSibling);
        }
        msgEl.textContent = message;
        msgEl.style.color = isError ? '#e53e3e' : '#38a169';
    };

    /**
     * Завантажує один файл на сервер і в разі успіху
     * зберігає його локальні метадані в localStorage.
     *
     * Після відповіді сервера формує displayName, читає файл через FileReader
     * для локального preview і оновлює поле з URL поточного завантаження.
     *
     * @param {File} file Файл, який потрібно відправити на сервер.
     * @returns {Promise<void>}
     */
    const uploadFile = async (file) => {
        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await fetch('/upload', {
                method: 'POST',
                body: formData
            });

            const data = await response.json();

            if (data.success) {
                const storedFiles = JSON.parse(localStorage.getItem('uploadedImages')) || [];

                const getNextImageNumber = () =>
                    storedFiles.filter(f => f.displayName && f.displayName.startsWith('image')).length + 1;

                const ext = file.name.substring(file.name.lastIndexOf('.'));
                const displayName = `image${String(getNextImageNumber()).padStart(2, '0')}${ext}`;

                const reader = new FileReader();
                reader.onload = (event) => {
                    storedFiles.push({
                        name: data.filename,
                        displayName: displayName,
                        originalName: file.name,
                        url: event.target.result
                    });
                    localStorage.setItem('uploadedImages', JSON.stringify(storedFiles));
                };
                reader.readAsDataURL(file);

                if (currentUploadInput) {
                    currentUploadInput.value = `https://group6-image-hosting-server.com/${data.filename}`;
                }
                showMessage('File uploaded successfully!');
            } else {
                showMessage(data.message || 'Upload failed.', true);
            }
        } catch (err) {
            showMessage('Something went wrong. Please try again.', true);
        }
    };

    /**
     * Обробляє список вибраних або перетягнутих файлів.
     *
     * Якщо список не порожній, кожен файл передається
     * у функцію індивідуального завантаження.
     *
     * @param {FileList|File[]} files Набір файлів для обробки.
     */
    const handleAndStoreFiles = (files) => {
        if (!files || files.length === 0) return;
        for (const file of files) {
            uploadFile(file);
        }
    };

    if (copyButton && currentUploadInput) {
        copyButton.addEventListener('click', () => {
            const textToCopy = currentUploadInput.value;
            if (textToCopy && textToCopy !== 'https://') {
                navigator.clipboard.writeText(textToCopy).then(() => {
                    copyButton.textContent = 'COPIED!';
                    setTimeout(() => copyButton.textContent = 'COPY', 2000);
                }).catch(err => console.error('Failed to copy text: ', err));
            }
        });
    }

    if (fileUpload) {
        fileUpload.addEventListener('change', (event) => {
            handleAndStoreFiles(event.target.files);
            event.target.value = '';
        });
    }

    if (dropzone) {
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            dropzone.addEventListener(eventName, (e) => {
                e.preventDefault();
                e.stopPropagation();
            });
        });

        dropzone.addEventListener('dragover', () => dropzone.classList.add('dragover'));
        dropzone.addEventListener('dragleave', () => dropzone.classList.remove('dragover'));
        dropzone.addEventListener('drop', (event) => {
            dropzone.classList.remove('dragover');
            handleAndStoreFiles(event.dataTransfer.files);
        });
    }
});
