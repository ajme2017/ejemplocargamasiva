const jwt = require("jsonwebtoken");

var express = require("express");
var bodyParser = require("body-parser");
var router = express.Router();

const crypto = require("crypto");
const cors = require("cors");
const aws_keys = require("./Keys/credenciales");
var corsOptions = { origin: true, optionsSuccessStatus: 200 };
const generarID = () => crypto.randomBytes(16).toString("hex");

var AWS = require("aws-sdk");

var dynamoClient = new AWS.DynamoDB(aws_keys.dynamodb);

router.use(cors(corsOptions));
router.use(bodyParser.json({ limit: "50mb", extended: true }));
router.use(bodyParser.urlencoded({ limit: "50mb", extended: true }));

router.get("/obtener_libros", function (req, res, next) {
  const params = {
    TableName: "Libros",
  };

  dynamoClient.scan(params, function (err, data) {
    if (err) {
      res.json({ status: 404, mensaje: "Error en la base de datos" });
    } else {
      console.log(data.Items);

      res.json({ status: 200, mensaje: "OK", data: data.Items });
    }
  });
});

router.get("/obtener_compras", autenticarToken, function (req, res, next) {
  const { usuarioReq } = req;

  if (!(usuarioReq && usuarioReq.tipo === 2))
    return res
      .status(403)
      .json({ mensaje: "No posee los permisos necesarios" });

  const params = {
    TableName: "Compras",
  };

  dynamoClient.scan(params, function (err, data) {
    if (err) {
      res.json({ status: 404, mensaje: "Error en la base de datos" });
    } else {
      console.log(data.Items);
      let arreglo = data.Items.filter(
        (compra) => compra.id_usuario.S == usuarioReq.usuario
      );
      res.json({ status: 200, mensaje: "OK", data: arreglo });
    }
  });
});

router.post("/generar_pedido", autenticarToken, function (req, res, next) {
  const { fecha, pedido, tipo_envio, tipo_pago } = req.body;
  const { usuarioReq } = req;

  if (!(usuarioReq && usuarioReq.tipo === 2))
    return res
      .status(403)
      .json({ mensaje: "No posee los permisos necesarios" });

  const params = {
    TableName: "Compras",
    Item: {
      id: { S: generarID() },
      id_usuario: { S: usuarioReq.usuario },
      fecha: { S: fecha },
      tipo_envio: { S: tipo_envio },
      tipo_pago: { S: tipo_pago },
      detalle: { S: JSON.stringify(pedido) },
    },
  };

  dynamoClient.putItem(params, function (err, data) {
    if (err) {
      console.log(err);
      res.json({
        status: 400,
        mensaje: "Error al crear la compra",
      });
    } else {
      res.json({
        status: 200,
        mensaje: "Compra registrada correctamente",
      });
    }
  });
});

function autenticarToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  console.log("Autenticando Token: ", authHeader);
  const token = authHeader && authHeader.split(" ")[1];
  if (token == null) return res.sendStatus(401);

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
    if (err) {
      console.log(err);
      return res
        .status(403)
        .json({ mensaje: "No posee los permisos necesarios" });
    }
    req.usuarioReq = user;
    next();
  });
}

module.exports = router;
