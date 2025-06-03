// Configuración
const API_URL = 'http://localhost:3000';
const WEATHER_API_KEY = 'TU_API_KEY'; // Reemplazar con tu API key de OpenWeather
const WEATHER_CITY = 'Tandil'; // Ciudad de UNICEN

// Función para actualizar la hora y fecha
function updateDateTime() {
    const now = new Date();
    const timeElement = document.getElementById('current-time');
    const dateElement = document.getElementById('current-date');
    
    // Formatear hora
    const timeOptions = { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
    };
    timeElement.textContent = now.toLocaleTimeString('es-AR', timeOptions);
    
    // Formatear fecha
    const dateOptions = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    };
    dateElement.textContent = now.toLocaleDateString('es-AR', dateOptions);
}

// Funciones de utilidad
const formatDate = (date) => {
    return new Date(date).toLocaleDateString('es-AR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
};

// Cargar menú semanal
async function loadMenu() {
    try {
        const response = await fetch(`${API_URL}/api/menu`);
        const menu = await response.json();
        
        // Limpiar todos los contenedores de menú
        ['lunes', 'martes', 'miercoles', 'jueves', 'viernes'].forEach(dia => {
            const container = document.getElementById(`menu-${dia}`);
            if (container) {
                const menuDia = menu.find(m => m.dia.toLowerCase() === dia);
                if (menuDia) {
                    container.innerHTML = `
                        <div class="menu-item">
                            <h4>Menú General</h4>
                            <p>${menuDia.menu_general || 'No disponible'}</p>
                            <h4>Menú Vegetariano</h4>
                            <p>${menuDia.menu_vegetariano || 'No disponible'}</p>
                        </div>
                    `;
                } else {
                    container.innerHTML = 'No hay menú disponible';
                }
            }
        });
    } catch (error) {
        console.error('Error al cargar el menú:', error);
        ['lunes', 'martes', 'miercoles', 'jueves', 'viernes'].forEach(dia => {
            const container = document.getElementById(`menu-${dia}`);
            if (container) {
                container.innerHTML = 'Error al cargar el menú';
            }
        });
    }
}

// Cargar mensajes destacados
async function loadMessages() {
    try {
        const response = await fetch(`${API_URL}/api/mensajes`);
        const messages = await response.json();
        
        const messagesContent = document.getElementById('messages-content');
        messagesContent.innerHTML = messages.map(message => `
            <div class="message ${message.destacado ? 'destacado' : ''}">
                <h3>${message.titulo}</h3>
                <p>${message.contenido}</p>
                <small>${formatDate(message.fecha)}</small>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error al cargar los mensajes:', error);
        const messagesContent = document.getElementById('messages-content');
        messagesContent.innerHTML = '<p>No se pudieron cargar los mensajes</p>';
    }
}

// Cargar clima actual
async function loadWeather() {
    try {
        // Por ahora, mostraremos un mensaje de clima simulado
        const weatherContent = document.getElementById('weather-content');
        weatherContent.innerHTML = `
            <div class="weather-info">
                <h3>--°C</h3>
                <p>Clima no disponible</p>
                <p>Humedad: --%</p>
            </div>
        `;
    } catch (error) {
        console.error('Error al cargar el clima:', error);
        const weatherContent = document.getElementById('weather-content');
        weatherContent.innerHTML = '<p>No se pudo cargar el clima</p>';
    }
}

// Carrusel de imágenes
let currentSlide = 0;
const slideInterval = 5000; // 5 segundos

async function loadCarousel() {
    try {
        const response = await fetch(`${API_URL}/api/imagenes`);
        const images = await response.json();
        
        const carouselContent = document.getElementById('carousel-content');
        if (images.length > 0) {
            carouselContent.innerHTML = images.map(image => `
                <img src="${image.url}" alt="${image.titulo || 'Imagen'}" class="carousel-image">
            `).join('');
            startCarousel();
        } else {
            carouselContent.innerHTML = '<p>No hay imágenes disponibles</p>';
        }
    } catch (error) {
        console.error('Error al cargar el carrusel:', error);
        const carouselContent = document.getElementById('carousel-content');
        carouselContent.innerHTML = '<p>No se pudo cargar el carrusel</p>';
    }
}

function startCarousel() {
    const carouselContent = document.getElementById('carousel-content');
    const slides = carouselContent.children;
    
    setInterval(() => {
        currentSlide = (currentSlide + 1) % slides.length;
        carouselContent.style.transform = `translateX(-${currentSlide * 100}%)`;
    }, slideInterval);
}

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
    updateDateTime(); // Actualizar hora y fecha inmediatamente
    setInterval(updateDateTime, 1000); // Actualizar cada segundo
    
    loadMenu();
    loadMessages();
    loadWeather();
    loadCarousel();
    
    // Actualizar datos cada 5 minutos
    setInterval(() => {
        loadMenu();
        loadMessages();
        loadWeather();
    }, 300000);
}); 