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
const axios = require('axios');

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

// Función para obtener el día de la semana en español
function obtenerDiaSemana(fecha) {
    const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    return dias[fecha.getDay()];
}

// Función para formatear fecha como YYYY-MM-DD
function formatearFecha(fecha) {
    return fecha.toISOString().split('T')[0];
}

// Función para consumir la API de UNICEN y actualizar menús
async function actualizarMenuDesdeAPI(fecha) {
    try {
        const fechaFormateada = formatearFecha(fecha);
        const diaSemana = obtenerDiaSemana(fecha);
        
        // Solo procesar días laborables
        if (fecha.getDay() === 0 || fecha.getDay() === 6) {
            console.log(`Saltando ${diaSemana} (${fechaFormateada}) - día no laborable`);
            return 0;
        }
        
        const url = `http://turnero-test.unicen.edu.ar/api/platos-del-dia/${fechaFormateada}`;
        
        console.log(`Consumiendo API de UNICEN para la fecha: ${fechaFormateada}`);
        const response = await axios.get(url);
        
        if (response.data && response.data.data && response.data.data.length > 0) {
            const platos = response.data.data;
            let menuGeneral = '';
            let menuVegetariano = '';
            let menuCeliaco = '';
            
            // Procesar los platos según su característica
            platos.forEach(plato => {
                switch (plato.caracteristica) {
                    case 'CLASICO':
                        menuGeneral += (menuGeneral ? '\n' : '') + plato.plato;
                        break;
                    case 'VEGETARIANO':
                        menuVegetariano += (menuVegetariano ? '\n' : '') + plato.plato;
                        break;
                    case 'CELIACO':
                        menuCeliaco += (menuCeliaco ? '\n' : '') + plato.plato;
                        break;
                }
            });
            
            const diaNormalizado = normalizarDia(diaSemana);
            
            // Actualizar o insertar en la base de datos
            return new Promise((resolve, reject) => {
                db.run('INSERT OR REPLACE INTO menu (dia, menu_general, menu_vegetariano, menu_celiaco) VALUES (?, ?, ?, ?)',
                    [diaNormalizado, menuGeneral, menuVegetariano, menuCeliaco],
                    function(err) {
                        if (err) {
                            console.error('Error al guardar menú desde API:', err);
                            reject(err);
                        } else {
                            console.log(`Menú actualizado desde API para ${diaSemana} (${fechaFormateada})`);
                            console.log(`  - Clásico: ${menuGeneral || 'Sin datos'}`);
                            console.log(`  - Vegetariano: ${menuVegetariano || 'Sin datos'}`);
                            console.log(`  - Celíaco: ${menuCeliaco || 'Sin datos'}`);
                            resolve(this.changes);
                        }
                    });
            });
        } else {
            console.log(`No se encontraron platos para la fecha: ${fechaFormateada} (${diaSemana})`);
            return 0;
        }
    } catch (error) {
        console.error('Error al consumir API de UNICEN:', error.message);
        return 0;
    }
}

