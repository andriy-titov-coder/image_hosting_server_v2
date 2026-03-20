document.addEventListener('DOMContentLoaded', function () {
    document.addEventListener('keydown', function (event) {
        if (event.key === 'F5' || event.key === 'Escape') {
            event.preventDefault();
            window.location.href = '/upload';
        }
    });

    const fileListWrapper = document.getElementById('file-list-wrapper');
    const uploadRedirectButton = document.getElementById('upload-tab-btn');

    if (uploadRedirectButton) {
        uploadRedirectButton.addEventListener('click', () => window.location.href = '/upload');
    }

    const displayFiles = () => {
        const storedFiles = JSON.parse(localStorage.getItem('uploadedImages')) || [];
        fileListWrapper.innerHTML = '';

        if (storedFiles.length === 0) {
            fileListWrapper.innerHTML = '<p class="upload__promt" style="text-align: center; margin-top: 50px;">No images uploaded yet.</p>';
            return;
        }

        const container = document.createElement('div');
        container.className = 'file-list-container';

        const header = document.createElement('div');
        header.className = 'file-list-header';
        header.innerHTML = `
            <div class="file-col file-col-name">Name</div>
            <div class="file-col file-col-url">Url</div>
            <div class="file-col file-col-delete">Delete</div>
        `;
        container.appendChild(header);

        const list = document.createElement('div');
        list.id = 'file-list';

        storedFiles.forEach((fileData, index) => {
            const fileItem = document.createElement('div');
            fileItem.className = 'file-list-item';
            fileItem.innerHTML = `
                <div class="file-col file-col-name">
                    <span class="file-icon"><img src="/static/img/group.png" alt="file icon"></span>
                    ${fileData.url ? `<img src="${fileData.url}" alt="thumbnail">` : ''}
                    <span class="file-name" title="${fileData.originalName || fileData.name}">${fileData.name}</span>
                </div>
                <div class="file-col file-col-url">https://group6-image-hosting-server.com/${fileData.name}</div>
                <div class="file-col file-col-delete">
                    <button class="delete-btn" data-index="${index}"><img src="/static/img/delete.png" alt="delete icon"></button>
                </div>
            `;
            list.appendChild(fileItem);
        });

        container.appendChild(list);
        fileListWrapper.appendChild(container);
        addDeleteListeners();
    };

    const addDeleteListeners = () => {
        document.querySelectorAll('.delete-btn').forEach(button => {
            button.addEventListener('click', (event) => {
                const indexToDelete = parseInt(event.currentTarget.dataset.index);
                let storedFiles = JSON.parse(localStorage.getItem('uploadedImages')) || [];
                storedFiles.splice(indexToDelete, 1);
                localStorage.setItem('uploadedImages', JSON.stringify(storedFiles));
                displayFiles();
            });
        });
    };

    displayFiles();
});