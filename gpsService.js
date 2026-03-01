const axios = require('axios');

/**
 * Envía los datos del contenedor y el GPS al Robot Worker
 */
async function enviarAMonitor(datos) {
    // La URL debe ser la dirección de tu Robot en Render
    const ROBOT_URL = process.env.MONITOR_SERVICE_URL || 'https://yego-robot-worker.onrender.com/api/robot';

    try {
        console.log(`[SISTEMA] Solicitando monitoreo para placa: ${datos.placa}`);
        
        const payload = {
            placa: datos.placa,
            cont: datos.cont,
            config_gps: {
                url: datos.url_gps,
                usuario: datos.user_gps,
                clave: datos.pass_gps
            }
        };

        const respuesta = await axios.post(ROBOT_URL, payload, {
            timeout: 10000 // Si el robot no responde en 10 seg, da error
        });

        console.log(`[OK] El Robot confirmó la recepción: ${respuesta.data.mensaje}`);
        return true;

    } catch (error) {
        console.error(`[ERROR] No se pudo conectar con el Robot:`, error.message);
        return false;
    }
}

module.exports = { enviarAMonitor };
