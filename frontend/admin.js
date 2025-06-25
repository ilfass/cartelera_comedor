// Configuración
const API_URL = 'http://localhost:3000';

// Verificar autenticación al cargar
function checkAuth() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/login.html';
        return;
    }
    
    // Verificar si el token es válido
    fetch(`${API_URL}/api/menu`, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
    .then(response => {
        if (!response.ok) {
            localStorage.removeItem('token');
            localStorage.removeItem('username');
            window.location.href = '/login.html';
        }
    })
    .catch(() => {
        localStorage.removeItem('token');
        localStorage.removeItem('username');
        window.location.href = '/login.html';
    });
}

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
    messageDiv.style.transition = 'opacity 0.3s ease';
    
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
        setTimeout(() => messageDiv.remove(), 300);
    }, 3000);
}

function getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
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
                <th>Menú Celíaco</th>
                <th>Acciones</th>
            </tr>
        `;
        
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
        showMessage('Error al cargar el menú', 'error');
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
            headers: getAuthHeaders(),
            body: JSON.stringify(menuData)
        });
        
        if (response.ok) {
            showMessage('Menú guardado exitosamente', 'success');
            loadMenu();
            document.getElementById('menu-form').reset();
        } else {
            const error = await response.json();
            throw new Error(error.message || 'Error al guardar el menú');
        }
    } catch (error) {
        console.error('Error:', error);
        showMessage(error.message || 'Error al guardar el menú', 'error');
    }
}

function editMenu(dia) {
    fetch(`${API_URL}/api/menu`)
        .then(response => response.json())
        .then(menu => {
            const item = menu.find(m => m.dia === dia);
            if (item) {
                document.getElementById('dia').value = item.dia;
                document.getElementById('menu_general').value = item.menu_general || '';
                document.getElementById('menu_vegetariano').value = item.menu_vegetariano || '';
                document.getElementById('menu-celiaco').value = item.menu_celiaco || '';
                
                // Cambiar el botón para indicar que estamos editando
                const submitBtn = document.querySelector('#menu-form button[type="submit"]');
                submitBtn.innerHTML = '<i class="fas fa-edit"></i> Actualizar Menú';
                submitBtn.onclick = (e) => updateMenu(e, dia);
                
                showMessage(`Editando menú de ${dia}`, 'success');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showMessage('Error al cargar el menú para editar', 'error');
        });
}

async function updateMenu(event, dia) {
    event.preventDefault();
    const menuData = {
        dia: document.getElementById('dia').value,
        menu_general: document.getElementById('menu_general').value,
        menu_vegetariano: document.getElementById('menu_vegetariano').value,
        menu_celiaco: document.getElementById('menu-celiaco').value
    };
    
    try {
        const response = await fetch(`${API_URL}/api/menu/${dia}`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify(menuData)
        });
        
        if (response.ok) {
            showMessage('Menú actualizado exitosamente', 'success');
            loadMenu();
            document.getElementById('menu-form').reset();
            
            // Restaurar el botón original
            const submitBtn = document.querySelector('#menu-form button[type="submit"]');
            submitBtn.innerHTML = '<i class="fas fa-save"></i> Guardar Menú';
            submitBtn.onclick = saveMenu;
        } else {
            const error = await response.json();
            throw new Error(error.message || 'Error al actualizar el menú');
        }
    } catch (error) {
        console.error('Error:', error);
        showMessage(error.message || 'Error al actualizar el menú', 'error');
    }
}

async function deleteMenu(dia) {
    if (confirm('¿Estás seguro de que deseas eliminar este menú?')) {
        try {
            const response = await fetch(`${API_URL}/api/menu/${dia}`, {
                method: 'DELETE',
                headers: getAuthHeaders()
            });
            if (response.ok) {
                showMessage('Menú eliminado exitosamente', 'success');
                loadMenu();
            } else {
                const error = await response.json();
                throw new Error(error.message || 'Error al eliminar el menú');
            }
        } catch (error) {
            console.error('Error al eliminar el menú:', error);
            showMessage(error.message || 'Error al eliminar el menú', 'error');
        }
    }
}

// Funciones para los mensajes
async function loadMessages() {
    try {
        const response = await fetch(`${API_URL}/api/mensajes`);
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
            const destacadoClass = message.destacado ? 'highlighted-message' : '';
            const destacadoBadge = message.destacado ? 
                '<span class="destacado-badge">Destacado</span>' : 
                '<span class="no-destacado-badge">Normal</span>';
            
            messagesTable.innerHTML += `
                <tr class="${destacadoClass}">
                    <td>${message.titulo}</td>
                    <td>${message.contenido}</td>
                    <td>${new Date(message.fecha).toLocaleDateString()}</td>
                    <td>${destacadoBadge}</td>
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
        titulo: formData.get('titulo'),
        contenido: formData.get('contenido'),
        destacado: formData.get('destacado') === 'on'
    };

    try {
        const response = await fetch(`${API_URL}/api/mensajes`, {
            method: 'POST',
            headers: getAuthHeaders(),
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
                headers: getAuthHeaders()
            });
            if (response.ok) {
                showMessage('Mensaje eliminado exitosamente', 'success');
                loadMessages();
            } else {
                const error = await response.json();
                throw new Error(error.message || 'Error al eliminar el mensaje');
            }
        } catch (error) {
            console.error('Error al eliminar el mensaje:', error);
            showMessage(error.message || 'Error al eliminar el mensaje', 'error');
        }
    }
}