// Función para actualizar menús de la semana actual
async function actualizarMenusSemana() {
    const hoy = new Date();
    const diasSemana = [];
    
    // Obtener los próximos 5 días laborables (Lunes a Viernes)
    for (let i = 0; i < 7; i++) {
        const fecha = new Date(hoy);
        fecha.setDate(hoy.getDate() + i);
        
        // Solo incluir días de lunes a viernes
        if (fecha.getDay() >= 1 && fecha.getDay() <= 5) {
            diasSemana.push(fecha);
        }
    }
    
    console.log('Actualizando menús para la semana...');
    let actualizaciones = 0;
    
    // Primero, limpiar datos incorrectos (domingo, sábado)
    const diasIncorrectos = ['domingo', 'sabado'];
    for (const dia of diasIncorrectos) {
        db.run('DELETE FROM menu WHERE dia = ?', [dia], (err) => {
            if (err) {
                console.error(`Error al limpiar menú de ${dia}:`, err);
            } else {
                console.log(`Menú de ${dia} eliminado (día no laborable)`);
            }
        });
    }
    
    for (const fecha of diasSemana) {
        try {
            const cambios = await actualizarMenuDesdeAPI(fecha);
            if (cambios > 0) {
                actualizaciones++;
            }
            // Pequeña pausa entre peticiones para no sobrecargar la API
            await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error) {
            console.error(`Error al actualizar menú para ${formatearFecha(fecha)}:`, error.message);
        }
    }
    
    console.log(`Actualización completada. ${actualizaciones} menús actualizados.`);
    return actualizaciones;
}

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

            // Tabla de códigos QR
            db.run(`CREATE TABLE IF NOT EXISTS qr_codes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                titulo TEXT NOT NULL,
                url TEXT NOT NULL,
                descripcion TEXT,
                activo BOOLEAN DEFAULT 1,
                fecha DATETIME NOT NULL DEFAULT (datetime('now', 'localtime'))
            )`);

            // Tabla de configuración general
            db.run(`CREATE TABLE IF NOT EXISTS config (
                clave TEXT PRIMARY KEY,
                valor TEXT
            )`);
            // Insertar valor por defecto si no existe
            db.get('SELECT * FROM config WHERE clave = ?', ['intervalo_carrusel'], (err, row) => {
                if (!row) {
                    db.run('INSERT INTO config (clave, valor) VALUES (?, ?)', ['intervalo_carrusel', '5000']);
                }
            });

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

            // Insertar datos de prueba para mensajes
            db.get('SELECT COUNT(*) as count FROM mensajes', [], (err, row) => {
                if (err) {
                    console.error('Error al verificar mensajes:', err);
                } else if (row.count === 0) {
                    const mensajesPrueba = [
                        {
                            titulo: '¡Bienvenidos al Comedor UNICEN!',
                            contenido: 'Les damos la bienvenida a todos los estudiantes, docentes y personal. Disfruten de nuestros menús saludables y variados.',
                            destacado: 1
                        },
                        {
                            titulo: 'Menú Vegetariano Disponible',
                            contenido: 'Recordamos que todos los días tenemos opciones vegetarianas y veganas. Consulten con nuestro personal para más información.',
                            destacado: 0
                        },
                        {
                            titulo: 'Horarios de Atención',
                            contenido: 'Lunes a Viernes de 9:00 a 18:00. Los fines de semana permanecemos cerrados.',
                            destacado: 0
                        },
                        {
                            titulo: 'Información Nutricional',
                            contenido: 'Todos nuestros menús están preparados siguiendo las recomendaciones nutricionales para una alimentación saludable.',
                            destacado: 0
                        }
                    ];

                    mensajesPrueba.forEach(mensaje => {
                        db.run('INSERT INTO mensajes (titulo, contenido, destacado) VALUES (?, ?, ?)',
                            [mensaje.titulo, mensaje.contenido, mensaje.destacado],
                            (err) => {
                                if (err) {
                                    console.error('Error al insertar mensaje de prueba:', err);
                                } else {
                                    console.log('Mensaje de prueba insertado:', mensaje.titulo);
                                }
                            });
                    });
                }
            });

            // Insertar datos de prueba para imágenes
            db.get('SELECT COUNT(*) as count FROM imagenes', [], (err, row) => {
                if (err) {
                    console.error('Error al verificar imágenes:', err);
                } else if (row.count === 0) {
                    const imagenesPrueba = [
                        {
                            titulo: 'Comedor UNICEN',
                            url: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&h=600&fit=crop'
                        },
                        {
                            titulo: 'Menú Saludable',
                            url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&h=600&fit=crop'
                        },
                        {
                            titulo: 'Campus Universitario',
                            url: 'https://images.unsplash.com/photo-1523050854058-8df90110c9e1?w=800&h=600&fit=crop'
                        }
                    ];

                    imagenesPrueba.forEach(imagen => {
                        db.run('INSERT INTO imagenes (titulo, url) VALUES (?, ?)',
                            [imagen.titulo, imagen.url],
                            (err) => {
                                if (err) {
                                    console.error('Error al insertar imagen de prueba:', err);
                                } else {
                                    console.log('Imagen de prueba insertada:', imagen.titulo);
                                }
                            });
                    });
                }
            });

            // Insertar datos de prueba para códigos QR
            db.get('SELECT COUNT(*) as count FROM qr_codes', [], (err, row) => {
                if (err) {
                    console.error('Error al verificar códigos QR:', err);
                } else if (row.count === 0) {
                    const qrPrueba = {
                        titulo: 'Menú Digital',
                        url: 'https://comedor.unicen.edu.ar/menu',
                        descripcion: 'Escanea para ver el menú completo del día'
                    };

                    db.run('INSERT INTO qr_codes (titulo, url, descripcion) VALUES (?, ?, ?)',
                        [qrPrueba.titulo, qrPrueba.url, qrPrueba.descripcion],
                        (err) => {
                            if (err) {
                                console.error('Error al insertar QR de prueba:', err);
                            } else {
                                console.log('QR de prueba insertado:', qrPrueba.titulo);
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

// Ruta para la página de login
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/login.html'));
});

// Ruta para la página de login (alternativa)
app.get('/login.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/login.html'));
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

// Ruta para actualizar un menú por día
app.put('/api/menu/:dia', authenticateToken, (req, res) => {
    console.log('Intentando actualizar menú para el día:', req.params.dia);
    console.log('Usuario autenticado:', req.user);
    console.log('Datos recibidos:', req.body);
    
    const diaOriginal = normalizarDia(req.params.dia);
    const { dia, menu_general, menu_vegetariano, menu_celiaco } = req.body;
    const diaNuevo = normalizarDia(dia);
    
    console.log('Día original:', diaOriginal);
    console.log('Día nuevo:', diaNuevo);
    
    // Verificar si el menú existe
    db.get('SELECT * FROM menu WHERE dia = ?', [diaOriginal], (err, row) => {
        if (err) {
            console.error('Error al verificar menú:', err);
            return res.status(500).json({ 
                code: 'DB_ERROR',
                message: 'Error al verificar el menú',
                error: err.message
            });
        }

        if (!row) {
            console.log('No se encontró menú para el día:', diaOriginal);
            return res.status(404).json({ 
                code: 'NOT_FOUND',
                message: 'No se encontró un menú para el día especificado'
            });
        }

        // Si existe, procedemos a actualizarlo
        db.run('UPDATE menu SET dia = ?, menu_general = ?, menu_vegetariano = ?, menu_celiaco = ? WHERE dia = ?',
            [diaNuevo, menu_general, menu_vegetariano, menu_celiaco, diaOriginal],
            function(err) {
                if (err) {
                    console.error('Error al actualizar menú:', err);
                    return res.status(500).json({ 
                        code: 'DB_ERROR',
                        message: 'Error al actualizar el menú',
                        error: err.message
                    });
                }
                
                console.log('Menú actualizado exitosamente para el día:', diaOriginal, '->', diaNuevo);
                res.json({ 
                    code: 'SUCCESS',
                    message: 'Menú actualizado exitosamente',
                    changes: this.changes
                });
            });
    });
});

// Nueva ruta para actualizar menús desde la API de UNICEN
app.post('/api/menu/actualizar-desde-api', authenticateToken, async (req, res) => {
    try {
        console.log('Iniciando actualización de menús desde API de UNICEN...');
        const actualizaciones = await actualizarMenusSemana();
        
        res.json({
            code: 'SUCCESS',
            message: 'Actualización de menús completada',
            actualizaciones: actualizaciones
        });
    } catch (error) {
        console.error('Error en actualización de menús:', error);
        res.status(500).json({
            code: 'API_ERROR',
            message: 'Error al actualizar menús desde la API',
            error: error.message
        });
    }
});

// Nueva ruta para actualizar menú de un día específico desde la API
app.post('/api/menu/actualizar-dia/:fecha', authenticateToken, async (req, res) => {
    try {
        const fechaParam = req.params.fecha; // Formato: YYYY-MM-DD
        const fecha = new Date(fechaParam);
        
        if (isNaN(fecha.getTime())) {
            return res.status(400).json({
                code: 'INVALID_DATE',
                message: 'Formato de fecha inválido. Use YYYY-MM-DD'
            });
        }
        
        console.log(`Actualizando menú para la fecha: ${fechaParam}`);
        const cambios = await actualizarMenuDesdeAPI(fecha);
        
        res.json({
            code: 'SUCCESS',
            message: 'Menú actualizado exitosamente',
            fecha: fechaParam,
            cambios: cambios
        });
    } catch (error) {
        console.error('Error al actualizar menú específico:', error);
        res.status(500).json({
            code: 'API_ERROR',
            message: 'Error al actualizar menú desde la API',
            error: error.message
        });
    }
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

app.put('/api/mensajes/:id', authenticateToken, (req, res) => {
    const { titulo, contenido, destacado } = req.body;
    db.run('UPDATE mensajes SET titulo = ?, contenido = ?, destacado = ? WHERE id = ?',
        [titulo, contenido, destacado ? 1 : 0, req.params.id],
        function(err) {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            if (this.changes === 0) {
                res.status(404).json({ message: 'Mensaje no encontrado' });
                return;
            }
            res.json({ message: 'Mensaje actualizado exitosamente' });
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
        const filePath = path.join(__dirname, '../frontend/uploads', path.basename(row.url));
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

// Rutas para los códigos QR
app.get('/api/qr', (req, res) => {
    db.all('SELECT * FROM qr_codes ORDER BY fecha DESC', [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

app.post('/api/qr', authenticateToken, (req, res) => {
    const { titulo, url, descripcion } = req.body;
    
    if (!titulo || !url) {
        return res.status(400).json({ message: 'Título y URL son requeridos' });
    }

    db.run('INSERT INTO qr_codes (titulo, url, descripcion) VALUES (?, ?, ?)',
        [titulo, url, descripcion || ''],
        function(err) {
            if (err) {
                res.status(500).json({ message: 'Error al guardar el código QR' });
            } else {
                res.json({ message: 'Código QR guardado exitosamente', id: this.lastID });
            }
        });
});

app.put('/api/qr/:id', authenticateToken, (req, res) => {
    const { titulo, url, descripcion, activo } = req.body;
    
    if (!titulo || !url) {
        return res.status(400).json({ message: 'Título y URL son requeridos' });
    }

    db.run('UPDATE qr_codes SET titulo = ?, url = ?, descripcion = ?, activo = ? WHERE id = ?',
        [titulo, url, descripcion || '', activo ? 1 : 0, req.params.id],
        function(err) {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            if (this.changes === 0) {
                res.status(404).json({ message: 'Código QR no encontrado' });
                return;
            }
            res.json({ message: 'Código QR actualizado exitosamente' });
        });
});

app.delete('/api/qr/:id', authenticateToken, (req, res) => {
    db.run('DELETE FROM qr_codes WHERE id = ?', [req.params.id], function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        if (this.changes === 0) {
            res.status(404).json({ message: 'Código QR no encontrado' });
            return;
        }
        res.json({ message: 'Código QR eliminado exitosamente' });
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

// Endpoint para obtener la configuración
app.get('/api/config', (req, res) => {
    db.all('SELECT * FROM config', [], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        // Devolver como objeto clave: valor
        const config = {};
        rows.forEach(row => {
            config[row.clave] = row.valor;
        });
        res.json(config);
    });
});

// Endpoint para actualizar el intervalo del carrusel
app.put('/api/config', authenticateToken, (req, res) => {
    const { valor } = req.body;
    if (!valor || isNaN(Number(valor)) || Number(valor) < 1000) {
        return res.status(400).json({ message: 'Valor inválido para el intervalo (mínimo 1000 ms)' });
    }
    db.run('UPDATE config SET valor = ? WHERE clave = ?', [valor, 'intervalo_carrusel'], function(err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json({ message: 'Intervalo actualizado correctamente', valor });
    });
});

// Ruta para el favicon
app.get('/favicon.ico', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/favicon.ico'));
});

// Iniciar el servidor
app.listen(port, () => {
    console.log(`Servidor corriendo en http://localhost:${port}`);
    
    // Actualizar menús desde la API al iniciar el servidor
    setTimeout(async () => {
        try {
            console.log('Iniciando actualización automática de menús...');
            await actualizarMenusSemana();
        } catch (error) {
            console.error('Error en actualización automática de menús:', error.message);
        }
    }, 5000); // Esperar 5 segundos después del inicio
}); 