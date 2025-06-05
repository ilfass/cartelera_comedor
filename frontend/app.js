// Configuración
const API_URL = 'http://localhost:3000';
const WEATHER_API_KEY = '79bf01c7bef5ed9d9aeda331a0d552bf';
const WEATHER_CITY = 'Tandil'; // Ciudad de UNICEN

// Intervalos de actualización (en milisegundos)
const UPDATE_INTERVALS = {
    MENU: 300000,       // 5 minutos
    MESSAGES: 300000,   // 5 minutos
    WEATHER: 900000,    // 15 minutos
    DATETIME: 1000      // 1 segundo
};

// Configuración del carrusel
const carouselConfig = {
    transitionTime: 600000, // 10 minutos en milisegundos
    fadeTime: 1000 // 1 segundo para el efecto de fade
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
        if (!response.ok) {
            throw new Error('Error al cargar el menú');
        }
        const menu = await response.json();
        console.log('Menú cargado:', menu);
        
        // Obtener el día actual en español
        const diasSemana = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
        const diaActual = diasSemana[new Date().getDay()];
        
        // Limpiar todos los contenedores de menú
        ['lunes', 'martes', 'miercoles', 'jueves', 'viernes'].forEach(dia => {
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
                            <h4>Menú Celíaco</h4>
                            <p>${menuDia.menu_celiaco || 'No disponible'}</p>
                        </div>
                    `;
                } else {
                    container.innerHTML = '<p class="no-menu">No hay menú disponible</p>';
                }
            }
        });
    } catch (error) {
        console.error('Error al cargar el menú:', error);
        ['lunes', 'martes', 'miercoles', 'jueves', 'viernes'].forEach(dia => {
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
    setInterval(() => {
        const currentPage = document.querySelector('.carousel-page.active');
        const nextPage = currentPage.nextElementSibling || document.querySelector('.carousel-page');
        
        currentPage.style.opacity = '0';
        currentPage.classList.remove('active');
        
        nextPage.style.opacity = '1';
        nextPage.classList.add('active');
    }, carouselConfig.transitionTime);
}

function updateMenuTomorrowTitle() {
    const dias = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
    const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
    const hoy = new Date();
    let manana = new Date(hoy);
    manana.setDate(hoy.getDate() + 1);
    // Si es viernes, mostrar lunes siguiente
    if (hoy.getDay() === 5) {
        manana.setDate(hoy.getDate() + 3);
    } else if (hoy.getDay() === 6) { // Si es sábado, mostrar lunes
        manana.setDate(hoy.getDate() + 2);
    }
    const diaNombre = dias[manana.getDay()];
    const diaNumero = String(manana.getDate()).padStart(2, '0');
    const mesNombre = meses[manana.getMonth()];
    document.getElementById('menu-tomorrow-dia').textContent = diaNombre.charAt(0).toUpperCase() + diaNombre.slice(1);
    document.getElementById('menu-tomorrow-fecha').textContent = `${diaNumero} de ${mesNombre}`;
}

// Mostrar menú de mañana en el bloque destacado
async function loadMenuTomorrow() {
    try {
        const response = await fetch(`${API_URL}/api/menu`);
        if (!response.ok) {
            throw new Error('Error al cargar el menú');
        }
        const menu = await response.json();
        console.log('Menú cargado para mañana:', menu);
        
        const diasSemana = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
        const hoy = new Date();
        let manana = new Date(hoy);
        manana.setDate(hoy.getDate() + 1);
        
        // Si es viernes, mostrar lunes siguiente
        if (hoy.getDay() === 5) {
            manana.setDate(hoy.getDate() + 3);
        } else if (hoy.getDay() === 6) {
            manana.setDate(hoy.getDate() + 2);
        }
        
        const diaNombre = diasSemana[manana.getDay()];
        const menuDia = menu.find(m => m.dia.toLowerCase() === diaNombre);
        
        if (menuDia) {
            document.getElementById('menu-tomorrow-general').textContent = menuDia.menu_general || 'No disponible';
            document.getElementById('menu-tomorrow-vegetariano').textContent = menuDia.menu_vegetariano || 'No disponible';
            document.getElementById('menu-tomorrow-celiaco').textContent = menuDia.menu_celiaco || 'No disponible';
        } else {
            document.getElementById('menu-tomorrow-general').textContent = 'No disponible';
            document.getElementById('menu-tomorrow-vegetariano').textContent = 'No disponible';
            document.getElementById('menu-tomorrow-celiaco').textContent = 'No disponible';
        }
    } catch (error) {
        console.error('Error al cargar el menú de mañana:', error);
        document.getElementById('menu-tomorrow-general').textContent = 'No disponible';
        document.getElementById('menu-tomorrow-vegetariano').textContent = 'No disponible';
        document.getElementById('menu-tomorrow-celiaco').textContent = 'No disponible';
    }
}

// Carrusel de mensajes e imágenes mezclados
let currentMixedSlide = 0;
let mixedSlides = [];
const mixedSlideInterval = 600000; // 10 minutos

async function loadMixedCarousel() {
    try {
        // Obtener mensajes
        const messagesRes = await fetch(`${API_URL}/api/mensajes`);
        const messages = await messagesRes.json();
        // Obtener imágenes
        const imagesRes = await fetch(`${API_URL}/api/imagenes`);
        const images = await imagesRes.json();
        // Mezclar ambos
        mixedSlides = [...messages.map(m => ({type: 'mensaje', ...m})), ...images.map(i => ({type: 'imagen', ...i}))];
        // Alternar el orden (mensaje, imagen, mensaje, imagen...)
        mixedSlides.sort((a, b) => (a.type === b.type ? 0 : a.type === 'mensaje' ? -1 : 1));
        showMixedSlide();
        if (mixedSlides.length > 1) {
            setInterval(() => {
                currentMixedSlide = (currentMixedSlide + 1) % mixedSlides.length;
                showMixedSlide();
            }, mixedSlideInterval);
        }
    } catch (error) {
        document.getElementById('messages-carousel').innerHTML = '<p>No se pudo cargar el carrusel</p>';
    }
}

function showMixedSlide() {
    const container = document.getElementById('messages-carousel');
    if (!mixedSlides.length) {
        container.innerHTML = '<p style="text-align:center;">No hay mensajes ni imágenes disponibles</p>';
        return;
    }
    const slide = mixedSlides[currentMixedSlide];
    if (slide.type === 'mensaje') {
        container.innerHTML = `
            <div class="message-carousel" style="display:flex; flex-direction:column; align-items:center; justify-content:center; min-height:180px; text-align:center;">
                <b style="font-size:1.5em;">${slide.titulo}</b><br>
                <span style="font-size:1.2em;">${slide.contenido}</span>
            </div>
        `;
    } else if (slide.type === 'imagen') {
        container.innerHTML = `
            <div class="image-carousel" style="display:flex; flex-direction:column; align-items:center; justify-content:center; min-height:180px;">
                <img id="carousel-img" src="${slide.url}" alt="${slide.titulo || 'Imagen'}" style="width:100%; height:auto; max-width:100%; max-height:180px; display:block; margin:0 auto; border-radius:8px;">
                <div style="text-align:center; margin-top:8px; color:#23406e; font-weight:500;">${slide.titulo || ''}</div>
            </div>
        `;
        // Si la imagen no carga, pasar al siguiente slide
        const img = document.getElementById('carousel-img');
        if (img) {
            img.onerror = function() {
                // Eliminar el slide con imagen rota para no volver a mostrarlo
                mixedSlides.splice(currentMixedSlide, 1);
                if (mixedSlides.length === 0) {
                    container.innerHTML = '<p style="text-align:center;">No hay mensajes ni imágenes disponibles</p>';
                    return;
                }
                if (currentMixedSlide >= mixedSlides.length) currentMixedSlide = 0;
                showMixedSlide();
            };
        }
    }
}

// Mostrar tabla de menú semanal compacto
async function renderMenuWeekTable() {
    try {
        const response = await fetch(`${API_URL}/api/menu`);
        if (!response.ok) {
            throw new Error('Error al cargar el menú');
        }
        const menu = await response.json();
        console.log('Menú cargado para la tabla:', menu);
        
        const diasSemana = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes'];
        const hoy = new Date();
        const diaActual = diasSemana[hoy.getDay() - 1];
        
        // Calcular el día de mañana
        let manana = new Date(hoy);
        manana.setDate(hoy.getDate() + 1);
        // Si es viernes, mostrar lunes siguiente
        if (hoy.getDay() === 5) {
            manana.setDate(hoy.getDate() + 3);
        } else if (hoy.getDay() === 6) {
            manana.setDate(hoy.getDate() + 2);
        }
        const diaManana = diasSemana[manana.getDay() - 1];
        
        // Filtrar los días para excluir el día de mañana
        const diasAMostrar = diasSemana.filter(dia => dia !== diaManana);
        
        // Construir tabla
        let html = '<table id="menu-week-table">';
        
        // Encabezado con días
        html += '<tr>';
        html += '<th style="width: 10%; text-align: center; font-size: 2rem; background: linear-gradient(45deg, #2d5a27, #3a7d32, #51cb93);">Tipo</th>';
        diasAMostrar.forEach(dia => {
            const esHoy = dia === diaActual;
            html += `<th class="${esHoy ? 'menu-week-cell-dia-hoy' : ''}">${esHoy ? 'HOY' : dia.charAt(0).toUpperCase() + dia.slice(1)}</th>`;
        });
        html += '</tr>';
        
        // Fila de menú general
        html += '<tr class="menu-general-row">';
        html += '<td style="text-align: center; font-size: 5rem; padding: 15px; text-shadow: 2px 2px 7px rgb(0 0 0); border-right: 4px solid #dc2626;">🍽️</td>';
        diasAMostrar.forEach(dia => {
            const menuDia = menu.find(m => m.dia.toLowerCase() === dia);
            const esHoy = dia === diaActual;
            const menuGeneral = menuDia && menuDia.menu_general ? menuDia.menu_general : 'No disponible';
            html += `<td class="${esHoy ? 'current-day' : ''}">${menuGeneral}</td>`;
        });
        html += '</tr>';
        
        // Fila de menú vegetariano
        html += '<tr class="menu-vegetariano-row">';
        html += '<td style="text-align: center; font-size: 5rem; padding: 15px; text-shadow: 2px 2px 7px rgb(0 0 0); border-right: 4px solid #3b82f6;">🥗</td>';
        diasAMostrar.forEach(dia => {
            const menuDia = menu.find(m => m.dia.toLowerCase() === dia);
            const esHoy = dia === diaActual;
            const menuVegetariano = menuDia && menuDia.menu_vegetariano ? menuDia.menu_vegetariano : 'No disponible';
            html += `<td class="${esHoy ? 'current-day' : ''}">${menuVegetariano}</td>`;
        });
        html += '</tr>';
        
        // Fila de menú celíaco
        html += '<tr class="menu-celiaco-row">';
        html += '<td style="text-align: center; font-size: 5rem; padding: 15px; text-shadow: 2px 2px 7px rgb(0 0 0); border-right: 4px solid #eab308;">🌾</td>';
        diasAMostrar.forEach(dia => {
            const menuDia = menu.find(m => m.dia.toLowerCase() === dia);
            const esHoy = dia === diaActual;
            const menuCeliaco = menuDia && menuDia.menu_celiaco ? menuDia.menu_celiaco : 'No disponible';
            html += `<td class="${esHoy ? 'current-day' : ''}">${menuCeliaco}</td>`;
        });
        html += '</tr>';
        
        html += '</table>';
        document.getElementById('menu-week-table').innerHTML = html;
    } catch (error) {
        console.error('Error al cargar la tabla del menú:', error);
        document.getElementById('menu-week-table').innerHTML = '<p>Error al cargar el menú semanal</p>';
    }
}

// Carrusel de páginas
let currentPage = 0;
const pages = ['page-menu', 'page-info'];
const PAGE_INTERVAL = 600000; // 10 minutos

function initPageCarousel() {
    // Mostrar la primera página
    document.getElementById(pages[0]).classList.add('active');
    
    // Cambiar de página cada 10 segundos
    setInterval(() => {
        // Ocultar página actual
        document.getElementById(pages[currentPage]).classList.remove('active');
        
        // Avanzar al siguiente índice
        currentPage = (currentPage + 1) % pages.length;
        
        // Mostrar nueva página
        document.getElementById(pages[currentPage]).classList.add('active');
    }, PAGE_INTERVAL);
}

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
    updateDateTime();
    updateMenuTomorrowTitle();
    loadMenuTomorrow();
    renderMenuWeekTable();
    loadMixedCarousel();
    loadWeather();
    initPageCarousel(); // Inicializar el carrusel de páginas
    
    setInterval(updateDateTime, UPDATE_INTERVALS.DATETIME);
    setInterval(loadMenuTomorrow, UPDATE_INTERVALS.MENU);
    setInterval(renderMenuWeekTable, UPDATE_INTERVALS.MENU);
    setInterval(loadMixedCarousel, UPDATE_INTERVALS.MESSAGES);
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