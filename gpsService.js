const axios = require('axios');

async function enviarAMonitor(carga) {
    try {
        // Esta URL cambiará cuando despliegues el segundo repositorio
        const MONITOR_URL = process.env.MONITOR_SERVICE_URL || 'http://localhost:4000/api/robot';

        const payload = {
            id: carga.id,
            placa: carga.placa,
            cont: carga.cont,
            config_gps: {
                url: carga.url_plataforma,
                usuario: carga.usuario_gps,
                clave: carga.clave_gps
            }
        };

        console.log(`[LOGÍSTICA] 📡 Avisando al robot sobre placa: ${carga.placa}`);
        await axios.post(MONITOR_URL, payload);
    } catch (error) {
        console.error("[LOGÍSTICA] ❌ El robot no recibió la señal:", error.message);
    }
}

module.exports = { enviarAMonitor };