function editMessage(id) {
    // Implementar edición de mensajes
    showMessage('Función de edición en desarrollo', 'error');
}

// Funciones para las imágenes
async function loadImages() {
    try {
        const response = await fetch(`${API_URL}/api/imagenes`);
        const images = await response.json();
        const imagesTable = document.getElementById('images-table');
        imagesTable.innerHTML = `
            <tr>
                <th>Título</th>
                <th>URL</th>
                <th>Fecha</th>
                <th>Acciones</th>
            </tr>
        `;
        images.forEach(image => {
            imagesTable.innerHTML += `
                <tr>
                    <td>${image.titulo}</td>
                    <td>${image.url}</td>
                    <td>${new Date(image.fecha).toLocaleDateString()}</td>
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

// Función de vista previa de imagen
function previewImage(event) {
    const file = event.target.files[0];
    const preview = document.getElementById('image-preview');
    const previewImg = document.getElementById('preview-img');
    const urlInput = document.getElementById('image-url');
    
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            previewImg.src = e.target.result;
            preview.style.display = 'block';
            urlInput.value = ''; // Limpiar URL si se sube un archivo
        };
        reader.readAsDataURL(file);
    } else {
        preview.style.display = 'none';
    }
}

async function saveImage(event) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    
    // Verificar si se subió un archivo o se proporcionó una URL
    const file = formData.get('imagen');
    const url = formData.get('url');
    
    if (!file && !url) {
        showMessage('Debe subir una imagen o proporcionar una URL', 'error');
        return;
    }
    
    try {
        let imageData;
        
        if (file && file.size > 0) {
            // Subir archivo - usar el endpoint correcto
            const uploadData = new FormData();
            uploadData.append('title', formData.get('titulo'));
            uploadData.append('image', file); // Cambiar 'imagen' por 'image' para que coincida con el backend
            
            const response = await fetch(`${API_URL}/api/imagenes`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: uploadData
            });
            
            if (response.ok) {
                form.reset();
                document.getElementById('image-preview').style.display = 'none';
                await loadImages();
                showMessage('Imagen subida exitosamente', 'success');
            } else {
                const error = await response.json();
                throw new Error(error.message || 'Error al subir la imagen');
            }
        } else {
            // Usar URL
            imageData = {
                titulo: formData.get('titulo'),
                url: url
            };
            
            const response = await fetch(`${API_URL}/api/imagenes`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify(imageData)
            });
            
            if (response.ok) {
                form.reset();
                document.getElementById('image-preview').style.display = 'none';
                await loadImages();
                showMessage('Imagen guardada exitosamente', 'success');
            } else {
                const error = await response.json();
                throw new Error(error.message || 'Error al guardar la imagen');
            }
        }
    } catch (error) {
        console.error('Error al guardar la imagen:', error);
        showMessage(error.message || 'Error al guardar la imagen', 'error');
    }
}

async function deleteImage(id) {
    if (confirm('¿Estás seguro de que deseas eliminar esta imagen?')) {
        try {
            const response = await fetch(`${API_URL}/api/imagenes/${id}`, {
                method: 'DELETE',
                headers: getAuthHeaders()
            });
            if (response.ok) {
                showMessage('Imagen eliminada exitosamente', 'success');
                loadImages();
            } else {
                const error = await response.json();
                throw new Error(error.message || 'Error al eliminar la imagen');
            }
        } catch (error) {
            console.error('Error al eliminar la imagen:', error);
            showMessage(error.message || 'Error al eliminar la imagen', 'error');
        }
    }
}

// Funciones para la configuración
async function loadConfig() {
    try {
        const response = await fetch(`${API_URL}/api/config`);
        const config = await response.json();
        
        // Cargar el intervalo del carrusel (convertir de ms a segundos)
        const intervaloMs = config.intervalo_carrusel || 5000;
        const intervaloSegundos = Math.round(intervaloMs / 1000);
        document.getElementById('intervalo-carrusel').value = intervaloSegundos;
    } catch (error) {
        console.error('Error al cargar la configuración:', error);
        showMessage('Error al cargar la configuración', 'error');
    }
}

async function saveConfig(event) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    const intervaloSegundos = parseInt(formData.get('intervalo'));
    
    if (intervaloSegundos < 1 || intervaloSegundos > 60) {
        showMessage('El intervalo debe estar entre 1 y 60 segundos', 'error');
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/api/config/intervalo_carrusel`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify({ valor: intervaloSegundos * 1000 }) // Convertir a milisegundos
        });
        
        if (response.ok) {
            showMessage('Configuración guardada exitosamente', 'success');
        } else {
            const error = await response.json();
            showMessage(`Error al guardar la configuración: ${error.message}`, 'error');
        }
    } catch (error) {
        console.error('Error al guardar la configuración:', error);
        showMessage('Error al guardar la configuración', 'error');
    }
}

