# Pizarra Digital - Comedor UNICEN

Sistema de visualización de información para el comedor universitario de UNICEN.

## Características

- Visualización de menús semanales (general y vegetariano)
- Mensajes destacados
- Información del clima actual
- Carrusel de imágenes
- Panel de administración para gestionar el contenido

## Requisitos

- Node.js (v14 o superior)
- SQLite3
- API Key de OpenWeather

## Instalación

1. Clonar el repositorio:
```bash
git clone [URL_DEL_REPOSITORIO]
cd pizarra-digital
```

2. Instalar dependencias:
```bash
cd backend
npm install
```

3. Configurar variables de entorno:
- Crear un archivo `.env` en el directorio `backend` con la siguiente estructura:
```
WEATHER_API_KEY=tu_api_key_de_openweather
```

4. Iniciar el servidor:
```bash
npm start
```

## Estructura del Proyecto

```
pizarra-digital/
├── frontend/
│   ├── index.html
│   ├── styles.css
│   └── app.js
├── backend/
│   ├── server.js
│   ├── package.json
│   └── database.sqlite
└── README.md
```

## API Endpoints

### Públicos
- `GET /api/menu` - Obtener menú semanal
- `GET /api/messages` - Obtener mensajes destacados
- `GET /api/carousel` - Obtener imágenes del carrusel

### Administración
- `POST /api/admin/menu` - Agregar menú
- `POST /api/admin/messages` - Agregar mensaje
- `POST /api/admin/carousel` - Agregar imagen al carrusel

## Despliegue en Kubernetes

1. Crear los archivos de configuración de Kubernetes:
```bash
kubectl apply -f k8s/
```

2. Verificar el despliegue:
```bash
kubectl get pods
kubectl get services
```

## Contribución

1. Fork el repositorio
2. Crear una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abrir un Pull Request

## Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para más detalles. 