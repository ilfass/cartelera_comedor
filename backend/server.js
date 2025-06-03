const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const basicAuth = require('express-basic-auth');

const app = express();
const port = process.env.PORT || 3000;

// Configuración de autenticación
const adminAuth = basicAuth({
    users: { 'admin': 'unicen2024' }, // Cambiar estas credenciales en producción
    challenge: true,
    realm: 'Pizarra Digital UNICEN'
});

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Servir archivos estáticos
app.use(express.static(path.join(__dirname, '../frontend')));

// Proteger rutas de administración
app.use('/api/admin', adminAuth);

// Ruta específica para el panel de administración
app.get('/admin', adminAuth, (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/admin.html'));
});

// Conexión a la base de datos
const db = new sqlite3.Database('database.sqlite', (err) => {
    if (err) {
        console.error('Error al conectar con la base de datos:', err);
    } else {
        console.log('Conexión exitosa con la base de datos SQLite');
        initDatabase();
    }
});

// Inicialización de la base de datos
function initDatabase() {
    db.serialize(() => {
        // Tabla de menús
        db.run(`CREATE TABLE IF NOT EXISTS menus (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            fecha TEXT NOT NULL,
            plato TEXT NOT NULL,
            tipo TEXT NOT NULL
        )`);

        // Tabla de mensajes
        db.run(`CREATE TABLE IF NOT EXISTS messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            contenido TEXT NOT NULL,
            fecha TEXT NOT NULL
        )`);

        // Tabla de imágenes del carrusel
        db.run(`CREATE TABLE IF NOT EXISTS carousel (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            url TEXT NOT NULL,
            alt TEXT
        )`);
    });
}

// Rutas de la API

// Obtener menú semanal
app.get('/api/menu', (req, res) => {
    const today = new Date();
    const weekStart = new Date(today.setDate(today.getDate() - today.getDay() + 1));
    const weekEnd = new Date(today.setDate(today.getDate() + 6));

    db.all(`SELECT * FROM menus WHERE fecha BETWEEN ? AND ?`, 
        [weekStart.toISOString(), weekEnd.toISOString()],
        (err, rows) => {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            
            const menu = {
                general: rows.filter(row => row.tipo === 'general'),
                vegetariano: rows.filter(row => row.tipo === 'vegetariano')
            };
            
            res.json(menu);
        });
});

// Obtener mensajes destacados
app.get('/api/messages', (req, res) => {
    db.all('SELECT * FROM messages ORDER BY fecha DESC', [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

// Obtener imágenes del carrusel
app.get('/api/carousel', (req, res) => {
    db.all('SELECT * FROM carousel', [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

// Rutas de administración

// Agregar menú
app.post('/api/admin/menu', (req, res) => {
    const { fecha, plato, tipo } = req.body;
    db.run('INSERT INTO menus (fecha, plato, tipo) VALUES (?, ?, ?)',
        [fecha, plato, tipo],
        function(err) {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            res.json({ id: this.lastID });
        });
});

// Agregar mensaje
app.post('/api/admin/messages', (req, res) => {
    const { contenido, fecha } = req.body;
    db.run('INSERT INTO messages (contenido, fecha) VALUES (?, ?)',
        [contenido, fecha],
        function(err) {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            res.json({ id: this.lastID });
        });
});

// Agregar imagen al carrusel
app.post('/api/admin/carousel', (req, res) => {
    const { url, alt } = req.body;
    db.run('INSERT INTO carousel (url, alt) VALUES (?, ?)',
        [url, alt],
        function(err) {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            res.json({ id: this.lastID });
        });
});

// Iniciar servidor
app.listen(port, () => {
    console.log(`Servidor corriendo en http://localhost:${port}`);
}); 