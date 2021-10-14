const AWS = require("./Servicios/AWS");
const md5 = require("md5");

async function insertarUsuario(registro) {
  const params = {
    TableName: "usuario",
    Item: registro,
  };

  try {
    await AWS.docClient.put(params).promise();
    return { error: false, mensaje: "Usuario creado con éxito" };
  } catch (error) {
    console.log(error);
    return { error: true, mensaje: "No se pudo insertar el usuario" };
  }
}

async function loginUsuario(correo, pwd) {
  const params = {
    TableName: "usuario",
    FilterExpression: "#cuser = :corr and #pwduser = :pass",
    ExpressionAttributeNames: {
      "#cuser": "correo",
      "#pwduser": "pwd",
    },
    ExpressionAttributeValues: { ":corr": correo, ":pass": md5(pwd) },
  };

  let lastEvaluatedKey = "grupo1";
  const itemsAll = [];

  while (lastEvaluatedKey) {
    const data = await AWS.docClient.scan(params).promise();
    itemsAll.push(...data.Items);
    lastEvaluatedKey = data.LastEvaluatedKey;
    if (lastEvaluatedKey) {
      params.ExclusiveStartKey = lastEvaluatedKey;
    }
  }

  return itemsAll;
}

async function recuperarUsuarios() {
  const params = {
      TableName: "usuario",
      FilterExpression: "#tipo <> :tipo_val",
      ExpressionAttributeNames: {
          "#tipo": "tipo",
      },
      ExpressionAttributeValues: { 
        ":tipo_val":  0,
      },
  };

  let lastEvaluatedKey = 'SAGRUPO1'; 
  const itemsAll = [];

  while (lastEvaluatedKey) {
      const data = await AWS.docClient.scan(params).promise();
      itemsAll.push(...data.Items);
      lastEvaluatedKey = data.LastEvaluatedKey;
      if (lastEvaluatedKey) {
          params.ExclusiveStartKey = lastEvaluatedKey;
      }
  }

  return { error: false, datos: itemsAll};
}

async function recuperarEditorialesPendientes() {
  const params = {
      TableName: "usuario",
      FilterExpression: "#tipo = :tipo_val and #estado = :estado_val",
      ExpressionAttributeNames: {
          "#tipo": "tipo",
          "#estado": "estado"
      },
      ExpressionAttributeValues: { 
        ":tipo_val":  1,
        ":estado_val": "Pendiente de aprobación"
      },
  };

  let lastEvaluatedKey = 'SAGRUPO1'; 
  const itemsAll = [];

  while (lastEvaluatedKey) {
      const data = await AWS.docClient.scan(params).promise();
      itemsAll.push(...data.Items);
      lastEvaluatedKey = data.LastEvaluatedKey;
      if (lastEvaluatedKey) {
          params.ExclusiveStartKey = lastEvaluatedKey;
      }
  }

  return { error: false, datos: itemsAll};
}

async function aprobarEditorial(usuario_editorial) {

  const params = {
    TableName: "usuario",
    Key: {
      "usuario": usuario_editorial,
    },
    UpdateExpression: "set estado = :e",
    ConditionExpression: 'usuario = :userIdVal and tipo = :etipo',
    ExpressionAttributeValues: {
      ":e": "Aprobada",
      ":userIdVal": usuario_editorial,
      ":etipo": 1
    },
    ReturnValues: "UPDATED_NEW",
  };

  try {
      await AWS.docClient.update(params).promise()
      return { error: false, mensaje: "El usuario editorial se aprobó con éxito"}    
  } catch (error) {
    console.log('\n\ncatch update\n\n')
    console.log(error)
    return { error: true, mensaje: "El usuario editorial no se pudo actualizar"}      
  }
}

async function eliminarUsuario(usuario) {

  const params = {
    TableName: "usuario",
    Key: {
      "usuario": usuario,
    },
    ConditionExpression: 'usuario = :userIdVal',
    ExpressionAttributeValues: {
      ":userIdVal": usuario,
    },
  };

  try {
      await AWS.docClient.delete(params).promise()
      return { error: false, mensaje: "El usuario se eliminó con éxito"}    
  } catch (error) {
    console.log('\n\ncatch update\n\n')
    console.log(error)
    return { error: true, mensaje: "El usuario no se pudo eliminar"}      
  }
}

module.exports = { recuperarUsuarios, eliminarUsuario, insertarUsuario, loginUsuario, aprobarEditorial, recuperarEditorialesPendientes };
