const express = require("express");
const bodyParser = require("body-parser");
const fs = require("fs").promises;
const path = require("path");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const archivoTareas = path.join(__dirname, "tareas.json");
const archivoUsuarios = path.join(__dirname, "usuarios.json");

const app = express();
const PORT = 3000;
const SECRET_KEY = "clavedelaactividad"; // Clave

// Middleware JSON
app.use(bodyParser.json());

// CORS
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  next();
});

// ------------------------
// FUNCIONES AUXILIARES =)
// -------------------------

// Leer/guardar tareas
const leerTareas = async () => {
  try {
    const data = await fs.readFile(archivoTareas, "utf-8");
    return JSON.parse(data);
  } catch {
    return [];
  }
};

const guardarTareas = async (tareas) => {
  await fs.writeFile(archivoTareas, JSON.stringify(tareas, null, 2));
};

// Leer/guardar usuarios
const leerUsuarios = async () => {
  try {
    const data = await fs.readFile(archivoUsuarios, "utf-8");
    return JSON.parse(data);
  } catch {
    return [];
  }
};

const guardarUsuarios = async (usuarios) => {
  await fs.writeFile(archivoUsuarios, JSON.stringify(usuarios, null, 2));
};

// Middleware para verificar token JWT
const authMiddleware = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  if (!authHeader) return res.status(401).json({ error: "No autorizado" });

  const token = authHeader.split(" ")[1];
  if (!token) return res.status(401).json({ error: "No autorizado" });

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    req.usuario = decoded;
    next();
  } catch {
    res.status(401).json({ error: "Token inválido" });
  }
};

// -------------------------
// RUTAS DE USUARIOS =)
// ---------------------

// Registro
app.post("/register", async (req, res) => {
  const { usuario, contraseña } = req.body;
  if (!usuario || !contraseña) return res.status(400).json({ error: "Faltan datos" });

  const usuarios = await leerUsuarios();
  if (usuarios.find(u => u.usuario === usuario))
    return res.status(400).json({ error: "Usuario ya existe" });

  const hash = await bcrypt.hash(contraseña, 10);
  const nuevoUsuario = { id: Date.now(), usuario, contraseña: hash };
  usuarios.push(nuevoUsuario);
  await guardarUsuarios(usuarios);

  res.status(201).json({ mensaje: "Usuario registrado" });
});

// Login
app.post("/login", async (req, res) => {
  const { usuario, contraseña } = req.body;
  if (!usuario || !contraseña) return res.status(400).json({ error: "Faltan datos" });

  const usuarios = await leerUsuarios();
  const user = usuarios.find(u => u.usuario === usuario);
  if (!user) return res.status(400).json({ error: "Usuario no encontrado" });

  const passOk = await bcrypt.compare(contraseña, user.contraseña);
  if (!passOk) return res.status(400).json({ error: "Contraseña incorrecta" });

  const token = jwt.sign({ id: user.id, usuario: user.usuario }, SECRET_KEY, { expiresIn: "1h" });
  res.json({ token });
});

// ----------------------------
// RUTAS DE TAREAS (PROTEGIDAS) =)
// --------------------

// Obtener todas las tareas
app.get("/tareas", authMiddleware, async (req, res) => {
  const tareas = await leerTareas();
  res.json(tareas);
});

// Agregar tarea
app.post("/tareas", authMiddleware, async (req, res) => {
  const { titulo, descripcion } = req.body;
  if (!titulo || !descripcion) return res.status(400).json({ error: "Faltan datos" });

  const tareas = await leerTareas();
  const nuevaTarea = { id: Date.now(), titulo, descripcion };
  tareas.push(nuevaTarea);
  await guardarTareas(tareas);
  res.status(201).json(nuevaTarea);
});

// Editar tarea
app.put("/tareas/:id", authMiddleware, async (req, res) => {
  const id = parseInt(req.params.id);
  const { titulo, descripcion } = req.body;
  if (!titulo || !descripcion) return res.status(400).json({ error: "Faltan datos" });

  const tareas = await leerTareas();
  const index = tareas.findIndex(t => t.id === id);
  if (index === -1) return res.status(404).json({ error: "Tarea no encontrada" });

  tareas[index].titulo = titulo;
  tareas[index].descripcion = descripcion;
  await guardarTareas(tareas);
  res.json(tareas[index]);
});

// Eliminar tarea
app.delete("/tareas/:id", authMiddleware, async (req, res) => {
  const id = parseInt(req.params.id);
  let tareas = await leerTareas();
  tareas = tareas.filter(t => t.id !== id);
  await guardarTareas(tareas);
  res.json({ mensaje: "Tarea eliminada" });
});

// ------------------------
// MIDDLEWARE DE ERRORES =)
// --------------------
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Error del servidor" });
});

// Servidor
app.listen(PORT, () => console.log(`Servidor corriendo en http://localhost:${PORT}`));

