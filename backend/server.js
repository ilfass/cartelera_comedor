const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const basicAuth = require('express-basic-auth');

const app = express();
const port = 3000;

// Configuración de autenticación básica para el panel de administración
const auth = basicAuth({
    users: { 'admin': 'admin123' },
    challenge: true
});

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '../frontend')));

// Conexión a la base de datos
const db = new sqlite3.Database('database.sqlite', (err) => {
    if (err) {
        console.error('Error al conectar con la base de datos:', err);
    } else {
        console.log('Conexión exitosa con la base de datos SQLite');
        // Crear tablas si no existen
        db.serialize(() => {
            // Tabla de menú
            db.run(`DROP TABLE IF EXISTS menu`);
            db.run(`CREATE TABLE menu (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                dia TEXT NOT NULL,
                menu_general TEXT,
                menu_vegetariano TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`);

            // Tabla de mensajes
            db.run(`CREATE TABLE IF NOT EXISTS mensajes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                titulo TEXT NOT NULL,
                contenido TEXT NOT NULL,
                fecha TEXT NOT NULL,
                destacado INTEGER DEFAULT 0
            )`);

            // Tabla de imágenes
            db.run(`CREATE TABLE IF NOT EXISTS imagenes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                url TEXT NOT NULL,
                titulo TEXT,
                descripcion TEXT
            )`);
        });
    }
});

// Rutas para el panel de administración
app.get('/admin', auth, (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/admin.html'));
});

// Rutas para el menú
app.get('/api/menu', (req, res) => {
    db.all('SELECT * FROM menu ORDER BY CASE dia WHEN "Lunes" THEN 1 WHEN "Martes" THEN 2 WHEN "Miércoles" THEN 3 WHEN "Jueves" THEN 4 WHEN "Viernes" THEN 5 END', [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

app.post('/api/menu', auth, (req, res) => {
    const { dia, menu_general, menu_vegetariano } = req.body;
    db.run('INSERT INTO menu (dia, menu_general, menu_vegetariano) VALUES (?, ?, ?)',
        [dia, menu_general, menu_vegetariano],
        function(err) {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            res.json({ id: this.lastID });
        });
});

app.put('/api/menu/:id', auth, (req, res) => {
    const { dia, menu_general, menu_vegetariano } = req.body;
    db.run('UPDATE menu SET dia = ?, menu_general = ?, menu_vegetariano = ? WHERE id = ?',
        [dia, menu_general, menu_vegetariano, req.params.id],
        function(err) {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            res.json({ changes: this.changes });
        });
});

app.delete('/api/menu/:id', auth, (req, res) => {
    db.run('DELETE FROM menu WHERE id = ?', req.params.id, function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ changes: this.changes });
    });
});

// Rutas para los mensajes
app.get('/api/mensajes', (req, res) => {
    db.all('SELECT * FROM mensajes ORDER BY fecha DESC', [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

app.post('/api/mensajes', auth, (req, res) => {
    const { titulo, contenido, destacado } = req.body;
    const fecha = new Date().toISOString();
    db.run('INSERT INTO mensajes (titulo, contenido, fecha, destacado) VALUES (?, ?, ?, ?)',
        [titulo, contenido, fecha, destacado ? 1 : 0],
        function(err) {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            res.json({ id: this.lastID });
        });
});

app.put('/api/mensajes/:id', auth, (req, res) => {
    const { titulo, contenido, destacado } = req.body;
    db.run('UPDATE mensajes SET titulo = ?, contenido = ?, destacado = ? WHERE id = ?',
        [titulo, contenido, destacado ? 1 : 0, req.params.id],
        function(err) {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            res.json({ changes: this.changes });
        });
});

app.delete('/api/mensajes/:id', auth, (req, res) => {
    db.run('DELETE FROM mensajes WHERE id = ?', req.params.id, function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ changes: this.changes });
    });
});

// Rutas para las imágenes
app.get('/api/imagenes', (req, res) => {
    db.all('SELECT * FROM imagenes', [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

app.post('/api/imagenes', auth, (req, res) => {
    const { url, titulo, descripcion } = req.body;
    db.run('INSERT INTO imagenes (url, titulo, descripcion) VALUES (?, ?, ?)',
        [url, titulo, descripcion],
        function(err) {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            res.json({ id: this.lastID });
        });
});

app.delete('/api/imagenes/:id', auth, (req, res) => {
    db.run('DELETE FROM imagenes WHERE id = ?', req.params.id, function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ changes: this.changes });
    });
});

// Iniciar el servidor
app.listen(port, () => {
    console.log(`Servidor corriendo en http://localhost:${port}`);
}); 