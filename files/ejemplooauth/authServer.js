require('dotenv').config()
const express = require("express");
const app = express();
const jwt = require("jsonwebtoken");

app.use(express.json());

let refreshTokens = []

app.post('/token' , (req , res)=>{

   const refreshToken = req.body.token

})

app.post("/login", (req, res) => {
    //Autenticar al usuario
    const username = req.body.usuario;
    const pwd = req.body.pwd;
  
    //Validar login
  
    const user = { name: username }
    const accesToken = generateAcessToken(user)
    const refreshToken = jwt.sign(user, process.env.REFRESH_TOKEN_SECRET)
    res.json({ accesToken: accesToken, refreshToken: refreshToken })
  });

function generateAcessToken(user){
    return jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '15m' })
}

app.listen(4000);
