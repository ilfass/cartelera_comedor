// Configuración
const API_URL = 'http://localhost:3000';
const WEATHER_API_KEY = '79bf01c7bef5ed9d9aeda331a0d552bf';
const WEATHER_CITY = 'Tandil'; // Ciudad de UNICEN

// Intervalos de actualización (en milisegundos)
const UPDATE_INTERVALS = {
    MENU: 10000,        // 10 segundos
    MESSAGES: 10000,    // 10 segundos
    WEATHER: 300000,    // 5 minutos
    DATETIME: 1000      // 1 segundo
};

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
        
        // Obtener el día actual en español
        const diasSemana = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
        const diaActual = diasSemana[new Date().getDay()];
        
        // Limpiar todos los contenedores de menú
        ['lunes', 'martes', 'miércoles', 'jueves', 'viernes'].forEach(dia => {
            const container = document.getElementById(`menu-${dia}`);
            const menuDay = container.parentElement;
            
            // Remover la clase current-day de todos los días
            menuDay.classList.remove('current-day');
            
            // Agregar la clase current-day al día actual
            if (dia === diaActual) {
                menuDay.classList.add('current-day');
            }
            
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
                    container.innerHTML = '<p class="no-menu">No hay menú disponible</p>';
                }
            }
        });
    } catch (error) {
        console.error('Error al cargar el menú:', error);
        ['lunes', 'martes', 'miércoles', 'jueves', 'viernes'].forEach(dia => {
            const container = document.getElementById(`menu-${dia}`);
            if (container) {
                container.innerHTML = '<p class="error-menu">Error al cargar el menú</p>';
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
        const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${WEATHER_CITY}&appid=${WEATHER_API_KEY}&units=metric&lang=es`);
        const data = await response.json();
        
        if (data.cod === 200) {
            const weatherContent = document.getElementById('weather-content');
            const temp = Math.round(data.main.temp);
            const humidity = data.main.humidity;
            const description = data.weather[0].description;
            const weatherId = data.weather[0].id;
            
            // Función para obtener el emoji según el ID del clima
            const getWeatherEmoji = (id) => {
                if (id >= 200 && id < 300) return '⛈️'; // Tormenta
                if (id >= 300 && id < 400) return '🌧️'; // Lluvia ligera
                if (id >= 500 && id < 600) return '🌧️'; // Lluvia
                if (id >= 600 && id < 700) return '❄️'; // Nieve
                if (id >= 700 && id < 800) return '🌫️'; // Niebla
                if (id === 800) return '☀️'; // Despejado
                if (id === 801) return '🌤️'; // Pocas nubes
                if (id >= 802 && id <= 804) return '☁️'; // Nublado
                return '🌈'; // Por defecto
            };

            const emoji = getWeatherEmoji(weatherId);
            
            weatherContent.innerHTML = `
                <div class="weather-info">
                    <div class="weather-emoji">${emoji}</div>
                    <h3>${temp}°C</h3>
                    <p>${description}</p>
                    <p>💧 ${humidity}%</p>
                </div>
            `;
        } else {
            throw new Error('No se pudo obtener el clima');
        }
    } catch (error) {
        console.error('Error al cargar el clima:', error);
        const weatherContent = document.getElementById('weather-content');
        weatherContent.innerHTML = `
            <div class="weather-info">
                <div class="weather-emoji">❓</div>
                <h3>--°C</h3>
                <p>Clima no disponible</p>
                <p>💧 --%</p>
            </div>
        `;
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
    // Cargar datos iniciales
    updateDateTime();
    loadMenu();
    loadMessages();
    loadWeather();
    loadCarousel();
    
    // Configurar intervalos de actualización
    setInterval(updateDateTime, UPDATE_INTERVALS.DATETIME);
    setInterval(loadMenu, UPDATE_INTERVALS.MENU);
    setInterval(loadMessages, UPDATE_INTERVALS.MESSAGES);
    setInterval(loadWeather, UPDATE_INTERVALS.WEATHER);
    
    // Agregar indicador visual de actualización
    const updateIndicator = document.createElement('div');
    updateIndicator.id = 'update-indicator';
    updateIndicator.style.cssText = `
        position: fixed;
        top: 10px;
        right: 10px;
        background-color: rgba(0, 0, 0, 0.7);
        color: white;
        padding: 5px 10px;
        border-radius: 5px;
        font-size: 0.8em;
        display: none;
        z-index: 1000;
    `;
    document.body.appendChild(updateIndicator);
    
    // Función para mostrar el indicador de actualización
    function showUpdateIndicator(message) {
        updateIndicator.textContent = message;
        updateIndicator.style.display = 'block';
        setTimeout(() => {
            updateIndicator.style.display = 'none';
        }, 2000);
    }
    
    // Modificar las funciones de carga para mostrar el indicador
    const originalLoadMenu = loadMenu;
    loadMenu = async function() {
        try {
            await originalLoadMenu();
            showUpdateIndicator('Menú actualizado');
        } catch (error) {
            console.error('Error al actualizar el menú:', error);
        }
    };
    
    const originalLoadMessages = loadMessages;
    loadMessages = async function() {
        try {
            await originalLoadMessages();
            showUpdateIndicator('Mensajes actualizados');
        } catch (error) {
            console.error('Error al actualizar los mensajes:', error);
        }
    };
    
    const originalLoadWeather = loadWeather;
    loadWeather = async function() {
        try {
            await originalLoadWeather();
            showUpdateIndicator('Clima actualizado');
        } catch (error) {
            console.error('Error al actualizar el clima:', error);
        }
    };
}); 