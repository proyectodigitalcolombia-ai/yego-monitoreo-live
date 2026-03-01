const express = require('express');
const puppeteer = require('puppeteer');
const app = express();

app.use(express.json());

// Guardamos los procesos de los navegadores para poder cerrarlos después
let rastreosActivos = {};

app.post('/api/recibir-despacho', async (req, res) => {
    const { placa, url_gps, user_gps, pass_gps } = req.body;
    console.log(`🚀 Recibido despacho para placa: ${placa}`);
    
    // Ejecutamos en segundo plano para no bloquear la respuesta
    iniciarRastreoRobot(placa, url_gps, user_gps, pass_gps).catch(console.error);
    
    res.status(200).json({ mensaje: "Robot activado para " + placa });
});

async function iniciarRastreoRobot(placa, url, user, pass) {
    console.log(`🤖 Robot intentando entrar a: ${url}`);
    
    let browser;
    try {
        browser = await puppeteer.launch({
            headless: "new",
            executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || null, // Necesario para Render
            args: [
                '--no-sandbox', 
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage', // Evita errores de memoria en servidores pequeños
                '--single-process'
            ]
        });

        rastreosActivos[placa] = browser;
        const page = await browser.newPage();
        
        // Configuramos un tiempo de espera largo (60 seg) por si la web del GPS es lenta
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });

        // Lógica de Login mejorada
        await page.waitForSelector('input', { timeout: 10000 });
        
        await page.type('input[type="text"], input[name*="user"], #user, #username', user);
        await page.type('input[type="password"], #pass, #password', pass);
        
        // Enter o Click
        await Promise.all([
            page.keyboard.press('Enter'),
            page.waitForNavigation({ waitUntil: 'networkidle0' }).catch(() => null)
        ]);
        
        console.log(`✅ Sesión iniciada exitosamente para ${placa}`);

        // OJO: Aquí el robot se quedaría abierto. 
        // Por ahora, lo cerramos tras 1 minuto para no agotar la RAM de tu Render Free
        setTimeout(async () => {
            if(rastreosActivos[placa]) {
                await rastreosActivos[placa].close();
                delete rastreosActivos[placa];
                console.log(`🛑 Navegador cerrado para ${placa} (Limpieza de memoria)`);
            }
        }, 60000);

    } catch (error) {
        console.error(`❌ Error en el robot (${placa}):`, error.message);
        if (browser) await browser.close();
    }
}

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    console.log(`📡 Monitor Live activo en puerto ${PORT}`);
});
