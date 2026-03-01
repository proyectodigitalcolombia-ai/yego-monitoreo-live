const axios = require('axios');

async function enviarAMonitor(carga) {
    try {
        // Aquí pondrás la URL que te dé el hosting cuando subas el repositorio del ROBOT
        const MONITOR_URL = process.env.MONITOR_SERVICE_URL || 'http://localhost:4000/api/robot';

        const payload = {
            id_registro: carga.id,
            placa: carga.placa,
            contenedor: carga.cont,
            config_gps: {
                url: carga.url_plataforma,
                usuario: carga.usuario_gps,
                clave: carga.clave_gps
            }
        };

        console.log(`[LOGÍSTICA] 📡 Enviando señal al robot para placa: ${carga.placa}`);
        await axios.post(MONITOR_URL, payload);
        
    } catch (error) {
        console.error("[ERROR] El servidor del robot no respondió:", error.message);
    }
}

module.exports = { enviarAMonitor };
