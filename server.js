const express = require('express');
const setupDb = require('./database');
const puppeteer = require('puppeteer');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
let db;
setupDb().then(database => { db = database; });

// --- MOTOR ROBOT (SCRAPER) ---
// Esta función es la que "entra" a las webs de tus proveedores
async function scrapearGps(url, user, pass, tipo) {
    const browser = await puppeteer.launch({ 
        args: ['--no-sandbox', '--disable-setuid-sandbox'] 
    });
    const page = await browser.newPage();
    try {
        await page.goto(url, { waitUntil: 'networkidle2' });
        
        // EJEMPLO: Lógica para una plataforma genérica
        // Aquí ajustaremos los IDs (#) según la plataforma real
        await page.type('#user_input', user);
        await page.type('#pass_input', pass);
        await page.click('#login_btn');
        
        await page.waitForSelector('.lat-value', { timeout: 10000 });
        
        const coords = await page.evaluate(() => {
            return {
                lat: parseFloat(document.querySelector('.lat-value').innerText),
                lng: parseFloat(document.querySelector('.lng-value').innerText)
            };
        });
        await browser.close();
        return coords;
    } catch (e) {
        console.log("Error en el robot de rastreo:", e.message);
        await browser.close();
        return null;
    }
}

// API: Recibir despacho desde el Servicio A (Admin)
app.post('/api/recibir-despacho', async (req, res) => {
    const d = req.body;
    await db.run(`INSERT INTO rutas (placa, nombre_conductor, url_gps, user_gps, pass_gps, estado) 
                  VALUES (?, ?, ?, ?, ?, 'EN RUTA')`, 
                  [d.placa, d.nombre, d.url_gps, d.user_gps, d.pass_gps]);
    res.json({ ok: true });
});

// VISTA PRINCIPAL (Mapa)
app.get('/', async (req, res) => {
    const rutas = await db.all('SELECT * FROM rutas WHERE estado = "EN RUTA"');
    res.send(`
        <script src="https://cdn.tailwindcss.com"></script>
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <body class="bg-slate-900 flex flex-col h-screen overflow-hidden">
            <header class="p-4 bg-purple-900 text-white font-black italic">YEGO LIVE MONITOR</header>
            <div class="flex-1 flex">
                <aside class="w-80 bg-white p-4 overflow-y-auto">
                    ${rutas.map(r => `
                        <div class="p-4 border mb-2 rounded-xl bg-slate-50">
                            <p class="font-black text-purple-900">${r.placa}</p>
                            <p class="text-[10px] text-slate-500">${r.nombre_conductor}</p>
                            <button onclick="location.href='/detalle/${r.id}'" class="mt-2 w-full bg-blue-600 text-white text-[10px] py-2 rounded-lg font-bold">VER PANEL AZUL</button>
                        </div>
                    `).join('')}
                </aside>
                <div id="map" class="flex-1"></div>
            </div>
            <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
            <script>
                var map = L.map('map').setView([4.57, -74.29], 6);
                L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
                ${rutas.map(r => `L.marker([${r.latitud}, ${r.longitud}]).addTo(map).bindPopup("${r.placa}");`).join('')}
            </script>
        </body>
    `);
});

app.listen(PORT, () => console.log('Monitor con Robot Activo'));
