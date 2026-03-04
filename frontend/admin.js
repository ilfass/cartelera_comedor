// Configuración - se carga desde config.js
const API_URL = window.APP_CONFIG?.API_URL || '/api';

// Verificar autenticación al cargar
function checkAuth() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/login.html';
        return;
    }
    
    // Verificar si el token es válido
    fetch(`${API_URL}/menu`, {
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

// Función para renovar el token automáticamente
async function renovarToken() {
    try {
        // Obtener credenciales del localStorage o usar las por defecto
        const username = localStorage.getItem('admin_username') || 'admcomedor';
        const password = localStorage.getItem('admin_password') || 'adm.comedor.2025';
        
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username: username,
                password: password
            })
        });

        if (response.ok) {
            const data = await response.json();
            localStorage.setItem('token', data.token);
            console.log('Token renovado exitosamente');
            return data.token;
        } else {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Error al renovar el token');
        }
    } catch (error) {
        console.error('Error al renovar token:', error);
        // Si no se puede renovar, redirigir al login
        localStorage.removeItem('token');
        localStorage.removeItem('admin_username');
        localStorage.removeItem('admin_password');
        window.location.href = 'login.html';
        throw error;
    }
}

// Función mejorada para manejar peticiones con renovación automática de token
async function fetchWithTokenRenewal(url, options = {}) {
    try {
        // Primera petición
        let response = await fetch(url, options);
        
        // Si el token expiró, intentar renovarlo
        if (response.status === 401) {
            const errorData = await response.json();
            if (errorData.code === 'TOKEN_EXPIRED' || errorData.code === 'INVALID_TOKEN') {
                console.log('Token expirado, renovando...');
                const newToken = await renovarToken();
                
                // Actualizar el token en los headers
                if (options.headers) {
                    options.headers.Authorization = `Bearer ${newToken}`;
                }
                
                // Reintentar la petición con el nuevo token
                response = await fetch(url, options);
            }
        }
        
        return response;
    } catch (error) {
        console.error('Error en fetchWithTokenRenewal:', error);
        throw error;
    }
}

