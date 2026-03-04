// Configuración - se carga desde config.js
const API_URL = window.APP_CONFIG?.API_URL || '/api';
const WEATHER_API_KEY = window.APP_CONFIG?.WEATHER_API_KEY || '79bf01c7bef5ed9d9aeda331a0d552bf';
const WEATHER_CITY = window.APP_CONFIG?.WEATHER_CITY || 'Tandil'; // Ciudad de UNICEN

// Intervalos de actualización (en milisegundos)
const UPDATE_INTERVALS = {
    MENU: 300000,       // 5 minutos
    MESSAGES: 300000,   // 5 minutos
    WEATHER: 900000,    // 15 minutos
    DATETIME: 1000,     // 1 segundo
    PAGE_RELOAD: 300000 // 5 minutos - recarga completa de la página
};

// Configuración del carrusel
const carouselConfig = {
    transitionTime: 600000, // 10 minutos en milisegundos
    fadeTime: 1000 // 1 segundo para el efecto de fade
};

// Configuración del cambio automático de menús
const menuRotationConfig = {
    interval: 8000, // 8 segundos por menú
    fadeTime: 1000  // 1 segundo para la transición
};

// Variables globales para el cambio automático de menús
let currentMenuIndex = 0;
let menuRotationInterval = null;
let allMenuData = [];

