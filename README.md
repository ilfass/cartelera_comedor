# 🍽️ Pizarra Digital - Comedor Universitario UNICEN

Sistema de pizarra digital para el comedor universitario de la UNICEN, con panel de administración completo.

## 🚀 Características

### 📱 Frontend (Pizarra Digital)
- **Menú semanal** con opciones general, vegetariano y celíaco
- **Mensajes importantes** con sistema de destacados
- **Información del clima** en tiempo real
- **Carrusel automático** entre páginas
- **Diseño responsivo** para diferentes pantallas
- **Reloj y fecha** en tiempo real

### 🔧 Panel de Administración
- **Sistema de login** seguro con JWT
- **Gestión de menús** (crear, editar, eliminar)
- **Gestión de mensajes** con destacados
- **Gestión de imágenes**
- **Interfaz moderna** y fácil de usar

## 📁 Estructura del Proyecto

```
appTv/
├── backend/                 # Servidor Node.js
│   ├── server.js           # Servidor principal
│   ├── package.json        # Dependencias del backend
│   └── database.sqlite     # Base de datos
├── frontend/               # Aplicación web
│   ├── index.html          # Página principal
│   ├── login.html          # Página de login
│   ├── admin.html          # Panel de administración
│   ├── app.js              # Lógica principal
│   ├── admin.js            # Lógica del admin
│   ├── styles.css          # Estilos principales
│   ├── admin.css           # Estilos del admin
│   └── uploads/            # Imágenes subidas
└── README.md
```

## 🛠️ Instalación y Configuración

### Prerrequisitos
- Node.js (v14 o superior)
- npm

### 1. Clonar el repositorio
```bash
git clone <url-del-repositorio>
cd appTv
```

### 2. Instalar dependencias
```bash
cd backend
npm install
```

### 3. Iniciar el servidor
```bash
npm run dev
```

El servidor se iniciará en `http://localhost:3000`

## 🌐 Accesos

### Pizarra Digital
- **URL:** http://localhost:3000
- **Descripción:** Pizarra principal visible al público

### Panel de Administración
- **URL:** http://localhost:3000/login.html
- **Credenciales:**
  - Usuario: `admin`
  - Contraseña: `admin123`

## 🔐 Autenticación

El sistema utiliza **JWT (JSON Web Tokens)** para la autenticación:

1. **Login:** POST `/api/auth/login`
2. **Token:** Se almacena en localStorage
3. **Verificación:** Automática en cada petición
4. **Logout:** Limpia el token y redirige

## 📊 API Endpoints

### Autenticación
- `POST /api/auth/login` - Iniciar sesión

### Menús
- `GET /api/menu` - Obtener todos los menús
- `POST /api/menu` - Crear/actualizar menú
- `DELETE /api/menu/:dia` - Eliminar menú por día

### Mensajes
- `GET /api/mensajes` - Obtener todos los mensajes
- `POST /api/mensajes` - Crear mensaje
- `PUT /api/mensajes/:id` - Actualizar mensaje
- `DELETE /api/mensajes/:id` - Eliminar mensaje

### Imágenes
- `GET /api/imagenes` - Obtener todas las imágenes
- `POST /api/imagenes` - Subir imagen
- `DELETE /api/imagenes/:id` - Eliminar imagen

## 🎨 Personalización

### Colores principales
- **Verde:** #38b48e (principal)
- **Azul:** #2563eb (secundario)
- **Amarillo:** #eab308 (destacado)

### Fuentes
- **Inter** (Google Fonts)

## 🔧 Comandos Útiles

```bash
# Iniciar en modo desarrollo
cd backend && npm run dev

# Iniciar en modo producción
cd backend && npm start

# Ver logs del servidor
tail -f backend/logs/server.log
```

## 🐛 Solución de Problemas

### Error de puerto ocupado
```bash
# Verificar procesos
ps aux | grep node

# Matar proceso
pkill -f "node server.js"
```

### Error de base de datos
```bash
# Eliminar y recrear base de datos
rm backend/database.sqlite
npm run dev
```

### Error de autenticación
1. Verificar credenciales: `admin` / `admin123`
2. Limpiar localStorage del navegador
3. Reiniciar el servidor

## 📝 Notas de Desarrollo

- **Base de datos:** SQLite (archivo local)
- **Autenticación:** JWT + bcrypt
- **Frontend:** HTML5 + CSS3 + JavaScript vanilla
- **Backend:** Node.js + Express
- **Archivos:** Multer para subida de imágenes

## 🤝 Contribución

1. Fork el proyecto
2. Crear una rama para tu feature
3. Commit tus cambios
4. Push a la rama
5. Abrir un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT.

---

**Desarrollado para el Comedor Universitario UNICEN** 🏛️ 