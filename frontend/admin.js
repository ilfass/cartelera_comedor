// Configuración
const API_URL = 'http://localhost:3000';

// Funciones de utilidad
function showMessage(message, type) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;
    messageDiv.textContent = message;
    document.body.insertBefore(messageDiv, document.body.firstChild);
    setTimeout(() => messageDiv.remove(), 3000);
}

// Funciones para el menú
async function loadMenu() {
    try {
        const response = await fetch(`${API_URL}/api/menu`);
        const menu = await response.json();
        const menuTable = document.getElementById('menu-table');
        menuTable.innerHTML = `
            <tr>
                <th>Día</th>
                <th>Menú General</th>
                <th>Menú Vegetariano</th>
                <th>Acciones</th>
            </tr>
        `;
        menu.forEach(item => {
            menuTable.innerHTML += `
                <tr>
                    <td>${item.dia}</td>
                    <td>${item.menu_general || ''}</td>
                    <td>${item.menu_vegetariano || ''}</td>
                    <td>
                        <button onclick="editMenu(${item.id})">Editar</button>
                        <button onclick="deleteMenu(${item.id})">Eliminar</button>
                    </td>
                </tr>
            `;
        });
    } catch (error) {
        console.error('Error al cargar el menú:', error);
        showMessage('Error al cargar el menú', 'error');
    }
}

async function saveMenu(event) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    const menuData = {
        dia: formData.get('dia'),
        menu_general: formData.get('menu_general'),
        menu_vegetariano: formData.get('menu_vegetariano')
    };

    try {
        const response = await fetch(`${API_URL}/api/menu`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Basic ' + btoa('admin:admin123')
            },
            body: JSON.stringify(menuData)
        });
        if (response.ok) {
            form.reset();
            loadMenu();
            showMessage('Menú guardado exitosamente', 'success');
        } else {
            const error = await response.json();
            showMessage(`Error al guardar el menú: ${error.error}`, 'error');
        }
    } catch (error) {
        console.error('Error al guardar el menú:', error);
        showMessage('Error al guardar el menú', 'error');
    }
}

async function deleteMenu(id) {
    if (confirm('¿Estás seguro de que deseas eliminar este menú?')) {
        try {
            const response = await fetch(`/api/menu/${id}`, {
                method: 'DELETE'
            });
            if (response.ok) {
                loadMenu();
            }
        } catch (error) {
            console.error('Error al eliminar el menú:', error);
        }
    }
}

// Funciones para los mensajes
async function loadMessages() {
    try {
        const response = await fetch('/api/mensajes');
        const messages = await response.json();
        const messagesTable = document.getElementById('messages-table');
        messagesTable.innerHTML = `
            <tr>
                <th>Título</th>
                <th>Contenido</th>
                <th>Fecha</th>
                <th>Destacado</th>
                <th>Acciones</th>
            </tr>
        `;
        messages.forEach(message => {
            messagesTable.innerHTML += `
                <tr>
                    <td>${message.titulo}</td>
                    <td>${message.contenido}</td>
                    <td>${new Date(message.fecha).toLocaleDateString()}</td>
                    <td>${message.destacado ? 'Sí' : 'No'}</td>
                    <td>
                        <button onclick="editMessage(${message.id})">Editar</button>
                        <button onclick="deleteMessage(${message.id})">Eliminar</button>
                    </td>
                </tr>
            `;
        });
    } catch (error) {
        console.error('Error al cargar los mensajes:', error);
    }
}

async function saveMessage(event) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    const messageData = {
        titulo: formData.get('titulo'),
        contenido: formData.get('contenido'),
        destacado: formData.get('destacado') === 'on'
    };

    try {
        const response = await fetch('/api/mensajes', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(messageData)
        });
        if (response.ok) {
            form.reset();
            loadMessages();
        }
    } catch (error) {
        console.error('Error al guardar el mensaje:', error);
    }
}

async function deleteMessage(id) {
    if (confirm('¿Estás seguro de que deseas eliminar este mensaje?')) {
        try {
            const response = await fetch(`/api/mensajes/${id}`, {
                method: 'DELETE'
            });
            if (response.ok) {
                loadMessages();
            }
        } catch (error) {
            console.error('Error al eliminar el mensaje:', error);
        }
    }
}

// Funciones para las imágenes
async function loadImages() {
    try {
        const response = await fetch('/api/imagenes');
        const images = await response.json();
        const imagesTable = document.getElementById('images-table');
        imagesTable.innerHTML = `
            <tr>
                <th>URL</th>
                <th>Título</th>
                <th>Descripción</th>
                <th>Acciones</th>
            </tr>
        `;
        images.forEach(image => {
            imagesTable.innerHTML += `
                <tr>
                    <td>${image.url}</td>
                    <td>${image.titulo || ''}</td>
                    <td>${image.descripcion || ''}</td>
                    <td>
                        <button onclick="deleteImage(${image.id})">Eliminar</button>
                    </td>
                </tr>
            `;
        });
    } catch (error) {
        console.error('Error al cargar las imágenes:', error);
    }
}

async function saveImage(event) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    const imageData = {
        url: formData.get('url'),
        titulo: formData.get('titulo'),
        descripcion: formData.get('descripcion')
    };

    try {
        const response = await fetch('/api/imagenes', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(imageData)
        });
        if (response.ok) {
            form.reset();
            loadImages();
        }
    } catch (error) {
        console.error('Error al guardar la imagen:', error);
    }
}

async function deleteImage(id) {
    if (confirm('¿Estás seguro de que deseas eliminar esta imagen?')) {
        try {
            const response = await fetch(`/api/imagenes/${id}`, {
                method: 'DELETE'
            });
            if (response.ok) {
                loadImages();
            }
        } catch (error) {
            console.error('Error al eliminar la imagen:', error);
        }
    }
}

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
    loadMenu();
    loadMessages();
    loadImages();
}); 