// Función para actualizar la hora y fecha
function updateDateTime() {
    const now = new Date();
    const timeElement = document.getElementById('current-time');
    const dateElement = document.getElementById('current-date');
    
    if (timeElement) {
        const timeString = now.toLocaleTimeString('es-AR', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
        timeElement.textContent = timeString;
    }
    
    if (dateElement) {
        const dateString = now.toLocaleDateString('es-AR', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        dateElement.textContent = dateString.charAt(0).toUpperCase() + dateString.slice(1);
    }
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

// Función para obtener el día de la semana en español
function getDayName(day) {
    const days = {
        'lunes': 'Lunes',
        'martes': 'Martes',
        'miercoles': 'Miércoles',
        'jueves': 'Jueves',
        'viernes': 'Viernes',
        'sabado': 'Sábado',
        'domingo': 'Domingo'
    };
    return days[day.toLowerCase()] || day;
}

// Función para obtener el próximo día de la semana
function getNextDay() {
    const today = new Date();
    const days = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
    const currentDay = days[today.getDay()];
    
    // Si es viernes, el próximo día es lunes
    if (currentDay === 'viernes') {
        return 'lunes';
    }
    // Si es sábado o domingo, el próximo día es lunes
    if (currentDay === 'sabado' || currentDay === 'domingo') {
        return 'lunes';
    }
    
    // Para otros días (lunes a jueves), obtener el siguiente
    const currentIndex = days.indexOf(currentDay);
    const nextIndex = (currentIndex + 1) % 7;
    return days[nextIndex];
}

// Función para obtener el día actual
function getCurrentDay() {
    const today = new Date();
    const days = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
    return days[today.getDay()];
}

// Función para actualizar el próximo menú
function updateNextMenu(menuData, currentDay) {
    console.log('🔄 Actualizando próximo menú...');
    
    // Obtener el próximo día (solo días laborables: lunes a viernes)
    const daysOfWeek = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes'];
    const currentDayIndex = daysOfWeek.indexOf(currentDay.toLowerCase());
    
    let nextDay;
    if (currentDayIndex === -1) {
        // Si el día actual no está en la lista (sábado/domingo), mostrar lunes
        nextDay = 'lunes';
    } else if (currentDayIndex === daysOfWeek.length - 1) {
        // Si es viernes, el próximo día es lunes
        nextDay = 'lunes';
    } else {
        // Para otros días, obtener el siguiente
        nextDay = daysOfWeek[currentDayIndex + 1];
    }
    
    console.log('📅 Día actual:', currentDay, 'Próximo día:', nextDay);
    
    // Buscar el menú del próximo día
    const nextMenu = menuData.find(menu => menu.dia.toLowerCase() === nextDay);
    
    if (nextMenu) {
        console.log('📋 Menú del próximo día encontrado:', nextMenu);
        
        // Actualizar elementos del próximo menú
        const nextGeneralMenu = document.getElementById('next-general-menu');
        const nextVegetarianMenu = document.getElementById('next-vegetarian-menu');
        const nextCeliacMenu = document.getElementById('next-celiac-menu');
        const nextDayElement = document.getElementById('next-day');
        
        if (nextGeneralMenu) nextGeneralMenu.textContent = nextMenu.menu_general;
        if (nextVegetarianMenu) nextVegetarianMenu.textContent = nextMenu.menu_vegetariano;
        if (nextCeliacMenu) nextCeliacMenu.textContent = nextMenu.menu_celiaco;
        if (nextDayElement) nextDayElement.textContent = nextDay.toUpperCase();
        
        console.log('✅ Próximo menú actualizado correctamente');
    } else {
        console.warn('⚠️ No se encontró menú para el próximo día:', nextDay);
        
        // Si no hay menú para el próximo día, mostrar el primer menú disponible de lunes a viernes
        const weekdayMenus = menuData.filter(menu => {
            const day = menu.dia.toLowerCase();
            return ['lunes', 'martes', 'miercoles', 'jueves', 'viernes'].includes(day);
        });
        
        if (weekdayMenus.length > 0) {
            const firstMenu = weekdayMenus[0];
            const nextGeneralMenu = document.getElementById('next-general-menu');
            const nextVegetarianMenu = document.getElementById('next-vegetarian-menu');
            const nextCeliacMenu = document.getElementById('next-celiac-menu');
            const nextDayElement = document.getElementById('next-day');
            
            if (nextGeneralMenu) nextGeneralMenu.textContent = firstMenu.menu_general;
            if (nextVegetarianMenu) nextVegetarianMenu.textContent = firstMenu.menu_vegetariano;
            if (nextCeliacMenu) nextCeliacMenu.textContent = firstMenu.menu_celiaco;
            if (nextDayElement) nextDayElement.textContent = firstMenu.dia.toUpperCase();
            
            console.log('✅ Mostrando primer menú de lunes a viernes como próximo menú');
        }
    }
}

// Función para cargar el menú
async function loadMenu() {
    try {
        console.log('🔄 Iniciando carga de menús...');
        const response = await fetch(`${API_URL}/menu`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const menuData = await response.json();
        console.log('📋 Menús cargados:', menuData.length);
        console.log('📋 Datos del menú:', menuData);
        
        // Obtener día actual
        const currentDay = getCurrentDay();
        console.log('📅 Día actual:', currentDay);
        
        // Actualizar próximo menú
        console.log('🔄 Actualizando próximo menú...');
        updateNextMenu(menuData, currentDay);
        
        // Actualizar menú semanal
        console.log('🔄 Actualizando menú semanal...');
        updateWeeklyMenu(menuData, currentDay);
        
        console.log('✅ Carga de menús completada exitosamente');
        
    } catch (error) {
        console.error('❌ Error cargando menús:', error);
        // Mostrar mensaje de error en la interfaz
        const menuContainer = document.querySelector('.menu-container');
        if (menuContainer) {
            menuContainer.innerHTML = '<div class="error-message">Error cargando menús</div>';
        }
    }
}

// Función para iniciar la rotación automática de menús
function startMenuRotation() {
    if (menuRotationInterval) {
        clearInterval(menuRotationInterval);
    }
    
    currentMenuIndex = 0;
    menuRotationInterval = setInterval(() => {
        rotateMenuDisplay();
    }, menuRotationConfig.interval);
    
    console.log('🔄 Rotación automática de menús iniciada');
}

// Función para rotar la visualización de menús
function rotateMenuDisplay() {
    if (!allMenuData || allMenuData.length === 0) return;
    
    const weekDays = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes'];
    const currentDay = getCurrentDay();
    
    // Reordenar días para que el actual esté primero
    const reorderedDays = [];
    const currentDayIndex = weekDays.indexOf(currentDay);
    
    if (currentDayIndex !== -1) {
        reorderedDays.push(currentDay);
        for (let i = 0; i < weekDays.length; i++) {
            if (i !== currentDayIndex) {
                reorderedDays.push(weekDays[i]);
            }
        }
    } else {
        reorderedDays.push(...weekDays);
    }
    
    // Obtener el día a mostrar
    const dayToShow = reorderedDays[currentMenuIndex % reorderedDays.length];
    console.log(`🔄 Mostrando menú para: ${dayToShow} (índice: ${currentMenuIndex})`);
    
    // Incrementar índice
    currentMenuIndex = (currentMenuIndex + 1) % reorderedDays.length;
}

// Función para actualizar la tabla con animación
function updateWeeklyMenuTableWithAnimation(menuData, dayToShow) {
    const tbody = document.getElementById('weekly-menu-tbody');
    if (!tbody) return;
    
    // Fade out
    tbody.style.opacity = '0';
    tbody.style.transform = 'translateY(20px)';
    
    setTimeout(() => {
        // Actualizar contenido
        updateWeeklyMenuTableContent(menuData, dayToShow);
        
        // Fade in con un pequeño delay para asegurar que el contenido se haya actualizado
        setTimeout(() => {
            tbody.style.opacity = '1';
            tbody.style.transform = 'translateY(0)';
        }, 50);
    }, menuRotationConfig.fadeTime / 2);
}

// Función para actualizar la visualización del menú
function updateMenuDisplay(menuData) {
    console.log('🔄 Actualizando visualización del menú...');
    const nextDay = getNextDay();
    const currentDay = getCurrentDay();
    console.log('📅 Próximo día:', nextDay, 'Día actual:', currentDay);
    
    // Actualizar información del próximo día
    const nextDayElement = document.getElementById('next-day');
    if (nextDayElement) {
        nextDayElement.textContent = getDayName(nextDay);
        console.log('✅ Próximo día actualizado:', getDayName(nextDay));
    } else {
        console.warn('⚠️ Elemento next-day no encontrado');
    }
    
    // Actualizar próximo menú
    const nextMenu = menuData.find(item => item.dia.toLowerCase() === nextDay);
    console.log('🍽️ Próximo menú encontrado:', nextMenu);
    
    if (nextMenu) {
        const generalElement = document.getElementById('next-general-menu');
        const vegetarianElement = document.getElementById('next-vegetarian-menu');
        const celiacElement = document.getElementById('next-celiac-menu');
        
        if (generalElement) generalElement.textContent = nextMenu.menu_general || 'No disponible';
        if (vegetarianElement) vegetarianElement.textContent = nextMenu.menu_vegetariano || 'No disponible';
        if (celiacElement) celiacElement.textContent = nextMenu.menu_celiaco || 'No disponible';
        
        console.log('✅ Próximo menú actualizado');
    } else {
        const generalElement = document.getElementById('next-general-menu');
        const vegetarianElement = document.getElementById('next-vegetarian-menu');
        const celiacElement = document.getElementById('next-celiac-menu');
        
        if (generalElement) generalElement.textContent = 'Menú no disponible';
        if (vegetarianElement) vegetarianElement.textContent = 'Menú no disponible';
        if (celiacElement) celiacElement.textContent = 'Menú no disponible';
        
        console.warn('⚠️ No se encontró menú para el próximo día');
    }
    
    // Actualizar tabla semanal
    console.log('📊 Actualizando tabla semanal...');
    updateWeeklyMenuTable(menuData, currentDay);
}

// Función para actualizar la tabla del menú semanal
function updateWeeklyMenuTable(menuData, currentDay) {
    const tbody = document.getElementById('weekly-menu-tbody');
    if (!tbody) return;
    
    // Limpiar tabla
    tbody.innerHTML = '';
    
    // Obtener días de la semana
    const daysOfWeek = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];
    const dayNames = ['LUNES', 'MARTES', 'MIÉRCOLES', 'JUEVES', 'VIERNES', 'SÁBADO', 'DOMINGO'];
    
    // Encontrar índice del día actual
    const currentDayIndex = daysOfWeek.indexOf(currentDay.toLowerCase());
    
    // Crear array con el día actual primero y los demás después
    let orderedDays = [];
    if (currentDayIndex !== -1) {
        // Agregar el día actual primero
        orderedDays.push({
            day: daysOfWeek[currentDayIndex],
            dayName: dayNames[currentDayIndex],
            isCurrent: true
        });
        
        // Agregar los demás días después del actual
        for (let i = 0; i < daysOfWeek.length; i++) {
            if (i !== currentDayIndex) {
                orderedDays.push({
                    day: daysOfWeek[i],
                    dayName: dayNames[i],
                    isCurrent: false
                });
            }
        }
    } else {
        // Si no se encuentra el día actual, usar orden normal
        orderedDays = daysOfWeek.map((day, index) => ({
            day: day,
            dayName: dayNames[index],
            isCurrent: false
        }));
    }
    
    // Mostrar solo los primeros 4 días (día actual + 3 más)
    const daysToShow = orderedDays.slice(0, 4);
    
    // Crear filas de la tabla
    daysToShow.forEach((dayInfo, index) => {
        const menuForDay = menuData.find(menu => menu.dia.toLowerCase() === dayInfo.day);
        
        const row = document.createElement('tr');
        if (dayInfo.isCurrent) {
            row.classList.add('current-day');
        }
        
        // Agregar clase para animación de entrada
        row.style.opacity = '0';
        row.style.transform = 'translateY(20px)';
        
        row.innerHTML = `
            <td>${dayInfo.dayName}</td>
            <td>
                <div class="menu-type-content-table">
                    ${menuForDay ? menuForDay.menu_general : 'Menú no disponible'}
                </div>
            </td>
            <td>
                <div class="menu-type-content-table">
                    ${menuForDay ? menuForDay.menu_vegetariano : 'Menú no disponible'}
                </div>
            </td>
            <td>
                <div class="menu-type-content-table">
                    ${menuForDay ? menuForDay.menu_celiaco : 'Menú no disponible'}
                </div>
            </td>
        `;
        
        tbody.appendChild(row);
        
        // Animación de entrada con delay
        setTimeout(() => {
            row.style.transition = 'all 0.6s ease';
            row.style.opacity = '1';
            row.style.transform = 'translateY(0)';
        }, index * 200);
    });
}

// Función para rotar automáticamente los días del menú semanal
function startWeeklyMenuRotation(menuData, currentDay) {
    const daysOfWeek = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];
    const dayNames = ['LUNES', 'MARTES', 'MIÉRCOLES', 'JUEVES', 'VIERNES', 'SÁBADO', 'DOMINGO'];
    
    // Encontrar índice del día actual
    const currentDayIndex = daysOfWeek.indexOf(currentDay.toLowerCase());
    
    // Crear array con todos los días excepto el actual
    let otherDays = [];
    for (let i = 0; i < daysOfWeek.length; i++) {
        if (i !== currentDayIndex) {
            otherDays.push({
                day: daysOfWeek[i],
                dayName: dayNames[i]
            });
        }
    }
    
    let currentRotationIndex = 0;
    
    // Función para cambiar el día mostrado
    function rotateWeeklyMenu() {
        if (otherDays.length === 0) return;
        
        // Obtener el día actual y los próximos 3 días para mostrar
        const daysToShow = [
            { day: daysOfWeek[currentDayIndex], dayName: dayNames[currentDayIndex], isCurrent: true },
            ...otherDays.slice(currentRotationIndex, currentRotationIndex + 3)
        ];
        
        // Si no hay suficientes días, completar desde el inicio
        while (daysToShow.length < 4) {
            const remainingDays = otherDays.filter(d => !daysToShow.some(show => show.day === d.day));
            if (remainingDays.length > 0) {
                daysToShow.push(remainingDays[0]);
            } else {
                break;
            }
        }
        
        // Actualizar tabla con animación
        updateWeeklyMenuTableWithAnimation(menuData, daysToShow);
        
        // Avanzar al siguiente grupo de días
        currentRotationIndex = (currentRotationIndex + 1) % otherDays.length;
    }
    
    // Iniciar rotación automática
    if (otherDays.length > 0) {
        setInterval(rotateWeeklyMenu, menuRotationConfig.interval);
    }
}

// Función para mostrar errores
function showError(message) {
    console.error(message);
    // Aquí podrías agregar una notificación visual si es necesario
}

// Cargar mensajes destacados
async function loadMessages() {
    try {
        console.log('🔄 Cargando mensajes...');
        const response = await fetch(`${API_URL}/mensajes`);
        const messages = await response.json();
        console.log('📨 Mensajes recibidos:', messages);
        
        // Actualizar mensajes en la página principal (si existe)
        const messagesContent = document.getElementById('messages-content');
        if (messagesContent) {
            console.log('📝 Actualizando mensajes en página principal');
            messagesContent.innerHTML = messages.map(message => `
                <div class="message ${message.destacado ? 'destacado' : ''}">
                    <h3>${message.titulo}</h3>
                    <p>${message.contenido}</p>
                    <small>${formatDate(message.fecha)}</small>
                </div>
            `).join('');
        }
        
        // Actualizar mensajes en la página secundaria
        const messagesDisplay = document.getElementById('messages-display');
        if (messagesDisplay) {
            console.log('📝 Actualizando mensajes en página secundaria');
            if (messages.length > 0) {
                messagesDisplay.innerHTML = messages.map(message => `
                    <div class="message-item ${message.destacado ? 'destacado' : ''}">
                        <h3>${message.titulo}</h3>
                        <p>${message.contenido}</p>
                        <small>${formatDate(message.fecha)}</small>
                    </div>
                `).join('');
                console.log('✅ Mensajes actualizados en página secundaria');
            } else {
                messagesDisplay.innerHTML = '<div class="message-item"><p>No hay mensajes disponibles</p></div>';
                console.log('⚠️ No hay mensajes disponibles');
            }
        } else {
            console.warn('⚠️ Elemento messages-display no encontrado');
        }
    } catch (error) {
        console.error('❌ Error al cargar los mensajes:', error);
        const messagesContent = document.getElementById('messages-content');
        const messagesDisplay = document.getElementById('messages-display');
        
        if (messagesContent) {
            messagesContent.innerHTML = '<p>No se pudieron cargar los mensajes</p>';
        }
        if (messagesDisplay) {
            messagesDisplay.innerHTML = '<div class="message-item"><p>Error al cargar los mensajes</p></div>';
        }
    }
}

// Cargar clima actual
async function loadWeather() {
    try {
        console.log('🔄 Cargando clima...');
        const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${WEATHER_CITY}&appid=${WEATHER_API_KEY}&units=metric&lang=es`);
        const data = await response.json();
        console.log('🌤️ Datos del clima recibidos:', data);
        
        if (data.cod === 200) {
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
            
            // Actualizar clima en la página principal (si existe)
            const weatherContent = document.getElementById('weather-content');
            if (weatherContent) {
                console.log('📝 Actualizando clima en página principal');
                weatherContent.innerHTML = `
                    <div class="weather-info">
                        <div class="weather-emoji">${emoji}</div>
                        <h3>${temp}°C</h3>
                        <p>${description}</p>
                        <p>💧 ${humidity}%</p>
                    </div>
                `;
                console.log('✅ Clima actualizado en página principal');
            }
            
            // Actualizar clima en la página secundaria
            const weatherDisplay = document.getElementById('weather-display');
            if (weatherDisplay) {
                console.log('📝 Actualizando clima en página secundaria');
                weatherDisplay.innerHTML = `
                    <div class="weather-info">
                        <div class="weather-emoji">${emoji}</div>
                        <h3>${temp}°C</h3>
                        <p>${description}</p>
                        <p>💧 ${humidity}%</p>
                    </div>
                `;
                console.log('✅ Clima actualizado en página secundaria');
            } else {
                console.warn('⚠️ Elemento weather-display no encontrado');
            }
        } else {
            console.error('❌ Error en la respuesta del clima:', data);
        }
    } catch (error) {
        console.error('❌ Error al cargar el clima:', error);
        const weatherContent = document.getElementById('weather-content');
        const weatherDisplay = document.getElementById('weather-display');
        
        if (weatherContent) {
            weatherContent.innerHTML = '<p>No se pudo cargar el clima</p>';
        }
        if (weatherDisplay) {
            weatherDisplay.innerHTML = '<p>No se pudo cargar el clima</p>';
        }
    }
}

// Carrusel de imágenes
let currentSlide = 0;
const slideInterval = 5000; // 5 segundos

async function loadCarousel() {
    try {
        const response = await fetch(`${API_URL}/imagenes`);
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

// Carrusel de mensajes e imágenes mezclados
let currentMixedSlide = 0;
let mixedSlides = [];
const mixedSlideInterval = 600000; // 10 minutos

async function loadMixedCarousel() {
    try {
        // Verificar si el elemento existe
        const carouselElement = document.getElementById('messages-carousel');
        if (!carouselElement) {
            console.log('⚠️ Elemento messages-carousel no encontrado, omitiendo carga del carrusel mixto');
            return;
        }
        
        // Obtener mensajes
        const messagesRes = await fetch(`${API_URL}/mensajes`);
        const messages = await messagesRes.json();
        // Obtener imágenes
        const imagesRes = await fetch(`${API_URL}/imagenes`);
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
        console.error('❌ Error en loadMixedCarousel:', error);
        const carouselElement = document.getElementById('messages-carousel');
        if (carouselElement) {
            carouselElement.innerHTML = '<p>No se pudo cargar el carrusel</p>';
        }
    }
}

function showMixedSlide() {
    const container = document.getElementById('messages-carousel');
    if (!container) {
        console.log('⚠️ Elemento messages-carousel no encontrado en showMixedSlide');
        return;
    }
    
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

// Mostrar menú de mañana en el bloque destacado
async function loadMenuTomorrow() {
    try {
        const response = await fetch(`${API_URL}/menu`);
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

// Carrusel de páginas
let currentPage = 0;
const pages = ['page-menu', 'page-info'];
const PAGE_INTERVAL = 10000; // 10 segundos (cambiado de 10 minutos para pruebas)

function initPageCarousel() {
    console.log('Inicializando carrusel de páginas...');
    
    // Verificar que los elementos existan
    pages.forEach(pageId => {
        const element = document.getElementById(pageId);
        if (element) {
            console.log(`Elemento ${pageId} encontrado:`, element);
        } else {
            console.error(`Elemento ${pageId} NO encontrado!`);
        }
    });
    
    // Mostrar la página del menú (página principal) como inicial
    currentPage = 0; // Cambiar a la página del menú
    document.getElementById(pages[currentPage]).classList.add('active');
    console.log('Página activa inicial:', pages[currentPage]);
    
    // CARRUSEL AUTOMÁTICO DESACTIVADO - PÁGINA ESTÁTICA EN MENÚ
    // Cambiar de página cada 10 segundos
    /*
    setInterval(() => {
        console.log('Cambiando página...');
        
        // Ocultar página actual
        document.getElementById(pages[currentPage]).classList.remove('active');
        console.log('Página oculta:', pages[currentPage]);
        
        // Avanzar al siguiente índice
        currentPage = (currentPage + 1) % pages.length;
        
        // Mostrar nueva página
        document.getElementById(pages[currentPage]).classList.add('active');
        console.log('Nueva página activa:', pages[currentPage]);
    }, PAGE_INTERVAL);
    */
    
    console.log('✅ Carrusel automático desactivado - Página estática en menú');
}

// Variables globales para el carrusel de información
let carouselItems = [];
let currentCarouselIndex = 0;
let carouselInterval = null;

// Cargar carrusel de información (mensajes e imágenes)
async function loadInfoCarousel() {
    try {
        console.log('🔄 Cargando carrusel de información...');
        
        // Cargar mensajes e imágenes en paralelo
        const [messagesResponse, imagesResponse] = await Promise.all([
            fetch(`${API_URL}/mensajes`),
            fetch(`${API_URL}/imagenes`)
        ]);
        
        const messages = await messagesResponse.json();
        const images = await imagesResponse.json();
        
        console.log('📢 Mensajes recibidos:', messages.length);
        console.log('🖼️ Imágenes recibidas:', images.length);
        
        // Crear array de elementos del carrusel
        carouselItems = [];
        
        // Agregar mensajes al carrusel
        messages.forEach(message => {
            carouselItems.push({
                type: 'message',
                data: message,
                priority: message.destacado ? 1 : 2
            });
        });
        
        // Agregar imágenes al carrusel
        images.forEach(image => {
            carouselItems.push({
                type: 'image',
                data: image,
                priority: 2
            });
        });
        
        // Ordenar por prioridad (destacados primero)
        carouselItems.sort((a, b) => a.priority - b.priority);
        
        console.log('🎠 Elementos del carrusel preparados:', carouselItems.length);
        
        // Inicializar carrusel
        initCarousel();
        
    } catch (error) {
        console.error('❌ Error al cargar carrusel de información:', error);
        showCarouselError();
    }
}

// Inicializar carrusel
function initCarousel() {
    const carouselDisplay = document.getElementById('carousel-display');
    if (!carouselDisplay) {
        console.warn('⚠️ Elemento carousel-display no encontrado');
        return;
    }
    
    if (carouselItems.length === 0) {
        showCarouselEmpty();
        return;
    }
    
    // Limpiar carrusel
    carouselDisplay.innerHTML = '';
    
    // Crear elementos del carrusel
    carouselItems.forEach((item, index) => {
        const carouselItem = document.createElement('div');
        carouselItem.className = `carousel-item ${index === 0 ? 'active' : ''}`;
        
        if (item.type === 'message') {
            carouselItem.innerHTML = `
                <div class="carousel-message ${item.data.destacado ? 'destacado' : ''}">
                    ${item.data.contenido}
                </div>
            `;
        } else if (item.type === 'image') {
            carouselItem.innerHTML = `
                <div class="carousel-image">
                    <img src="${item.data.url}" alt="${item.data.titulo || 'Imagen'}" />
                    <div class="image-title">${item.data.titulo || 'Imagen'}</div>
                </div>
            `;
        }
        
        carouselDisplay.appendChild(carouselItem);
    });
    
    // Iniciar rotación automática
    startCarouselRotation();
    
    console.log('✅ Carrusel inicializado con', carouselItems.length, 'elementos');
}

// Iniciar rotación automática del carrusel
function startCarouselRotation() {
    if (carouselItems.length <= 1) {
        console.log('ℹ️ Solo hay un elemento en el carrusel, no se inicia rotación');
        return;
    }
    
    // Limpiar intervalo anterior si existe
    if (carouselInterval) {
        clearInterval(carouselInterval);
    }
    
    // Configurar intervalo de rotación (8 segundos por elemento)
    carouselInterval = setInterval(() => {
        rotateCarousel();
    }, 8000);
    
    console.log('🔄 Rotación automática del carrusel iniciada');
}

// Rotar carrusel
function rotateCarousel() {
    if (carouselItems.length <= 1) return;
    
    const carouselElements = document.querySelectorAll('.carousel-item');
    const currentItem = document.querySelector('.carousel-item.active');
    
    if (currentItem) {
        currentItem.classList.remove('active');
    }
    
    currentCarouselIndex = (currentCarouselIndex + 1) % carouselElements.length;
    
    if (carouselElements[currentCarouselIndex]) {
        carouselElements[currentCarouselIndex].classList.add('active');
    }
    
    console.log('🔄 Carrusel rotado al elemento', currentCarouselIndex + 1);
}

// Mostrar error en el carrusel
function showCarouselError() {
    const carouselDisplay = document.getElementById('carousel-display');
    if (carouselDisplay) {
        carouselDisplay.innerHTML = `
            <div class="carousel-item active">
                <div class="carousel-message">
                    ❌ Error al cargar información
                </div>
            </div>
        `;
    }
}

// Mostrar carrusel vacío
function showCarouselEmpty() {
    const carouselDisplay = document.getElementById('carousel-display');
    if (carouselDisplay) {
        carouselDisplay.innerHTML = `
            <div class="carousel-item active">
                <div class="carousel-message">
                    📢 No hay información disponible
                </div>
            </div>
        `;
    }
}

// Cargar imagen destacada (mantener para compatibilidad)
async function loadFeaturedImage() {
    try {
        console.log('🔄 Cargando imagen destacada...');
        const response = await fetch(`${API_URL}/imagenes`);
        const images = await response.json();
        console.log('🖼️ Imágenes recibidas:', images);
        
        // Actualizar imagen destacada en la página principal (si existe)
        const imageContainer = document.querySelector('.featured-image-container');
        if (imageContainer) {
            console.log('📝 Actualizando imagen en página principal');
            if (images.length > 0) {
                // Tomar la primera imagen como destacada
                const featuredImage = images[0];
                imageContainer.innerHTML = `
                    <img src="${featuredImage.url}" alt="${featuredImage.titulo || 'Imagen destacada'}" 
                         style="max-width: 100%; max-height: 100%; object-fit: contain; border-radius: 0.5rem;">
                    <div style="position: absolute; bottom: 0.5rem; left: 0.5rem; right: 0.5rem; 
                               background: rgba(0,0,0,0.7); color: white; padding: 0.5rem; 
                               border-radius: 0.25rem; font-size: 0.9rem; text-align: center;">
                        ${featuredImage.titulo || 'Imagen destacada'}
                    </div>
                `;
                imageContainer.style.position = 'relative';
                console.log('✅ Imagen actualizada en página principal');
            } else {
                // Mostrar placeholder si no hay imágenes
                imageContainer.innerHTML = '<div class="image-placeholder">📸</div>';
                console.log('⚠️ No hay imágenes disponibles para página principal');
            }
        }
    } catch (error) {
        console.error('❌ Error al cargar imagen destacada:', error);
        const imageContainer = document.querySelector('.featured-image-container');
        
        if (imageContainer) {
            imageContainer.innerHTML = '<div class="image-placeholder">📸</div>';
        }
    }
}

// Cargar código QR
async function loadQR() {
    try {
        console.log('🔄 Cargando código QR...');
        const response = await fetch(`${API_URL}/qr`);
        const qrCodes = await response.json();
        console.log('📱 Códigos QR recibidos:', qrCodes);
        
        // Buscar el primer código QR activo
        const activeQR = qrCodes.find(qr => qr.activo);
        
        if (activeQR) {
            console.log('📱 Código QR activo encontrado:', activeQR);
            
            // Generar el código QR usando una API externa
            const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(activeQR.url)}`;
            
            // Actualizar el contenedor QR
            const qrContainer = document.querySelector('.qr-code');
            if (qrContainer) {
                qrContainer.innerHTML = `
                    <img src="${qrUrl}" alt="Código QR - ${activeQR.titulo}" 
                         style="max-width: 100%; max-height: 100%; object-fit: contain; border-radius: 0.5rem;">
                    <div style="position: absolute; bottom: 0.5rem; left: 0.5rem; right: 0.5rem; 
                               background: rgba(0,0,0,0.7); color: white; padding: 0.5rem; 
                               border-radius: 0.25rem; font-size: 0.9rem; text-align: center;">
                        ${activeQR.titulo}
                    </div>
                `;
                qrContainer.style.position = 'relative';
                console.log('✅ Código QR actualizado');
            } else {
                console.warn('⚠️ Elemento qr-code no encontrado');
            }
        } else {
            console.log('⚠️ No hay códigos QR activos');
            const qrContainer = document.querySelector('.qr-code');
            if (qrContainer) {
                qrContainer.innerHTML = '<div class="qr-placeholder">📱</div>';
            }
        }
    } catch (error) {
        console.error('❌ Error al cargar código QR:', error);
        const qrContainer = document.querySelector('.qr-code');
        if (qrContainer) {
            qrContainer.innerHTML = '<div class="qr-placeholder">📱</div>';
        }
    }
}

// FUNCIONES PARA CONTROL MANUAL DEL CARRUSEL
// Hacer las funciones disponibles globalmente para usar desde la consola
window.carrusel = {
    // Ir a la página del menú
    irAMenu: function() {
        document.getElementById(pages[currentPage]).classList.remove('active');
        currentPage = 0; // Índice de la página del menú
        document.getElementById(pages[currentPage]).classList.add('active');
        console.log('📋 Cambiado a página del menú');
    },
    
    // Ir a la página de información
    irAInfo: function() {
        document.getElementById(pages[currentPage]).classList.remove('active');
        currentPage = 1; // Índice de la página de información
        document.getElementById(pages[currentPage]).classList.add('active');
        console.log('ℹ️ Cambiado a página de información');
    },
    
    // Mostrar página actual
    paginaActual: function() {
        console.log(`📄 Página actual: ${pages[currentPage]} (índice ${currentPage})`);
        return pages[currentPage];
    },
    
    // Listar páginas disponibles
    paginasDisponibles: function() {
        console.log('📚 Páginas disponibles:');
        pages.forEach((page, index) => {
            console.log(`  ${index}: ${page} ${index === currentPage ? '(ACTUAL)' : ''}`);
        });
        return pages;
    }
};

// Mostrar instrucciones en la consola
console.log('🎮 Controles del carrusel disponibles:');
console.log('  carrusel.irAMenu() - Ir a la página del menú');
console.log('  carrusel.irAInfo() - Ir a la página de información');
console.log('  carrusel.paginaActual() - Ver página actual');
console.log('  carrusel.paginasDisponibles() - Listar todas las páginas');

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Inicializando aplicación...');
    
    // Actualizar fecha y hora
    updateDateTime();
    
    // Cargar datos según la página actual
    const currentPath = window.location.pathname;
    
    if (currentPath.includes('menu.html')) {
        console.log('📋 Página del menú detectada');
        // Cargar menú para la página específica del menú
        loadMenu();
        setInterval(loadMenu, UPDATE_INTERVALS.MENU);
    } else if (currentPath.includes('info.html')) {
        console.log('ℹ️ Página de información detectada');
        // Cargar datos para la página de información con nuevo carrusel
        loadInfoCarousel();
        loadWeather();
        loadQR();
        
        setInterval(loadInfoCarousel, UPDATE_INTERVALS.MESSAGES);
        setInterval(loadWeather, UPDATE_INTERVALS.WEATHER);
        setInterval(loadQR, UPDATE_INTERVALS.MESSAGES);
    } else {
        console.log('🏠 Página principal detectada');
        // Página principal con carrusel
        loadMenuTomorrow();
        loadMixedCarousel();
        loadMessages();
        loadWeather();
        loadFeaturedImage();
        loadQR();
        initPageCarousel();
        
        setInterval(loadMenuTomorrow, UPDATE_INTERVALS.MENU);
        setInterval(loadMixedCarousel, UPDATE_INTERVALS.MESSAGES);
        setInterval(loadMessages, UPDATE_INTERVALS.MESSAGES);
        setInterval(loadWeather, UPDATE_INTERVALS.WEATHER);
        setInterval(loadFeaturedImage, UPDATE_INTERVALS.MESSAGES);
        setInterval(loadQR, UPDATE_INTERVALS.MESSAGES);
    }
    
    // Actualizar fecha y hora cada segundo
    setInterval(updateDateTime, UPDATE_INTERVALS.DATETIME);
    
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
        updateIndicator.style.backgroundColor = '#ff6b35';
        updateIndicator.style.color = 'white';
        updateIndicator.style.fontWeight = 'bold';
        updateIndicator.style.zIndex = '9999';
        
        // Si es un mensaje de recarga, mantenerlo visible más tiempo
        if (message.includes('Recargando')) {
            updateIndicator.style.backgroundColor = '#dc3545';
            updateIndicator.style.fontSize = '18px';
            updateIndicator.style.padding = '15px';
            updateIndicator.style.borderRadius = '8px';
            updateIndicator.style.boxShadow = '0 4px 8px rgba(0,0,0,0.3)';
        } else {
            setTimeout(() => {
                updateIndicator.style.display = 'none';
            }, 2000);
        }
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
    
    console.log('✅ Aplicación inicializada correctamente');
});

