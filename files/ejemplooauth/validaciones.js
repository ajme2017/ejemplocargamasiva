const AWS = require("./Servicios/AWS");

function validarDatosEditorial(editorial) {
    return (
        editorial.nombre && editorial.correo && editorial.pwd && editorial.direccion
    );
}

function validarDatosCliente(cliente) {
    return (
        cliente.nombre &&
        cliente.apellido &&
        cliente.correo &&
        cliente.pwd &&
        cliente.telefono
    );
}

async function validarCorreoUsuario(correo) {
    const params = {
        TableName: "usuario",
        FilterExpression: "#cuser = :data",
        ExpressionAttributeNames: {
            "#cuser": "correo",
        },
        ExpressionAttributeValues: { ":data": correo },
    };

    let lastEvaluatedKey = 'dummy'; 
    const itemsAll = [];

    while (lastEvaluatedKey) {
        const data = await AWS.docClient.scan(params).promise();
        itemsAll.push(...data.Items);
        lastEvaluatedKey = data.LastEvaluatedKey;
        if (lastEvaluatedKey) {
            params.ExclusiveStartKey = lastEvaluatedKey;
        }
    }

    return itemsAll.length === 0;
}

module.exports = {
    validarDatosEditorial,
    validarDatosCliente,
    validarCorreoUsuario,
};
