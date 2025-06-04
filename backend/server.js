const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const basicAuth = require('express-basic-auth');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const multer = require('multer');
const fs = require('fs');

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

// Configuración de JWT
const JWT_SECRET = 'tu_clave_secreta_muy_segura'; // En producción, usar una variable de entorno

// Middleware de autenticación
const authenticateToken = (req, res, next) => {
    console.log('Verificando token de autenticación');
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        console.log('No se proporcionó token');
        return res.status(401).json({ message: 'Token no proporcionado' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            console.log('Error al verificar token:', err.message);
            return res.status(403).json({ message: 'Token inválido' });
        }
        console.log('Token verificado exitosamente para usuario:', user.username);
        req.user = user;
        next();
    });
};

// Conexión a la base de datos
const db = new sqlite3.Database('database.sqlite', (err) => {
    if (err) {
        console.error('Error al conectar con la base de datos:', err);
    } else {
        console.log('Conexión exitosa con la base de datos SQLite');
        // Crear tablas si no existen
        db.serialize(() => {
            // Tabla de usuarios administradores
            db.run(`CREATE TABLE IF NOT EXISTS usuarios (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL
            )`);

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
            db.run(`DROP TABLE IF EXISTS mensajes`);
            db.run(`CREATE TABLE mensajes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                titulo TEXT NOT NULL,
                contenido TEXT NOT NULL,
                fecha DATETIME NOT NULL DEFAULT (datetime('now', 'localtime')),
                destacado BOOLEAN DEFAULT 0
            )`);

            // Tabla de imágenes
            db.run(`DROP TABLE IF EXISTS imagenes`);
            db.run(`CREATE TABLE imagenes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                titulo TEXT NOT NULL,
                url TEXT NOT NULL,
                fecha DATETIME NOT NULL DEFAULT (datetime('now', 'localtime'))
            )`);

            // Crear usuario administrador por defecto si no existe
            const defaultAdmin = {
                username: 'admin',
                password: 'admin123' // En producción, usar una contraseña más segura
            };

            db.get('SELECT * FROM usuarios WHERE username = ?', [defaultAdmin.username], (err, row) => {
                if (err) {
                    console.error('Error al verificar usuario admin:', err);
                } else if (!row) {
                    bcrypt.hash(defaultAdmin.password, 10, (err, hash) => {
                        if (err) {
                            console.error('Error al hashear contraseña:', err);
                        } else {
                            db.run('INSERT INTO usuarios (username, password) VALUES (?, ?)',
                                [defaultAdmin.username, hash],
                                (err) => {
                                    if (err) {
                                        console.error('Error al crear usuario admin:', err);
                                    } else {
                                        console.log('Usuario administrador creado');
                                    }
                                });
                        }
                    });
                }
            });
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

app.post('/api/menu', authenticateToken, (req, res) => {
    const { dia, menu_general, menu_vegetariano } = req.body;
    db.run('INSERT OR REPLACE INTO menu (dia, menu_general, menu_vegetariano) VALUES (?, ?, ?)',
        [dia, menu_general, menu_vegetariano],
        function(err) {
            if (err) {
                res.status(500).json({ message: 'Error al guardar el menú' });
            } else {
                res.json({ message: 'Menú guardado exitosamente' });
            }
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

app.post('/api/mensajes', authenticateToken, (req, res) => {
    console.log('Headers recibidos:', req.headers);
    console.log('Body recibido:', req.body);
    const { titulo, contenido, destacado } = req.body;
    
    if (!titulo || !contenido) {
        console.log('Faltan campos requeridos');
        return res.status(400).json({ message: 'Faltan campos requeridos' });
    }

    const fecha = new Date().toISOString();
    db.run('INSERT INTO mensajes (titulo, contenido, destacado, fecha) VALUES (?, ?, ?, ?)',
        [titulo, contenido, destacado ? 1 : 0, fecha],
        function(err) {
            if (err) {
                console.error('Error en la base de datos:', err);
                res.status(500).json({ message: 'Error al guardar el mensaje' });
            } else {
                res.json({ message: 'Mensaje guardado exitosamente' });
            }
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

app.delete('/api/mensajes/:id', authenticateToken, (req, res) => {
    const { id } = req.params;
    db.run('DELETE FROM mensajes WHERE id = ?', [id], function(err) {
        if (err) {
            res.status(500).json({ message: 'Error al eliminar el mensaje' });
        } else {
            res.json({ message: 'Mensaje eliminado exitosamente' });
        }
    });
});

// Rutas para las imágenes
app.get('/api/imagenes', (req, res) => {
    db.all('SELECT * FROM imagenes ORDER BY fecha DESC', [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

// Configuración de multer para subida de imágenes
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, '../frontend/uploads');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

app.post('/api/imagenes', authenticateToken, upload.single('image'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'No se ha subido ninguna imagen' });
    }

    const { title } = req.body;
    const imageUrl = `/uploads/${req.file.filename}`;

    db.run('INSERT INTO imagenes (titulo, url) VALUES (?, ?)',
        [title, imageUrl],
        function(err) {
            if (err) {
                res.status(500).json({ message: 'Error al guardar la imagen' });
            } else {
                res.json({ message: 'Imagen guardada exitosamente', url: imageUrl });
            }
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

// Rutas de autenticación
app.post('/api/auth/login', async (req, res) => {
    const { username, password } = req.body;

    db.get('SELECT * FROM usuarios WHERE username = ?', [username], async (err, user) => {
        if (err) {
            return res.status(500).json({ message: 'Error en el servidor' });
        }

        if (!user) {
            return res.status(401).json({ message: 'Usuario o contraseña incorrectos' });
        }

        try {
            const match = await bcrypt.compare(password, user.password);
            if (!match) {
                return res.status(401).json({ message: 'Usuario o contraseña incorrectos' });
            }

            const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '24h' });
            res.json({ token });
        } catch (error) {
            res.status(500).json({ message: 'Error en el servidor' });
        }
    });
});

// Iniciar el servidor
app.listen(port, () => {
    console.log(`Servidor corriendo en http://localhost:${port}`);
}); 