// Función para verificar el estado del servidor
async function checkServerStatus() {
    try {
        const response = await fetch(`${API_URL}/health`);
        return response.ok;
    } catch (error) {
        return false;
    }
}

// Función para recargar la página si es necesario
function reloadIfNeeded() {
    // Verificar si la página ha estado inactiva por más de 1 hora
    const lastActivity = localStorage.getItem('lastActivity') || Date.now();
    const now = Date.now();
    const oneHour = 60 * 60 * 1000;
    
    if (now - lastActivity > oneHour) {
        console.log('Página inactiva por más de 1 hora, recargando...');
        window.location.reload();
    }
    
    localStorage.setItem('lastActivity', now);
}

// Actualizar actividad del usuario
document.addEventListener('click', function() {
    localStorage.setItem('lastActivity', Date.now());
});

document.addEventListener('keypress', function() {
    localStorage.setItem('lastActivity', Date.now());
});

    // Verificar recarga cada 30 minutos
    setInterval(reloadIfNeeded, 30 * 60 * 1000);
    
    // Recarga automática cada 5 minutos para mantener la página actualizada
    setInterval(() => {
        console.log('🔄 Recarga automática programada - recargando página...');
        
        // Mostrar contador regresivo
        let countdown = 3;
        const countdownInterval = setInterval(() => {
            showUpdateIndicator(`Recargando página en ${countdown}...`);
            countdown--;
            
            if (countdown < 0) {
                clearInterval(countdownInterval);
                try {
                    // Forzar recarga completa desde el servidor (como F5)
                    window.location.reload(true);
                } catch (error) {
                    console.log('Método reload falló, usando location.href...');
                    // Método alternativo si reload falla
                    window.location.href = window.location.href;
                }
            }
        }, 1000);
    }, UPDATE_INTERVALS.PAGE_RELOAD);

