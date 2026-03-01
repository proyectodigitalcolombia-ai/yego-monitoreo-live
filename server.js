const express = require('express'), { Sequelize, DataTypes } = require('sequelize'), app = express();
const { enviarAMonitor } = require('./gpsService'); // <--- IMPORTANTE

app.use(express.urlencoded({ extended: true })); 
app.use(express.json());

const db = new Sequelize(process.env.DATABASE_URL, { 
    dialect: 'postgres', logging: false, 
    dialectOptions: { ssl: { require: true, rejectUnauthorized: false } } 
});

// Modelo de Carga (Simplificado para el ejemplo, usa el tuyo completo)
const C = db.define('Carga', {
    placa: DataTypes.STRING,
    cont: DataTypes.STRING,
    est_real: DataTypes.STRING,
    url_plataforma: DataTypes.STRING,
    usuario_gps: DataTypes.STRING,
    clave_gps: DataTypes.STRING,
    f_act: DataTypes.STRING
});

const getNow = () => new Date().toLocaleString('es-CO', { timeZone: 'America/Bogota' });

// RUTA DEL BOTÓN OK
app.post('/u/:id', async (req, res) => { 
    const placaU = req.body.placa.toUpperCase();
    await C.update({ placa: placaU, est_real: 'DESPACHADO', f_act: getNow() }, { where: { id: req.params.id } }); 

    const carga = await C.findByPk(req.params.id);
    if(carga && carga.placa) {
        enviarAMonitor(carga); // <--- AQUÍ SE ACTIVA EL ROBOT
    }
    res.redirect('/'); 
});

db.sync().then(() => app.listen(process.env.PORT || 3000));