// Funciones para el menú
async function loadMenu() {
    try {
        const response = await fetch(`${API_URL}/menu`);
        const menu = await response.json();
        const menuTable = document.getElementById('menu-table');
        menuTable.innerHTML = `
            <tr>
                <th>Día</th>
                <th>Menú Clásico</th>
                <th>Menú Vegetariano</th>
                <th>Menú Celíaco</th>
                <th>Acciones</th>
            </tr>
        `;
        
        menu.forEach(item => {
            const row = document.createElement('tr');
            const dia = item.dia || 'Sin día asignado';
            const hasValidDay = item.dia && item.dia.trim() !== '';
            
            row.innerHTML = `
                <td>${dia}</td>
                <td>${item.menu_general || 'No disponible'}</td>
                <td>${item.menu_vegetariano || 'No disponible'}</td>
                <td>${item.menu_celiaco || 'No disponible'}</td>
                <td>
                    ${hasValidDay ? `<button onclick="editMenu('${item.dia}')" class="btn-edit">Editar</button>` : '<span class="text-muted">No editable</span>'}
                    ${hasValidDay ? `<button onclick="deleteMenu('${item.dia}')" class="btn-delete">Eliminar</button>` : `<button onclick="deleteMenuById(${item.id})" class="btn-delete">Eliminar</button>`}
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
    
    // Validación: No permitir guardar menús sin día asignado
    if (!menuData.dia || menuData.dia.trim() === '') {
        showMessage('Error: Debe seleccionar un día para el menú', 'error');
        document.getElementById('dia').focus();
        return;
    }
    
    // Validación adicional: Verificar que el día sea válido
    const diasValidos = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];
    const diaNormalizado = menuData.dia.toLowerCase().trim();
    if (!diasValidos.includes(diaNormalizado)) {
        showMessage('Error: Debe seleccionar un día válido de la semana', 'error');
        document.getElementById('dia').focus();
        return;
    }
    
    try {
        const response = await fetchWithTokenRenewal(`${API_URL}/menu`, {
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
    fetch(`${API_URL}/menu`)
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
                
                // Remover el onsubmit del formulario y agregar el onclick al botón
                const form = document.getElementById('menu-form');
                form.onsubmit = null;
                submitBtn.onclick = (e) => {
                    e.preventDefault();
                    updateMenu(e, dia);
                };
                
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
    
    // Validación: No permitir actualizar menús sin día asignado
    if (!menuData.dia || menuData.dia.trim() === '') {
        showMessage('Error: Debe seleccionar un día para el menú', 'error');
        document.getElementById('dia').focus();
        return;
    }
    
    // Validación adicional: Verificar que el día sea válido
    const diasValidos = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];
    const diaNormalizado = menuData.dia.toLowerCase().trim();
    if (!diasValidos.includes(diaNormalizado)) {
        showMessage('Error: Debe seleccionar un día válido de la semana', 'error');
        document.getElementById('dia').focus();
        return;
    }
    
    try {
        const response = await fetchWithTokenRenewal(`${API_URL}/menu/${encodeURIComponent(dia)}`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify(menuData)
        });
        
        if (response.ok) {
            showMessage('Menú actualizado exitosamente', 'success');
            loadMenu();
            document.getElementById('menu-form').reset();
            
            // Restaurar el botón original y el formulario
            const submitBtn = document.querySelector('#menu-form button[type="submit"]');
            submitBtn.innerHTML = '<i class="fas fa-save"></i> Guardar Menú';
            submitBtn.onclick = null;
            
            const form = document.getElementById('menu-form');
            form.onsubmit = saveMenu;
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
            const response = await fetchWithTokenRenewal(`${API_URL}/menu/${encodeURIComponent(dia)}`, {
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

async function deleteMenuById(id) {
    if (confirm('¿Estás seguro de que deseas eliminar este menú?')) {
        try {
            // Para menús sin día, usamos una estrategia diferente
            // Primero obtenemos todos los menús para encontrar el que tiene el ID
            const menuResponse = await fetch(`${API_URL}/menu`);
            const menus = await menuResponse.json();
            const menuToDelete = menus.find(m => m.id == id);
            
            if (!menuToDelete) {
                throw new Error('Menú no encontrado');
            }
            
            // Si el menú tiene un día válido, usamos el endpoint normal
            if (menuToDelete.dia && menuToDelete.dia.trim() !== '') {
                const response = await fetchWithTokenRenewal(`${API_URL}/menu/${encodeURIComponent(menuToDelete.dia)}`, {
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
            } else {
                // Para menús sin día, mostramos un mensaje de que no se pueden eliminar
                showMessage('Los menús sin día asignado no se pueden eliminar desde la interfaz. Contacte al administrador.', 'warning');
            }
        } catch (error) {
            console.error('Error al eliminar el menú:', error);
            showMessage(error.message || 'Error al eliminar el menú', 'error');
        }
    }
}

// Función para poblar datos de prueba
async function seedTestData() {
    if (!confirm('¿Estás seguro de que deseas crear datos de prueba?\n\nEsto agregará menús de ejemplo para probar la funcionalidad.')) {
        return;
    }
    
    try {
        showMessage('Creando datos de prueba...', 'info');
        
        const response = await fetchWithTokenRenewal(`${API_URL}/admin/seed-test-data`, {
            method: 'POST',
            headers: getAuthHeaders()
        });
        
        if (response.ok) {
            const result = await response.json();
            
            let message = `✅ Datos de prueba creados exitosamente!\n\n`;
            message += `📋 Menús creados: ${result.insertedCount}\n`;
            
            if (result.errors && result.errors.length > 0) {
                message += `⚠️ Errores: ${result.errors.length}\n`;
            }
            
            showMessage(message, 'success');
            
            // Recargar la tabla de menús
            loadMenu();
        } else {
            const error = await response.json();
            throw new Error(error.message || 'Error al crear datos de prueba');
        }
    } catch (error) {
        console.error('Error al crear datos de prueba:', error);
        showMessage(error.message || 'Error al crear datos de prueba', 'error');
    }
}

// Función para limpiar y completar menús
async function cleanupMenus() {
    if (!confirm('¿Estás seguro de que deseas limpiar los menús sin día asignado y completar los días faltantes de la semana?\n\nEsto eliminará permanentemente los menús sin día y agregará menús "A confirmar" para los días faltantes.')) {
        return;
    }
    
    try {
        showMessage('Iniciando limpieza de menús...', 'info');
        
        const response = await fetchWithTokenRenewal(`${API_URL}/admin/cleanup-menus`, {
            method: 'POST',
            headers: getAuthHeaders()
        });
        
        if (response.ok) {
            const result = await response.json();
            
            let message = `✅ Limpieza completada exitosamente!\n\n`;
            message += `📋 Menús eliminados: ${result.deletedMenus}\n`;
            message += `➕ Menús agregados: ${result.addedMenus}\n`;
            
            if (result.addedDays && result.addedDays.length > 0) {
                message += `📅 Días agregados: ${result.addedDays.join(', ')}\n`;
            }
            
            showMessage(message, 'success');
            
            // Recargar la tabla de menús
            loadMenu();
        } else {
            const error = await response.json();
            throw new Error(error.message || 'Error al limpiar los menús');
        }
    } catch (error) {
        console.error('Error al limpiar menús:', error);
        showMessage(error.message || 'Error al limpiar los menús', 'error');
    }
}

// Funciones para los mensajes
async function loadMessages() {
    try {
        const response = await fetch(`${API_URL}/mensajes`);
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
        const response = await fetchWithTokenRenewal(`${API_URL}/mensajes`, {
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
            const response = await fetchWithTokenRenewal(`${API_URL}/mensajes/${id}`, {
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
    fetch(`${API_URL}/mensajes`)
        .then(response => response.json())
        .then(messages => {
            const message = messages.find(m => m.id === id);
            if (message) {
                document.getElementById('titulo').value = message.titulo;
                document.getElementById('contenido').value = message.contenido;
                document.getElementById('destacado').checked = message.destacado;
                
                // Cambiar el botón para indicar que estamos editando
                const submitBtn = document.querySelector('#message-form button[type="submit"]');
                submitBtn.innerHTML = '<i class="fas fa-edit"></i> Actualizar Mensaje';
                
                // Remover el onsubmit del formulario y agregar el onclick al botón
                const form = document.getElementById('message-form');
                form.onsubmit = null;
                submitBtn.onclick = (e) => {
                    e.preventDefault();
                    updateMessage(e, id);
                };
                
                showMessage(`Editando mensaje: ${message.titulo}`, 'success');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showMessage('Error al cargar el mensaje para editar', 'error');
        });
}

async function updateMessage(event, id) {
    event.preventDefault();
    const form = event.target.closest('form');
    const formData = new FormData(form);
    const messageData = {
        titulo: formData.get('titulo'),
        contenido: formData.get('contenido'),
        destacado: formData.get('destacado') === 'on'
    };

    try {
        const response = await fetchWithTokenRenewal(`${API_URL}/mensajes/${id}`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify(messageData)
        });
        if (response.ok) {
            form.reset();
            await loadMessages();
            showMessage('Mensaje actualizado exitosamente', 'success');
            
            // Restaurar el botón original y el formulario
            const submitBtn = document.querySelector('#message-form button[type="submit"]');
            submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Guardar Mensaje';
            submitBtn.onclick = null;
            
            form.onsubmit = saveMessage;
        } else {
            const error = await response.json();
            showMessage(`Error al actualizar el mensaje: ${error.message}`, 'error');
        }
    } catch (error) {
        console.error('Error al actualizar el mensaje:', error);
        showMessage('Error al actualizar el mensaje', 'error');
    }
}

// Funciones para las imágenes
async function loadImages() {
    try {
        const response = await fetch(`${API_URL}/imagenes`);
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
        showMessage('Debes subir una imagen o proporcionar una URL', 'error');
        return;
    }
    
    try {
        if (file && file.size > 0) {
            // Subir archivo
            const uploadFormData = new FormData();
            uploadFormData.append('image', file);
            uploadFormData.append('title', formData.get('titulo'));
            
            const uploadResponse = await fetchWithTokenRenewal(`${API_URL}/imagenes`, {
                method: 'POST',
                headers: {
                    'Authorization': getAuthHeaders().Authorization
                },
                body: uploadFormData
            });
            
            if (uploadResponse.ok) {
                showMessage('Imagen guardada exitosamente', 'success');
                form.reset();
                document.getElementById('image-preview').style.display = 'none';
                loadImages();
            } else {
                const error = await uploadResponse.json();
                throw new Error(error.message || 'Error al subir la imagen');
            }
        } else {
            // Para URLs, necesitamos crear un endpoint separado o modificar el backend
            // Por ahora, mostraremos un mensaje de error
            showMessage('La funcionalidad de URL directa no está implementada. Por favor, sube un archivo.', 'error');
        }
    } catch (error) {
        console.error('Error al guardar la imagen:', error);
        showMessage(error.message || 'Error al guardar la imagen', 'error');
    }
}

async function deleteImage(id) {
    if (confirm('¿Estás seguro de que deseas eliminar esta imagen?')) {
        try {
            const response = await fetchWithTokenRenewal(`${API_URL}/imagenes/${id}`, {
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

// Funciones para los códigos QR
async function loadQR() {
    try {
        const response = await fetch(`${API_URL}/qr`);
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
        const response = await fetchWithTokenRenewal(`${API_URL}/qr`, {
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
    fetch(`${API_URL}/qr`)
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
        const response = await fetchWithTokenRenewal(`${API_URL}/qr/${id}`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify(qrData)
        });
        
        if (response.ok) {
            showMessage('Código QR actualizado exitosamente', 'success');
            loadQR();
            form.reset();
            document.getElementById('qr-activo').checked = true;
            
            // Restaurar el formulario original
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
            const response = await fetchWithTokenRenewal(`${API_URL}/qr/${id}`, {
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
    localStorage.removeItem('admin_username');
    localStorage.removeItem('admin_password');
    window.location.href = '/login.html';
}

// Inicialización
document.addEventListener('DOMContentLoaded', function() {
    checkAuth();
    loadMenu();
    loadMessages();
    loadImages();
    loadQR();
    
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