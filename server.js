const express = require('express');
const mysql = require('mysql2');
const bcrypt = require('bcrypt');
const cors = require('cors');
const session = require('express-session');
const multer = require('multer');
const path = require('path');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use(cors({
    origin: 'http://127.0.0.1:5500',
    methods: ['POST', 'GET', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type']
}));

app.use(session({
    secret: 'clave_secreta',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
}));

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '2505',
    database: 'entrenamiento'
});

db.connect(err => {
    if (err) {
        console.error('❌ Error conectando a la base de datos:', err);
        process.exit(1);
    } else {
        console.log('✅ Conectado a la base de datos');
    }
});

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage });

// 📌 REGISTRO DE USUARIO
app.post('/register', async (req, res) => {
  const { nombre, email, password, id_profesor } = req.body;

  if (!nombre || !password || !id_profesor) {
    return res.status(400).json({ error: 'Faltan campos obligatorios' });
  }

  try {
    // Verificar cupo del profesor
    const sqlCupo = 'SELECT cupo_maximo, alumnos_actuales FROM profesores WHERE id = ?';
    db.query(sqlCupo, [id_profesor], async (err, results) => {
      if (err) {
        console.error("❌ Error al verificar cupo:", err);
        return res.status(500).json({ error: "Error al verificar cupo" });
      }

      if (results.length === 0) {
        return res.status(404).json({ error: "Profesor no encontrado" });
      }

      const { cupo_maximo, alumnos_actuales } = results[0];

      if (alumnos_actuales >= cupo_maximo) {
        return res.status(403).json({ error: "El profesor alcanzó el límite de alumnos" });
      }

      // Continuar con el registro
      const hashedPassword = await bcrypt.hash(password, 10);
      const sqlInsert = 'INSERT INTO alumnos (nombre, email, password, id_profesor) VALUES (?, ?, ?, ?)';

      db.query(sqlInsert, [nombre, email || null, hashedPassword, id_profesor], (err, result) => {
        if (err) {
          if (err.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ error: 'El alumno ya existe' });
          }
          console.error('❌ Error en el registro del alumno:', err);
          return res.status(500).json({ error: 'Error al registrar alumno' });
        }

        // Actualizar el contador de alumnos
        const sqlUpdate = 'UPDATE profesores SET alumnos_actuales = alumnos_actuales + 1 WHERE id = ?';
        db.query(sqlUpdate, [id_profesor]);

        res.status(201).json({ message: 'Alumno registrado con éxito' });
      });
    });
  } catch (error) {
    console.error('❌ Error en bcrypt:', error);
    res.status(500).json({ error: 'Error al procesar la contraseña' });
  }
});


// 📌 INICIO DE SESIÓN
app.post('/login', (req, res) => {
  const { nombre, password } = req.body;

  if (!nombre || !password) {
      return res.status(400).json({ error: 'Todos los campos son obligatorios' });
  }

  // Consulta en la tabla alumnos (ya que los usuarios se guardan allí)
  const sql = 'SELECT * FROM alumnos WHERE nombre = ?';
  db.query(sql, [nombre], async (err, results) => {
      if (err) {
          console.error('❌ Error en el servidor:', err);
          return res.status(500).json({ error: 'Error en el servidor' });
      }
      if (results.length === 0) {
          return res.status(401).json({ error: 'Usuario no encontrado' });
      }

      const user = results[0];
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
          return res.status(401).json({ error: 'Contraseña incorrecta' });
      }

      req.session.user = { id: user.id, nombre: user.nombre };
      res.json({
          message: 'Inicio de sesión exitoso',
          user: { id: user.id, nombre: user.nombre, foto: user.foto },
          redirect: '/index.html'
      });
  });
});

// 📌 SUBIR FOTO DE PERFIL
app.post('/subir-foto/:id', upload.single('foto'), (req, res) => {
  const { id } = req.params;
  if (!req.file) return res.status(400).json({ error: 'No se recibió archivo' });

  const rutaFoto = `/uploads/${req.file.filename}`;

  // Actualizamos la tabla 'alumnos' ya que allí se guardan los usuarios.
  const sql = 'UPDATE alumnos SET foto = ? WHERE id = ?';
  db.query(sql, [rutaFoto, id], (err, result) => {
      if (err) {
          console.error('❌ Error al guardar la foto de perfil:', err);
          return res.status(500).json({ error: 'Error al guardar la foto' });
      }

      res.json({ message: 'Foto de perfil actualizada', ruta: rutaFoto });
  });
});


