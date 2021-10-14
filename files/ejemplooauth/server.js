require("dotenv").config();
const AWS = require("./Servicios/AWS");
const md5 = require("md5");
const cors = require("cors");
const express = require("express");
const app = express();
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const validaciones = require("./validaciones");
const funciones = require("./funciones");

app.use(express.json());

// Configuración de CORS
app.use(cors());

app.put("/registro", async (req, res) => {
  let registro = req.body;

  console.log(registro);

  if (registro.tipo === 1) {
    // Es una editorial
    if (!validaciones.validarDatosEditorial(registro)) {
      console.log("[ERROR] Campos insuficientes para editorial");
      return res
        .status(400)
        .json({ mensaje: "Campos insuficientes para editorial" });
    }
    registro = { ...registro, estado: "Pendiente de aprobación" };
  } else if (registro.tipo === 2) {
    // Es un cliente
    if (!validaciones.validarDatosCliente(registro)) {
      console.log("[ERROR] Campos insuficientes para cliente");
      return res
        .status(400)
        .json({ mensaje: "Campos insuficientes para cliente" });
    }
  } else {
    // Error
    return res.status(400).json({ mensaje: "Tipo de usuario incorrecto" });
  }

  const correoUnico = await validaciones.validarCorreoUsuario(registro.correo);

  if (!correoUnico)
    return res.status(400).json({ mensaje: "El usuario ya existe" });

  registro = {
    ...registro,
    usuario: crypto.randomBytes(24).toString("hex"),
    pwd: md5(registro.pwd),
  };

  const resultado = await funciones.insertarUsuario(registro);

  if (resultado.error)
    return res
      .status(400)
      .json({ mensaje: "Ocurrió un error al insertar el usuario" });

  const user = { usuario: registro.usuario, tipo: registro.tipo };
  const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET);

  console.log("\n[REGISTRO] ", registro.nombre, "\n");
  delete registro.pwd;
  res.status(201).json({
    mensaje: resultado.mensaje,
    accessToken: accessToken,
    usuario: registro,
  });
});

app.post("/login", async (req, res) => {
  console.log("\n[LOGIN]");
  //Autenticar al usuario
  const correo = req.body.correo;
  const pwd = req.body.pwd;

  //Validar login
  const resultado = await funciones.loginUsuario(correo, pwd);
  console.log(resultado);

  if (resultado.length === 0)
    return res.status(404).json({ mensaje: "Credenciales inválidas" });

  const usuarioLogin = resultado[0];
  delete usuarioLogin.pwd;

  const user = { usuario: usuarioLogin.usuario, tipo: usuarioLogin.tipo };
  const acces_token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET);
  res.status(200).json({ accessToken: acces_token, usuario: usuarioLogin });
});

app.post("/administrador/aprobar", autenticarToken, async (req, res) => {
  const usuarioAdmin = req.usuarioReq;

  if (!(usuarioAdmin && usuarioAdmin.tipo === 0))
    return res
      .status(403)
      .json({ mensaje: "No posee los permisos necesarios" });

  const usuarioEditorial = req.body.editorial;
  const resultado = await funciones.aprobarEditorial(usuarioEditorial);

  if (resultado.error)
    return res.status(400).json({ mensaje: resultado.mensaje });

  res.status(200).json({ mensaje: resultado.mensaje });
});

app.delete('/administrador/eliminar', autenticarToken, async (req , res)=>{
  const usuarioAdmin = req.usuarioReq;

  if (!(usuarioAdmin && usuarioAdmin.tipo === 0))
    return res
      .status(403)
      .json({ mensaje: "No posee los permisos necesarios" });

  const usuario = req.body.usuario;
  const resultado = await funciones.eliminarUsuario(usuario);

  if (resultado.error)
    return res.status(400).json({ mensaje: resultado.mensaje });

  res.status(200).json({ mensaje: resultado.mensaje });
})

app.get(
  "/administrador/editoriales-pendientes",
  autenticarToken,
  async (req, res) => {
    console.log("\n[EDITORIALES-PENDIENTES]")
    const usuarioAdmin = req.usuarioReq;

    console.log(usuarioAdmin)

    if (!(usuarioAdmin && usuarioAdmin.tipo === 0))
      return res
        .status(403)
        .json({ mensaje: "No posee los permisos necesarios" });

    const resultado = await funciones.recuperarEditorialesPendientes();

    if (resultado.error)
      return res.status(400).json({ mensaje: resultado.mensaje });

    res.status(200).json({ datos: resultado.datos });
  }
);

app.get(
  "/administrador/usuarios",
  autenticarToken,
  async (req, res) => {
    const usuarioAdmin = req.usuarioReq;

    if (!(usuarioAdmin && usuarioAdmin.tipo === 0))
      return res
        .status(403)
        .json({ mensaje: "No posee los permisos necesarios" });

    const resultado = await funciones.recuperarUsuarios();

    if (resultado.error)
      return res.status(400).json({ mensaje: resultado.mensaje });

    res.status(200).json({ datos: resultado.datos });
  }
);

function autenticarToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  console.log('Autenticando Token: ', authHeader)
  const token = authHeader && authHeader.split(" ")[1];
  if (token == null) return res.sendStatus(401);

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
    if (err)
      return res
        .status(403)
        .json({ mensaje: "No posee los permisos necesarios" });
    req.usuarioReq = user;
    next();
  });
}

app.listen(3001);
