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
const TOKEN_EXPIRATION = '24h'; // Cambiado a 24 horas para pruebas

// Middleware de autenticación
const authenticateToken = (req, res, next) => {
    console.log('Verificando token de autenticación');
    const authHeader = req.headers['authorization'];
    console.log('Headers recibidos:', req.headers);
    
    if (!authHeader) {
        console.log('No se proporcionó header de autorización');
        return res.status(401).json({ 
            code: 'NO_TOKEN',
            message: 'Token no proporcionado',
            error: 'NO_TOKEN'
        });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
        console.log('No se encontró token en el header');
        return res.status(401).json({ 
            code: 'NO_TOKEN',
            message: 'Token no proporcionado',
            error: 'NO_TOKEN'
        });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        console.log('Token verificado exitosamente para usuario:', decoded.username);
        req.user = decoded;
        next();
    } catch (err) {
        console.log('Error al verificar token:', err.message);
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({ 
                code: 'TOKEN_EXPIRED',
                message: 'Token expirado', 
                error: 'TOKEN_EXPIRED'
            });
        }
        return res.status(401).json({ 
            code: 'INVALID_TOKEN',
            message: 'Token inválido',
            error: 'INVALID_TOKEN'
        });
    }
};

// Conexión a la base de datos
const db = new sqlite3.Database(path.join(__dirname, 'database.sqlite'), (err) => {
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
                menu_celiaco TEXT,
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

// Función para quitar tildes y pasar a minúsculas
function normalizarDia(str) {
    return str
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
}

app.post('/api/menu', authenticateToken, (req, res) => {
    console.log('Body completo recibido:', req.body);
    let { dia, menu_general, menu_vegetariano, menu_celiaco } = req.body;
    console.log('Datos extraídos:', { dia, menu_general, menu_vegetariano, menu_celiaco });
    dia = normalizarDia(dia);
    console.log('Día normalizado:', dia);
    console.log('Valores a insertar:', [dia, menu_general, menu_vegetariano, menu_celiaco]);
    db.run('INSERT OR REPLACE INTO menu (dia, menu_general, menu_vegetariano, menu_celiaco) VALUES (?, ?, ?, ?)',
        [dia, menu_general, menu_vegetariano, menu_celiaco],
        function(err) {
            if (err) {
                console.error('Error al guardar el menú:', err);
                res.status(500).json({ message: 'Error al guardar el menú' });
            } else {
                console.log('Menú guardado exitosamente');
                res.json({ message: 'Menú guardado exitosamente' });
            }
        });
});

app.put('/api/menu/:id', auth, (req, res) => {
    let { dia, menu_general, menu_vegetariano, menu_celiaco } = req.body;
    dia = normalizarDia(dia);
    db.run('UPDATE menu SET dia = ?, menu_general = ?, menu_vegetariano = ?, menu_celiaco = ? WHERE id = ?',
        [dia, menu_general, menu_vegetariano, menu_celiaco, req.params.id],
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

// Ruta para eliminar un menú por día
app.delete('/api/menu/:dia', authenticateToken, (req, res) => {
    console.log('Intentando eliminar menú para el día:', req.params.dia);
    console.log('Usuario autenticado:', req.user);
    
    const dia = normalizarDia(req.params.dia);
    console.log('Día normalizado:', dia);
    
    // Verificar si el menú existe
    db.get('SELECT * FROM menu WHERE dia = ?', [dia], (err, row) => {
        if (err) {
            console.error('Error al verificar menú:', err);
            return res.status(500).json({ 
                code: 'DB_ERROR',
                message: 'Error al verificar el menú',
                error: err.message
            });
        }

        if (!row) {
            console.log('No se encontró menú para el día:', dia);
            return res.status(404).json({ 
                code: 'NOT_FOUND',
                message: 'No se encontró un menú para el día especificado'
            });
        }

        // Si existe, procedemos a eliminarlo
        db.run('DELETE FROM menu WHERE dia = ?', [dia], function(err) {
            if (err) {
                console.error('Error al eliminar menú:', err);
                return res.status(500).json({ 
                    code: 'DB_ERROR',
                    message: 'Error al eliminar el menú',
                    error: err.message
                });
            }
            
            console.log('Menú eliminado exitosamente para el día:', dia);
            res.json({ 
                code: 'SUCCESS',
                message: 'Menú eliminado exitosamente',
                changes: this.changes
            });
        });
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

    db.run('INSERT INTO mensajes (titulo, contenido, destacado) VALUES (?, ?, ?)',
        [titulo, contenido, destacado ? 1 : 0],
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
    db.run('DELETE FROM mensajes WHERE id = ?', [req.params.id], function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        if (this.changes === 0) {
            res.status(404).json({ message: 'Mensaje no encontrado' });
            return;
        }
        res.json({ message: 'Mensaje eliminado exitosamente' });
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

app.delete('/api/imagenes/:id', authenticateToken, (req, res) => {
    // Primero obtenemos la información de la imagen para eliminar el archivo
    db.get('SELECT url FROM imagenes WHERE id = ?', [req.params.id], (err, row) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        if (!row) {
            res.status(404).json({ message: 'Imagen no encontrada' });
            return;
        }

        // Eliminamos el archivo físico
        const filePath = path.join(__dirname, 'uploads', path.basename(row.url));
        fs.unlink(filePath, (err) => {
            if (err && err.code !== 'ENOENT') {
                console.error('Error al eliminar el archivo:', err);
            }

            // Eliminamos el registro de la base de datos
            db.run('DELETE FROM imagenes WHERE id = ?', [req.params.id], function(err) {
                if (err) {
                    res.status(500).json({ error: err.message });
                    return;
                }
                res.json({ message: 'Imagen eliminada exitosamente' });
            });
        });
    });
});

// Rutas de autenticación
app.post('/api/auth/login', async (req, res) => {
    console.log('Intento de login recibido');
    const { username, password } = req.body;
    console.log('Credenciales recibidas:', { username });

    db.get('SELECT * FROM usuarios WHERE username = ?', [username], async (err, user) => {
        if (err) {
            console.error('Error en la base de datos:', err);
            return res.status(500).json({ message: 'Error en el servidor' });
        }

        if (!user) {
            console.log('Usuario no encontrado:', username);
            return res.status(401).json({ message: 'Usuario o contraseña incorrectos' });
        }

        try {
            const match = await bcrypt.compare(password, user.password);
            if (!match) {
                console.log('Contraseña incorrecta para usuario:', username);
                return res.status(401).json({ message: 'Usuario o contraseña incorrectos' });
            }

            const token = jwt.sign(
                { id: user.id, username: user.username }, 
                JWT_SECRET, 
                { expiresIn: TOKEN_EXPIRATION }
            );
            console.log('Token generado exitosamente para usuario:', username);
            res.json({ token });
        } catch (error) {
            console.error('Error al generar token:', error);
            res.status(500).json({ message: 'Error en el servidor' });
        }
    });
});

// Iniciar el servidor
app.listen(port, () => {
    console.log(`Servidor corriendo en http://localhost:${port}`);
}); 