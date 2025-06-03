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

// Manejo del formulario de menú
document.getElementById('menu-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const fecha = document.getElementById('menu-fecha').value;
    const plato = document.getElementById('menu-plato').value;
    const tipo = document.getElementById('menu-tipo').value;
    
    try {
        const response = await fetch(`${API_URL}/api/admin/menu`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ fecha, plato, tipo })
        });
        
        if (response.ok) {
            showMessage('Menú agregado exitosamente', 'success');
            e.target.reset();
        } else {
            throw new Error('Error al agregar el menú');
        }
    } catch (error) {
        showMessage(error.message, 'error');
    }
});

// Manejo del formulario de mensajes
document.getElementById('message-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const contenido = document.getElementById('message-contenido').value;
    const fecha = document.getElementById('message-fecha').value;
    
    try {
        const response = await fetch(`${API_URL}/api/admin/messages`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ contenido, fecha })
        });
        
        if (response.ok) {
            showMessage('Mensaje agregado exitosamente', 'success');
            e.target.reset();
        } else {
            throw new Error('Error al agregar el mensaje');
        }
    } catch (error) {
        showMessage(error.message, 'error');
    }
});

// Manejo del formulario de carrusel
document.getElementById('carousel-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const url = document.getElementById('carousel-url').value;
    const alt = document.getElementById('carousel-alt').value;
    
    try {
        const response = await fetch(`${API_URL}/api/admin/carousel`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ url, alt })
        });
        
        if (response.ok) {
            showMessage('Imagen agregada exitosamente', 'success');
            e.target.reset();
        } else {
            throw new Error('Error al agregar la imagen');
        }
    } catch (error) {
        showMessage(error.message, 'error');
    }
}); 