// Funciones para los códigos QR
async function loadQR() {
    try {
        const response = await fetch(`${API_URL}/api/qr`);
        const qrCodes = await response.json();
        const qrTable = document.getElementById('qr-table');
        qrTable.innerHTML = `
            <tr>
                <th>Título</th>
                <th>URL</th>
                <th>Descripción</th>
                <th>Estado</th>
                <th>Fecha</th>
                <th>Acciones</th>
            </tr>
        `;
        
        qrCodes.forEach(qr => {
            const estadoClass = qr.activo ? 'qr-activo' : 'qr-inactivo';
            const estadoBadge = qr.activo ? 
                '<span class="activo-badge">Activo</span>' : 
                '<span class="inactivo-badge">Inactivo</span>';
            
            qrTable.innerHTML += `
                <tr class="${estadoClass}">
                    <td>${qr.titulo}</td>
                    <td><a href="${qr.url}" target="_blank" class="url-link">${qr.url}</a></td>
                    <td>${qr.descripcion || 'Sin descripción'}</td>
                    <td>${estadoBadge}</td>
                    <td>${new Date(qr.fecha).toLocaleDateString()}</td>
                    <td>
                        <button onclick="editQR(${qr.id})" class="btn-edit">Editar</button>
                        <button onclick="deleteQR(${qr.id})" class="btn-delete">Eliminar</button>
                    </td>
                </tr>
            `;
        });
    } catch (error) {
        console.error('Error al cargar los códigos QR:', error);
        showMessage('Error al cargar los códigos QR', 'error');
    }
}