// NUEVA FUNCIÓN PARA ACTUALIZAR EL MENÚ SEMANAL
function updateWeeklyMenu(menuData, currentDay) {
    console.log('🔄 Actualizando menú semanal...');
    console.log('📊 Datos del menú:', menuData);
    console.log('📅 Día actual:', currentDay);
    
    const menuDisplay = document.getElementById('menu-display');
    if (!menuDisplay) {
        console.error('❌ Elemento menu-display no encontrado');
        return;
    }
    
    console.log('✅ Elemento menu-display encontrado');
    
    // Obtener días de la semana (solo días laborables: lunes a viernes)
    const daysOfWeek = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes'];
    const dayNames = ['LUNES', 'MARTES', 'MIÉRCOLES', 'JUEVES', 'VIERNES'];
    
    // Encontrar índice del día actual
    const currentDayIndex = daysOfWeek.indexOf(currentDay.toLowerCase());
    console.log('🔍 Índice del día actual:', currentDayIndex);
    
    // Si el día actual no está en la lista (sábado/domingo), mostrar lunes como día actual
    let actualCurrentDay = currentDay;
    let actualCurrentDayIndex = currentDayIndex;
    if (currentDayIndex === -1) {
        actualCurrentDay = 'lunes';
        actualCurrentDayIndex = 0;
        console.log('📅 Día actual ajustado a lunes (fin de semana detectado)');
    }
    
    // Obtener el próximo día (el mismo que se muestra en la sección de próximo menú)
    let nextDay;
    if (actualCurrentDayIndex === daysOfWeek.length - 1) {
        // Si es viernes, el próximo día es lunes
        nextDay = 'lunes';
    } else {
        // Para otros días, obtener el siguiente
        nextDay = daysOfWeek[actualCurrentDayIndex + 1];
    }
    console.log('📅 Próximo día:', nextDay);
    
    // Crear array con todos los días excepto el actual Y el próximo día
    let otherDays = [];
    for (let i = 0; i < daysOfWeek.length; i++) {
        if (i !== actualCurrentDayIndex && daysOfWeek[i] !== nextDay) {
            otherDays.push({
                day: daysOfWeek[i],
                dayName: dayNames[i],
                index: i
            });
        }
    }
    
    console.log('📋 Días adicionales para rotar (excluyendo actual y próximo):', otherDays);
    
    // Variable para controlar qué día adicional mostrar
    let currentOtherDayIndex = 0;
    
    // Buscar el menú del día actual (fijo)
    const currentDayMenu = menuData.find(menu => menu.dia.toLowerCase() === daysOfWeek[actualCurrentDayIndex]);
    console.log('🍽️ Menú del día actual:', currentDayMenu);
    
    // Crear HTML para el día actual (fijo)
    let currentDayHTML = '';
    if (currentDayMenu) {
        currentDayHTML = `
            <div class="menu-day current-day">
                <div class="day-header">
                    <h3 class="day-title">${dayNames[actualCurrentDayIndex]}</h3>
                    <span class="current-indicator">HOY</span>
                </div>
                <div class="day-menus">
                    <div class="menu-item general">
                        <div class="menu-type-label">GENERAL</div>
                        <div class="menu-content">${currentDayMenu.menu_general}</div>
                    </div>
                    <div class="menu-item vegetarian">
                        <div class="menu-type-label">VEGETARIANO</div>
                        <div class="menu-content">${currentDayMenu.menu_vegetariano}</div>
                    </div>
                    <div class="menu-item celiac">
                        <div class="menu-type-label">CELÍACO</div>
                        <div class="menu-content">${currentDayMenu.menu_celiaco}</div>
                    </div>
                </div>
            </div>
        `;
    }
    
    // Función para crear el título con los 3 días en rotación
    function createRotationTitle(activeDayIndex) {
        if (otherDays.length === 0) {
            return 'ROTACIÓN COMPLETA';
        }
        
        let titleHTML = '';
        for (let i = 0; i < otherDays.length; i++) {
            const day = otherDays[i];
            const isActive = i === activeDayIndex;
            const dayClass = isActive ? 'active-rotation-day' : 'inactive-rotation-day';
            const separator = i < otherDays.length - 1 ? ' | ' : '';
            
            titleHTML += `<span class="${dayClass}">${day.dayName}</span>${separator}`;
        }
        return titleHTML;
    }
    
    // Función para actualizar solo la columna derecha
    function updateRightColumn() {
        console.log('🔄 Actualizando columna derecha...');
        console.log('📅 Día adicional actual:', currentOtherDayIndex);
        
        // Si no hay días adicionales para rotar, mostrar mensaje
        if (otherDays.length === 0) {
            const otherDayHTML = `
                <div class="menu-day other-day fade-out">
                    <div class="day-header">
                        <h3 class="day-title">ROTACIÓN</h3>
                    </div>
                    <div class="day-menus" style="justify-content:center;align-items:center;min-height:120px;">
                        <div style="width:100%;text-align:center;color:#aaa;font-size:1.5em;opacity:0.7;">Todos los días mostrados</div>
                    </div>
                </div>
            `;
            const completeHTML = currentDayHTML + otherDayHTML;
            menuDisplay.innerHTML = completeHTML;
            return;
        }
        
        // Obtener el día adicional a mostrar
        const otherDayToShow = otherDays[currentOtherDayIndex];
        const otherDayMenu = menuData.find(menu => menu.dia.toLowerCase() === otherDayToShow.day);
        
        // Crear título con los 3 días en rotación
        const rotationTitle = createRotationTitle(currentOtherDayIndex);
        
        let otherDayHTML = '';
        if (otherDayMenu) {
            otherDayHTML = `
                <div class="menu-day other-day fade-out">
                    <div class="day-header">
                        <h3 class="day-title">${rotationTitle}</h3>
                    </div>
                    <div class="day-menus">
                        <div class="menu-item general">
                            <div class="menu-type-label">GENERAL</div>
                            <div class="menu-content">${otherDayMenu.menu_general}</div>
                        </div>
                        <div class="menu-item vegetarian">
                            <div class="menu-type-label">VEGETARIANO</div>
                            <div class="menu-content">${otherDayMenu.menu_vegetariano}</div>
                        </div>
                        <div class="menu-item celiac">
                            <div class="menu-type-label">CELÍACO</div>
                            <div class="menu-content">${otherDayMenu.menu_celiaco}</div>
                        </div>
                    </div>
                </div>
            `;
        } else {
            otherDayHTML = `
                <div class="menu-day other-day fade-out">
                    <div class="day-header">
                        <h3 class="day-title">${rotationTitle}</h3>
                    </div>
                    <div class="day-menus" style="justify-content:center;align-items:center;min-height:120px;">
                        <div style="width:100%;text-align:center;color:#aaa;font-size:1.5em;opacity:0.7;">Sin menú cargado</div>
                    </div>
                </div>
            `;
        }
        const completeHTML = currentDayHTML + otherDayHTML;
        const rightColumn = menuDisplay.querySelector('.other-day');
        if (rightColumn) {
            rightColumn.classList.add('fade-out');
        }
        setTimeout(() => {
            menuDisplay.innerHTML = completeHTML;
            const newRightColumn = menuDisplay.querySelector('.other-day');
            if (newRightColumn) {
                setTimeout(() => {
                    newRightColumn.classList.remove('fade-out');
                    newRightColumn.classList.add('fade-in');
                }, 50);
            }
        }, 400);
    }
    
    // Mostrar inicialmente
    updateRightColumn();
    
    // Función para rotar al siguiente día
    function rotateToNextDay() {
        console.log('🔄 Rotando al siguiente día...');
        if (otherDays.length > 0) {
            currentOtherDayIndex = (currentOtherDayIndex + 1) % otherDays.length;
            updateRightColumn();
        }
    }
    
    // Iniciar rotación automática cada 8 segundos solo si hay días para rotar
    if (otherDays.length > 0) {
        console.log('⏰ Iniciando rotación automática cada 8 segundos');
        setInterval(rotateToNextDay, 8000);
    } else {
        console.log('⚠️ No hay días para rotar, mostrando solo día actual');
    }
} 