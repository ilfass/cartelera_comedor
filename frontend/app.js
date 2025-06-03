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
        const data = await response.json();
        
        const menuGeneralContent = document.getElementById('menu-general-content');
        const menuVegetarianoContent = document.getElementById('menu-vegetariano-content');
        
        menuGeneralContent.innerHTML = data.general.map(menu => `
            <div class="menu-item">
                <h4>${formatDate(menu.fecha)}</h4>
                <p>${menu.plato}</p>
            </div>
        `).join('');
        
        menuVegetarianoContent.innerHTML = data.vegetariano.map(menu => `
            <div class="menu-item">
                <h4>${formatDate(menu.fecha)}</h4>
                <p>${menu.plato}</p>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error al cargar el menú:', error);
    }
}

// Cargar mensajes destacados
async function loadMessages() {
    try {
        const response = await fetch(`${API_URL}/api/messages`);
        const messages = await response.json();
        
        const messagesContent = document.getElementById('messages-content');
        messagesContent.innerHTML = messages.map(message => `
            <div class="message">
                <p>${message.contenido}</p>
                <small>${formatDate(message.fecha)}</small>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error al cargar los mensajes:', error);
    }
}

// Cargar clima actual
async function loadWeather() {
    try {
        const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${WEATHER_CITY}&appid=${WEATHER_API_KEY}&units=metric&lang=es`);
        const data = await response.json();
        
        const weatherContent = document.getElementById('weather-content');
        weatherContent.innerHTML = `
            <div class="weather-info">
                <h3>${Math.round(data.main.temp)}°C</h3>
                <p>${data.weather[0].description}</p>
                <p>Humedad: ${data.main.humidity}%</p>
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
        const response = await fetch(`${API_URL}/api/carousel`);
        const images = await response.json();
        
        const carouselContent = document.getElementById('carousel-content');
        carouselContent.innerHTML = images.map(image => `
            <img src="${image.url}" alt="${image.alt}" class="carousel-image">
        `).join('');
        
        startCarousel();
    } catch (error) {
        console.error('Error al cargar el carrusel:', error);
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