async function saveQR(event) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    
    const qrData = {
        titulo: formData.get('titulo'),
        url: formData.get('url'),
        descripcion: formData.get('descripcion'),
        activo: formData.get('activo') === 'on'
    };
    
    try {
        const response = await fetch(`${API_URL}/api/qr`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(qrData)
        });
        
        if (response.ok) {
            showMessage('Código QR guardado exitosamente', 'success');
            loadQR();
            form.reset();
            document.getElementById('qr-activo').checked = true; // Reset checkbox
        } else {
            const error = await response.json();
            throw new Error(error.message || 'Error al guardar el código QR');
        }
    } catch (error) {
        console.error('Error:', error);
        showMessage(error.message || 'Error al guardar el código QR', 'error');
    }
}

function editQR(id) {
    fetch(`${API_URL}/api/qr`)
        .then(response => response.json())
        .then(qrCodes => {
            const qr = qrCodes.find(q => q.id === id);
            if (qr) {
                document.getElementById('qr-titulo').value = qr.titulo;
                document.getElementById('qr-url').value = qr.url;
                document.getElementById('qr-descripcion').value = qr.descripcion || '';
                document.getElementById('qr-activo').checked = qr.activo;
                
                // Cambiar el formulario para actualizar en lugar de crear
                const form = document.getElementById('qr-form');
                form.onsubmit = (e) => updateQR(e, id);
                form.querySelector('button[type="submit"]').textContent = 'Actualizar Código QR';
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showMessage('Error al cargar el código QR para editar', 'error');
        });
}

async function updateQR(event, id) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    
    const qrData = {
        titulo: formData.get('titulo'),
        url: formData.get('url'),
        descripcion: formData.get('descripcion'),
        activo: formData.get('activo') === 'on'
    };
    
    try {
        const response = await fetch(`${API_URL}/api/qr/${id}`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify(qrData)
        });
        
        if (response.ok) {
            showMessage('Código QR actualizado exitosamente', 'success');
            loadQR();
            form.reset();
            document.getElementById('qr-activo').checked = true;
            
            // Restaurar el formulario para crear nuevos
            form.onsubmit = saveQR;
            form.querySelector('button[type="submit"]').textContent = 'Guardar Código QR';
        } else {
            const error = await response.json();
            throw new Error(error.message || 'Error al actualizar el código QR');
        }
    } catch (error) {
        console.error('Error:', error);
        showMessage(error.message || 'Error al actualizar el código QR', 'error');
    }
}

async function deleteQR(id) {
    if (confirm('¿Estás seguro de que deseas eliminar este código QR?')) {
        try {
            const response = await fetch(`${API_URL}/api/qr/${id}`, {
                method: 'DELETE',
                headers: getAuthHeaders()
            });
            if (response.ok) {
                showMessage('Código QR eliminado exitosamente', 'success');
                loadQR();
            } else {
                const error = await response.json();
                throw new Error(error.message || 'Error al eliminar el código QR');
            }
        } catch (error) {
            console.error('Error al eliminar el código QR:', error);
            showMessage(error.message || 'Error al eliminar el código QR', 'error');
        }
    }
}

// Función de logout
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    window.location.href = '/login.html';
}

// Inicialización
document.addEventListener('DOMContentLoaded', function() {
    checkAuth();
    loadMenu();
    loadMessages();
    loadImages();
    loadQR();
    loadConfig(); // Cargar configuración
    
    // Agregar botón de logout al header
    const header = document.querySelector('h1');
    if (header) {
        const logoutBtn = document.createElement('button');
        logoutBtn.textContent = 'Cerrar Sesión';
        logoutBtn.style.cssText = `
            position: absolute;
            top: 20px;
            right: 20px;
            padding: 8px 16px;
            background: #dc2626;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
        `;
        logoutBtn.onclick = logout;
        header.parentElement.style.position = 'relative';
        header.parentElement.appendChild(logoutBtn);
    }
}); 