// 📌 BUSCAR USUARIO POR NOMBRE
app.get('/buscar-usuario', (req, res) => {
  const { nombre, id_profesor } = req.query;

  if (!nombre || !id_profesor) {
    return res.status(400).json({ error: 'Faltan datos para la búsqueda' });
  }

  const sql = `
    SELECT id, nombre, foto 
    FROM alumnos 
    WHERE nombre LIKE ? AND id_profesor = ?
  `;

  db.query(sql, [`%${nombre}%`, id_profesor], (err, results) => {
    if (err) {
      console.error('❌ Error en la búsqueda:', err);
      return res.status(500).json({ error: 'Error en la búsqueda de alumnos' });
    }
    res.json(results);
  });
});

// 📌 PLANIFICACIÓN - Obtener por ID, MES, SEMANA y AÑO
app.get('/planificacion', (req, res) => {
  const { id_alumno, anio, mes, semana, dia } = req.query;

  if (!id_alumno || !anio || !mes || !semana || !dia) {
    return res.status(400).json({ error: 'Faltan parámetros' });
  }

  const sql = `
    SELECT ejercicio, series, repes, kg, nota, video, tipo
    FROM planificaciones
    WHERE id_alumno = ? AND anio = ? AND mes = ? AND semana = ? AND dia = ?
    ORDER BY 
      CASE tipo 
        WHEN 'basico' THEN 0
        ELSE 1
      END, id ASC
  `;

  db.query(sql, [id_alumno, anio, mes, semana, dia], (err, results) => {
    if (err) {
      console.error('❌ Error al obtener planificación:', err);
      return res.status(500).json({ error: 'Error al buscar planificación' });
    }
    res.json(results);
  });
});




