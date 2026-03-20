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

    const handleAndStoreFiles = (files) => {
        if (!files || files.length === 0) return;

        const storedFiles = JSON.parse(localStorage.getItem('uploadedImages')) || [];
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
        const MAX_SIZE_BYTES = 5 * 1024 * 1024;
        let filesAdded = false;
        let lastFileName = '';

        const getNextImageNumber = () => {
            const imageFiles = storedFiles.filter(file => file.name.startsWith('image'));
            return imageFiles.length + 1;
        };

        const getFileExtension = (filename) => {
            return filename.substring(filename.lastIndexOf('.'));
        };

        for (const file of files) {
            if (allowedTypes.includes(file.type) && file.size <= MAX_SIZE_BYTES) {
                const imageNumber = getNextImageNumber();
                const autoName = `image${String(imageNumber).padStart(2, '0')}${getFileExtension(file.name)}`;

                const reader = new FileReader();
                reader.onload = (event) => {
                    const fileData = {
                        name: autoName,
                        originalName: file.name,
                        url: event.target.result
                    };
                    storedFiles.push(fileData);
                    localStorage.setItem('uploadedImages', JSON.stringify(storedFiles));
                };
                reader.readAsDataURL(file);
                filesAdded = true;
                lastFileName = autoName;
            }
        }

        if (filesAdded && currentUploadInput) {
            currentUploadInput.value = `https://group6-image-hosting-server.com/${lastFileName}`;
            alert("Files selected successfully! Go to the 'Images' tab to view them.");
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