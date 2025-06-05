// Configuración
const API_URL = 'http://localhost:3000';
const AUTH_HEADER = {
    'Authorization': 'Basic ' + btoa('admin:admin123')
};

// Funciones de utilidad
function showMessage(message, type) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;
    messageDiv.textContent = message;
    messageDiv.style.position = 'fixed';
    messageDiv.style.top = '20px';
    messageDiv.style.right = '20px';
    messageDiv.style.padding = '15px 25px';
    messageDiv.style.borderRadius = '5px';
    messageDiv.style.zIndex = '1000';
    messageDiv.style.fontSize = '1.2em';
    messageDiv.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
    
    if (type === 'success') {
        messageDiv.style.backgroundColor = '#d4edda';
        messageDiv.style.color = '#155724';
        messageDiv.style.border = '1px solid #c3e6cb';
    } else {
        messageDiv.style.backgroundColor = '#f8d7da';
        messageDiv.style.color = '#721c24';
        messageDiv.style.border = '1px solid #f5c6cb';
    }
    
    document.body.appendChild(messageDiv);
    setTimeout(() => {
        messageDiv.style.opacity = '0';
        messageDiv.style.transition = 'opacity 0.5s ease';
        setTimeout(() => messageDiv.remove(), 500);
    }, 3000);
}

// Funciones para el menú
async function loadMenu() {
    try {
        const response = await fetch(`${API_URL}/api/menu`);
        const menu = await response.json();
        const menuTable = document.getElementById('menu-table');
        menuTable.innerHTML = '';
        
        menu.forEach(item => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${item.dia}</td>
                <td>${item.menu_general || 'No disponible'}</td>
                <td>${item.menu_vegetariano || 'No disponible'}</td>
                <td>${item.menu_celiaco || 'No disponible'}</td>
                <td>
                    <button onclick="editMenu('${item.dia}')" class="btn-edit">Editar</button>
                    <button onclick="deleteMenu('${item.dia}')" class="btn-delete">Eliminar</button>
                </td>
            `;
            menuTable.appendChild(row);
        });
    } catch (error) {
        console.error('Error al cargar el menú:', error);
        alert('Error al cargar el menú');
    }
}

async function saveMenu(event) {
    event.preventDefault();
    const menuData = {
        dia: document.getElementById('dia').value,
        menu_general: document.getElementById('menu_general').value,
        menu_vegetariano: document.getElementById('menu_vegetariano').value,
        menu_celiaco: document.getElementById('menu-celiaco').value
    };
    
    try {
        const response = await fetch(`${API_URL}/api/menu`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(menuData)
        });
        
        if (response.ok) {
            alert('Menú guardado exitosamente');
            loadMenu();
            document.getElementById('menu-form').reset();
        } else {
            throw new Error('Error al guardar el menú');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error al guardar el menú');
    }
}

function editMenu(dia) {
    fetch(`${API_URL}/api/menu/${dia}`)
        .then(response => response.json())
        .then(data => {
            document.getElementById('dia').value = data.dia;
            document.getElementById('menu_general').value = data.menu_general || '';
            document.getElementById('menu_vegetariano').value = data.menu_vegetariano || '';
            document.getElementById('menu-celiaco').value = data.menu_celiaco || '';
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Error al cargar el menú para editar');
        });
}

async function deleteMenu(dia) {
    if (confirm('¿Estás seguro de que deseas eliminar este menú?')) {
        try {
            const response = await fetch(`${API_URL}/api/menu/${dia}`, {
                method: 'DELETE',
                headers: AUTH_HEADER
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
        const response = await fetch(`${API_URL}/api/mensajes`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
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
                        <button onclick="editMessage(${message.id})" class="edit-button">Editar</button>
                        <button onclick="deleteMessage(${message.id})" class="delete-button">Eliminar</button>
                    </td>
                </tr>
            `;
        });
    } catch (error) {
        console.error('Error al cargar los mensajes:', error);
        showMessage('Error al cargar los mensajes', 'error');
    }
}

async function saveMessage(event) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    const messageData = {
        titulo: formData.get('title'),
        contenido: formData.get('content'),
        destacado: formData.get('highlight') === 'on'
    };

    try {
        const response = await fetch(`${API_URL}/api/mensajes`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify(messageData)
        });
        if (response.ok) {
            form.reset();
            await loadMessages();
            showMessage('Mensaje guardado exitosamente', 'success');
        } else {
            const error = await response.json();
            showMessage(`Error al guardar el mensaje: ${error.message}`, 'error');
        }
    } catch (error) {
        console.error('Error al guardar el mensaje:', error);
        showMessage('Error al guardar el mensaje', 'error');
    }
}

async function deleteMessage(id) {
    if (confirm('¿Estás seguro de que deseas eliminar este mensaje?')) {
        try {
            const response = await fetch(`${API_URL}/api/mensajes/${id}`, {
                method: 'DELETE',
                headers: AUTH_HEADER
            });
            if (response.ok) {
                loadMessages();
                showMessage('Mensaje eliminado exitosamente', 'success');
            }
        } catch (error) {
            console.error('Error al eliminar el mensaje:', error);
            showMessage('Error al eliminar el mensaje', 'error');
        }
    }
}

// Funciones para las imágenes
async function loadImages() {
    try {
        const response = await fetch(`${API_URL}/api/imagenes`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        const images = await response.json();
        const imagesTable = document.getElementById('images-table');
        imagesTable.innerHTML = `
            <tr>
                <th>Imagen</th>
                <th>Título</th>
                <th>Acciones</th>
            </tr>
        `;
        images.forEach(image => {
            imagesTable.innerHTML += `
                <tr>
                    <td>
                        <div class="image-container">
                            <img src="${image.url}" alt="${image.titulo}" />
                        </div>
                    </td>
                    <td>${image.titulo || ''}</td>
                    <td>
                        <button onclick="deleteImage(${image.id})" class="delete-button">Eliminar</button>
                    </td>
                </tr>
            `;
        });
    } catch (error) {
        console.error('Error al cargar las imágenes:', error);
        showMessage('Error al cargar las imágenes', 'error');
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
        const response = await fetch(`${API_URL}/api/imagenes`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...AUTH_HEADER
            },
            body: JSON.stringify(imageData)
        });
        if (response.ok) {
            form.reset();
            loadImages();
            showMessage('Imagen guardada exitosamente', 'success');
        } else {
            const error = await response.json();
            showMessage(`Error al guardar la imagen: ${error.error}`, 'error');
        }
    } catch (error) {
        console.error('Error al guardar la imagen:', error);
        showMessage('Error al guardar la imagen', 'error');
    }
}

async function deleteImage(id) {
    if (confirm('¿Estás seguro de que deseas eliminar esta imagen?')) {
        try {
            const response = await fetch(`${API_URL}/api/imagenes/${id}`, {
                method: 'DELETE',
                headers: AUTH_HEADER
            });
            if (response.ok) {
                loadImages();
                showMessage('Imagen eliminada exitosamente', 'success');
            }
        } catch (error) {
            console.error('Error al eliminar la imagen:', error);
            showMessage('Error al eliminar la imagen', 'error');
        }
    }
}

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
    loadMenu();
    loadImages();
}); 