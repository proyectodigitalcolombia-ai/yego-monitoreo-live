const axios = require('axios');

async function enviarAMonitor(datos) {
    // Render usará la URL de la variable de entorno que configuramos
    const ROBOT_URL = process.env.MONITOR_SERVICE_URL || 'https://yego-robot-worker.onrender.com/api/robot';

    try {
        console.log(`[SISTEMA] Enviando placa ${datos.placa} al Robot...`);
        
        const respuesta = await axios.post(ROBOT_URL, {
            placa: datos.placa,
            cont: datos.cont,
            config_gps: {
                url: datos.url_gps,
                usuario: datos.user_gps,
                clave: datos.pass_gps
            }
        }, { timeout: 10000 });

        console.log(`[SISTEMA] Respuesta del Robot:`, respuesta.data.mensaje);
        return true;
    } catch (error) {
        console.error(`[ERROR] No se pudo conectar con el Robot:`, error.message);
        return false;
    }
}

module.exports = { enviarAMonitor };