// 📌 GUARDAR PLANIFICACIÓN - con AÑO
app.post('/guardar-planificacion', (req, res) => {
  const {
    id_alumno,
    anio,
    mes,
    semana,
    dia,
    ejercicio,
    series,
    repes,
    kg,
    nota,
    video,
    tipo // 👈 se agrega tipo
  } = req.body;

  if (!id_alumno || !anio || !mes || !semana || !dia || !ejercicio) {
    return res.status(400).json({ error: 'Faltan datos obligatorios' });
  }

  const sql = `
    INSERT INTO planificaciones (
      id_alumno, anio, mes, semana, dia,
      ejercicio, series, repes, kg, nota, video, tipo
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  db.query(
    sql,
    [id_alumno, anio, mes, semana, dia, ejercicio, series, repes, kg, nota, video, tipo],
    (err, result) => {
      if (err) {
        console.error('❌ Error al guardar planificación:', err);
        return res.status(500).json({ error: 'Error al guardar planificación' });
      }

      res.status(201).json({ message: 'Planificación guardada exitosamente' });
    }
  );
});




// 📌 Obtener usuario por ID (para historial.html)
app.get('/usuario/:id', (req, res) => {
    const { id } = req.params;

    const sql = 'SELECT id, nombre, foto FROM usuarios WHERE id = ?';
    db.query(sql, [id], (err, results) => {
        if (err) {
            console.error('❌ Error al obtener usuario por ID:', err);
            return res.status(500).json({ error: 'Error interno del servidor' });
        }

        if (results.length === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        res.json(results[0]); // Devuelve el usuario
    });
});


//nuevo

app.get('/usuario/:id', (req, res) => {
    const { id } = req.params;
    const sql = 'SELECT nombre, foto FROM usuarios WHERE id = ?';
    db.query(sql, [id], (err, results) => {
      if (err) {
        console.error('Error al obtener el usuario:', err);
        return res.status(500).json({ error: 'Error al obtener usuario' });
      }
  
      if (results.length === 0) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }
  
      res.json(results[0]);
    });
  });



  app.get('/planificacion', (req, res) => {
    const { id_nombre, anio, mes, semana, dia } = req.query;
  
    if (!id_nombre || !anio || !mes || !semana || !dia) {
      return res.status(400).json({ error: 'Faltan parámetros' });
    }
  
    const sql = `
      SELECT ejercicio, series, repes, kg, nota, video, tipo
      FROM planificaciones
      WHERE id_nombre = ? AND anio = ? AND mes = ? AND semana = ? AND dia = ?
    `;
  
    db.query(sql, [id_nombre, anio, mes, semana, dia], (err, results) => {
      if (err) {
        console.error('❌ Error al obtener planificación:', err);
        return res.status(500).json({ error: 'Error al buscar planificación' });
      }
  
      res.json(results);
    });
  });
  
  

// 📌 ELIMINAR PLANIFICACIÓN POR USUARIO, MES Y SEMANA
app.delete('/eliminar-planificacion', (req, res) => {
  const { id_alumno, anio, mes, semana, dia } = req.query;

  if (!id_alumno || !anio || !mes || !semana || !dia) {
    return res.status(400).json({ error: 'Faltan parámetros para eliminar planificación' });
  }

  const sql = `
    DELETE FROM planificaciones
    WHERE id_alumno = ? AND anio = ? AND mes = ? AND semana = ? AND dia = ?
  `;

  db.query(sql, [id_alumno, anio, mes, semana, dia], (err, result) => {
    if (err) {
      console.error('❌ Error al eliminar planificación:', err);
      return res.status(500).json({ error: 'Error interno al eliminar planificación' });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'No se encontró planificación para eliminar' });
    }

    res.json({ message: 'Planificación eliminada correctamente' });
  });
});


app.delete('/eliminar-usuario/:id', (req, res) => {
  const { id } = req.params;

  // Primero, eliminamos las planificaciones relacionadas con el alumno
  const deletePlanificacionesQuery = 'DELETE FROM planificaciones WHERE id_alumno = ?';
  db.query(deletePlanificacionesQuery, [id], (err, result) => {
    if (err) {
      console.error("Error al eliminar planificaciones:", err);
      return res.status(500).json({ error: 'Error al eliminar las planificaciones del alumno' });
    }

    // Ahora eliminamos el alumno
    const deleteAlumnoQuery = 'DELETE FROM alumnos WHERE id = ?';
    db.query(deleteAlumnoQuery, [id], (err, result) => {
      if (err) {
        console.error("Error al eliminar alumno:", err);
        return res.status(500).json({ error: 'Error al eliminar alumno' });
      }

      res.status(200).json({ message: 'Alumno y sus planificaciones eliminados correctamente' });
    });
  });
});

  // 📌 EDITAR USUARIO
  app.put('/editar-usuario/:id', (req, res) => {
    const { id } = req.params;
    const { nuevoNombre } = req.body;
  
    if (!nuevoNombre) {
        return res.status(400).json({ error: 'El nuevo nombre es obligatorio' });
    }
  
    const sql = 'UPDATE alumnos SET nombre = ? WHERE id = ?';
    db.query(sql, [nuevoNombre, id], (err, result) => {
        if (err) {
            console.error('❌ Error editando alumno:', err);
            return res.status(500).json({ error: 'Error al editar alumno' });
        }
  
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Alumno no encontrado' });
        }
  
        res.json({ message: 'Alumno actualizado con éxito' });
    });
});





//Profesore 
const crearTablaProfesores = `
    CREATE TABLE IF NOT EXISTS profesores (
        id INT AUTO_INCREMENT PRIMARY KEY,
        usuario VARCHAR(100) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        dni VARCHAR(20) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
`;

db.query(crearTablaProfesores, (err) => {
    if (err) {
      console.error('❌ Error al crear tabla profesores:', err);
    } else {
      console.log('✅ Tabla profesores lista');
    }
  });
  
  // Ruta para crear profesor (por super admin)
  app.post('/crear-profesor', async (req, res) => {
    const { nombre, dni, password } = req.body;
  
    if (!nombre || !dni || !password) {
      return res.status(400).json({ error: 'Todos los campos son obligatorios' });
    }
  
    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      const sql = 'INSERT INTO profesores (nombre, dni, password) VALUES (?, ?, ?)';
  
      db.query(sql, [nombre, dni, hashedPassword], (err, result) => {
        if (err) {
          if (err.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ error: 'El DNI ya está registrado' });
          }
          console.error('❌ Error al crear profesor:', err);
          return res.status(500).json({ error: 'Error interno' });
        }
        res.status(201).json({ message: 'Profesor creado exitosamente' });
      });
    } catch (err) {
      console.error('❌ Error en bcrypt:', err);
      res.status(500).json({ error: 'Error al procesar la contraseña' });
    }
  });
  
  // Ruta para login del profesor
  app.post('/login-profesor', (req, res) => {
    const { dni, password } = req.body;
  
    if (!dni || !password) {
      return res.status(400).json({ error: 'Todos los campos son obligatorios' });
    }
  
    const sql = 'SELECT * FROM profesores WHERE dni = ?';
    db.query(sql, [dni], async (err, results) => {
      if (err) {
        console.error('❌ Error en el login:', err);
        return res.status(500).json({ error: 'Error interno' });
      }
  
      if (results.length === 0) {
        return res.status(401).json({ error: 'Profesor no encontrado' });
      }
  
      const profesor = results[0];
  
      // ❌ Si el profesor está bloqueado
      if (profesor.bloqueado === 1) {
        return res.status(403).json({ error: 'Este profesor está bloqueado. Contacta con el administrador.' });
      }
  
      const isMatch = await bcrypt.compare(password, profesor.password);
  
      if (!isMatch) {
        return res.status(401).json({ error: 'Contraseña incorrecta' });
      }
  
      res.json({
        message: 'Inicio de sesión exitoso',
        profesor: { id: profesor.id, nombre: profesor.nombre },
        redirect: '/profesor/index.html'
      });
    });
  });
  
  





//datos Alumno

// Guardar datos del alumno
app.post('/guardar-datos-alumno', (req, res) => {
  const {
    id_alumno,
    coach,
    objetivo,
    sexo,
    rms,
    modalidad,
    profesion,
    lesiones
  } = req.body;

  if (!id_alumno || !coach || !objetivo || !sexo) {
    return res.status(400).json({ error: "Faltan datos obligatorios" });
  }

  const sql = `
    INSERT INTO datos_alumnos (id_alumno, coach, objetivo, sexo, rms, modalidad, profesion, lesiones)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `;

  db.query(sql, [id_alumno, coach, objetivo, sexo, rms, modalidad, profesion, lesiones], (err, result) => {
    if (err) {
      console.error("❌ Error al guardar datos del alumno:", err);
      return res.status(500).json({ error: "Error al guardar datos" });
    }

    res.status(201).json({ message: "Datos guardados correctamente" });
  });
});

// Obtener todos los alumnos de un profesor
app.get('/alumnos-profesor/:id_profesor', (req, res) => {
  const { id_profesor } = req.params;

  const sql = `
    SELECT id, nombre, fecha_inicio, fecha_vencimiento
    FROM alumnos
    WHERE id_profesor = ?
  `;

  db.query(sql, [id_profesor], (err, results) => {
    if (err) {
      console.error("❌ Error al obtener alumnos:", err);
      return res.status(500).json({ error: 'Error al obtener alumnos' });
    }

    res.json(results);
  });
});
// Obtener datos del alumno por ID



app.get('/datos-alumno/:id_alumno', (req, res) => {
  const { id_alumno } = req.params;
  const sql = 'SELECT * FROM datos_alumno WHERE id_alumno = ?';

  db.query(sql, [id_alumno], (err, results) => {
    if (err) {
      console.error('Error al obtener datos del alumno:', err);
      return res.status(500).json({ error: 'Error al obtener datos del alumno', detalles: err.message });
    }
    if (results.length === 0) {
      return res.status(404).json({ error: 'No se encontraron datos para este alumno' });
    }
    res.json(results[0]);
  });
});



//datos diarios


app.post('/guardar-datos-diarios', (req, res) => {
  const {
    id_alumno, anio, mes, semana, dia,
    fatiga, alimentacion, estres, sensacion,
    descanso, hidratacion, hipe
  } = req.body;

  if (!id_alumno || !anio || !mes || !semana || !dia) {
    return res.status(400).json({ error: "Faltan campos obligatorios" });
  }

  const sql = `
    INSERT INTO datos_diarios (
      id_alumno, anio, mes, semana, dia,
      fatiga, alimentacion, estres, sensacion,
      descanso, hidratacion, hipe
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  db.query(
    sql,
    [id_alumno, anio, mes, semana, dia, fatiga, alimentacion, estres, sensacion, descanso, hidratacion, hipe],
    (err, result) => {
      if (err) {
        console.error("❌ Error al guardar datos diarios:", err);
        return res.status(500).json({ error: "Error al guardar los datos" });
      }
      res.status(201).json({ message: "Datos guardados correctamente" });
    }
  );
});




app.get('/datos-diarios/:id_alumno', (req, res) => {
  const { id_alumno } = req.params;
  const { anio, mes, semana, dia } = req.query;

  const sql = `
    SELECT * FROM datos_diarios
    WHERE id_alumno = ? AND anio = ? AND mes = ? AND semana = ? AND dia = ?
  `;

  db.query(sql, [id_alumno, anio, mes, semana, dia], (err, results) => {
    if (err) {
      console.error("❌ Error al obtener datos diarios:", err);
      return res.status(500).json({ error: "Error al buscar datos diarios" });
    }

    if (results.length === 0) {
      return res.status(404).json({ error: "No se encontraron datos diarios para esa fecha" });
    }

    res.json(results[0]);
  });
});






//cupos alumnos


// Obtener todos los profesores
app.get('/profesores', (req, res) => {
  const sql = "SELECT * FROM profesores";
  db.query(sql, (err, results) => {
    if (err) {
      console.error("Error al obtener los profesores:", err);
      return res.status(500).json({ error: "Error al obtener los profesores" });
    }
    
    console.log(results);  // Verifica que los datos sean un array

    // Verifica si los resultados son un array
    if (Array.isArray(results)) {
      res.json(results);  // Devuelve los resultados como un array
    } else {
      res.status(500).json({ error: "La respuesta no es un array" });
    }
  });
});

// Actualizar cupo máximo
app.post('/actualizar-cupo', (req, res) => {
  const { id_profesor, cupo } = req.body;

  if (!id_profesor || isNaN(cupo)) {
    return res.status(400).json({ error: 'Datos inválidos' });
  }

  const sql = 'UPDATE profesores SET cupo_maximo = ? WHERE id = ?';
  db.query(sql, [cupo, id_profesor], (err) => {
    if (err) {
      console.error("❌ Error al actualizar cupo:", err);
      return res.status(500).json({ error: 'Error al actualizar cupo' });
    }

    res.json({ message: 'Cupo actualizado correctamente' });
  });
});

// Bloquear o desbloquear profesor
app.post('/bloquear-profesor', (req, res) => {
  const { id_profesor, bloquear } = req.body;

  // Validar que los parámetros son correctos
  if (typeof id_profesor !== 'number' || typeof bloquear !== 'boolean') {
    return res.status(400).json({ error: 'Parámetros inválidos' });
  }

  // SQL para actualizar el estado de bloqueo del profesor
  const sql = 'UPDATE profesores SET bloqueado = ? WHERE id = ?';

  db.query(sql, [bloquear, id_profesor], (err, result) => {
    if (err) {
      console.error('❌ Error al bloquear/desbloquear profesor:', err);
      return res.status(500).json({ error: 'Error al bloquear/desbloquear profesor' });
    }

    if (result.affectedRows > 0) {
      res.json({ message: `Profesor ${bloquear ? 'bloqueado' : 'desbloqueado'} con éxito` });
    } else {
      res.status(404).json({ error: 'Profesor no encontrado' });
    }
  });
});




//lista de alumnos


app.post('/guardar-fechas-alumno', (req, res) => {
  const { id_alumno, fecha_inicio, fecha_vencimiento } = req.body;

  if (!id_alumno || !fecha_inicio || !fecha_vencimiento) {
    return res.status(400).json({ error: 'Faltan datos' });
  }

  const sql = `
    UPDATE alumnos 
    SET fecha_inicio = ?, fecha_vencimiento = ?
    WHERE id = ?
  `;

  db.query(sql, [fecha_inicio, fecha_vencimiento, id_alumno], (err, result) => {
    if (err) {
      console.error("❌ Error al guardar fechas:", err);
      return res.status(500).json({ error: 'Error interno al guardar fechas' });
    }

    res.json({ message: 'Fechas actualizadas correctamente' });
  });
});



app.post('/guardar-fechas-alumno', (req, res) => {
  const { id_alumno, fecha_inicio, fecha_vencimiento } = req.body;

  if (!id_alumno || !fecha_inicio || !fecha_vencimiento) {
    return res.status(400).json({ error: 'Faltan datos obligatorios' });
  }

  const sql = `
    UPDATE alumnos
    SET fecha_inicio = ?, fecha_vencimiento = ?
    WHERE id = ?
  `;

  db.query(sql, [fecha_inicio, fecha_vencimiento, id_alumno], (err) => {
    if (err) {
      console.error("❌ Error al guardar fechas:", err);
      return res.status(500).json({ error: 'Error al guardar fechas del alumno' });
    }

    res.json({ message: 'Fechas actualizadas correctamente' });
  });
});



//eliminar profesor


app.delete('/eliminar-profesor/:id', (req, res) => {
  const { id } = req.params;

  const sql = 'DELETE FROM profesores WHERE id = ?';
  db.query(sql, [id], (err, result) => {
    if (err) {
      console.error('Error al eliminar el profesor:', err);
      return res.status(500).json({ error: 'Error al eliminar el profesor' });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Profesor no encontrado' });
    }

    res.json({ message: 'Profesor eliminado con éxito' });
  });
});


app.get('/alumno/:id', (req, res) => {
  const alumnoId = req.params.id;
  const sql = "SELECT nombre, fecha_vencimiento FROM alumnos WHERE id = ?";

  db.query(sql, [alumnoId], (err, results) => {
    if (err) {
      console.error("Error al obtener datos del alumno:", err);
      return res.status(500).json({ error: "Error al obtener los datos del alumno" });
    }
    res.json(results[0]); // Enviar el alumno con la fecha de vencimiento
  });
});




app.get('/obtener-estado-pago', (req, res) => {
  const { id_alumno } = req.query;

  if (!id_alumno) {
    return res.status(400).json({ error: "Faltan parámetros" });
  }

  const sql = `SELECT fecha_vencimiento FROM alumnos WHERE id = ?`;
  db.query(sql, [id_alumno], (err, results) => {
    if (err) {
      console.error('❌ Error al obtener fecha de vencimiento:', err);
      return res.status(500).json({ error: 'Error al buscar fecha de vencimiento' });
    }

    if (results.length > 0) {
      return res.json({ fecha_vencimiento: results[0].fecha_vencimiento });
    } else {
      return res.status(404).json({ error: "Alumno no encontrado" });
    }
  });
});



//notifiacion 

app.get('/estado-vencimiento/:id_alumno', (req, res) => {
  const id = req.params.id_alumno;

  const sql = 'SELECT fecha_vencimiento FROM alumnos WHERE id = ?';
  db.query(sql, [id], (err, result) => {
    if (err) return res.status(500).json({ error: 'Error en la base de datos' });

    if (result.length === 0) return res.status(404).json({ error: 'Alumno no encontrado' });

    const hoy = new Date();
    const vencimiento = new Date(result[0].fecha_vencimiento);

    const vencido = hoy > vencimiento;
    res.json({ vencido });
  });
});




app.get('/listar-alumnos', (req, res) => {
  const sql = 'SELECT id, nombre, fecha_vencimiento FROM alumnos';
  db.query(sql, (err, results) => {
    if (err) {
      console.error('Error al listar alumnos:', err);
      return res.status(500).json({ error: 'Error de base de datos' });
    }
    res.json(results);
  });
});





// 📌 Iniciar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en el puerto ${PORT}`);
});
