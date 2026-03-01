const express = require('express');
const setupDb = require('./database');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

let db;
setupDb().then(database => { db = database; });

// --- VISTA PRINCIPAL ---
app.get('/', async (req, res) => {
    if (!db) return res.send('Iniciando base de datos...');
    const rutas = await db.all('SELECT * FROM rutas WHERE estado = "EN RUTA"');
    
    res.send(`
    <script src="https://cdn.tailwindcss.com"></script>
    <body class="bg-slate-900 h-screen flex flex-col overflow-hidden font-sans">
        <header class="bg-purple-900 p-4 text-white flex justify-between items-center shadow-2xl">
            <h1 class="font-black italic uppercase tracking-tighter text-xl">YEGO <span class="text-emerald-400">Live</span></h1>
            <div class="text-[10px] text-right font-bold uppercase opacity-70">Control Satelital</div>
        </header>
        <div class="flex-1 flex overflow-hidden">
            <aside class="w-72 bg-white border-r border-slate-200 overflow-y-auto p-4">
                <p class="text-[10px] font-black text-slate-400 uppercase mb-4 tracking-widest">Vehículos</p>
                ${rutas.map(r => `
                    <div onclick="location.href='/detalle/${r.id}'" class="p-3 mb-2 bg-slate-50 border border-slate-100 rounded-xl hover:border-purple-600 cursor-pointer transition-all">
                        <div class="bg-purple-950 text-white px-2 py-0.5 rounded text-[10px] font-black w-fit mb-1">${r.placa}</div>
                        <p class="font-bold text-slate-700 text-[11px] uppercase">${r.nombre_conductor}</p>
                    </div>
                `).join('')}
            </aside>
            <main id="map" class="flex-1 bg-slate-100"></main>
        </div>
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        <script>
            var map = L.map('map').setView([4.5708, -74.2973], 6);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
        </script>
    </body>`);
});

// --- VISTA DETALLE (TABLA AZUL) ---
app.get('/detalle/:id', async (req, res) => {
    const r = await db.get('SELECT * FROM rutas WHERE id = ?', [req.params.id]);
    if (!r) return res.redirect('/');
    
    res.send(`
    <script src="https://cdn.tailwindcss.com"></script>
    <body class="bg-slate-100 p-4 font-sans text-[10px]">
        <div class="max-w-7xl mx-auto bg-white shadow-2xl rounded border border-slate-300">
            <div class="bg-blue-800 text-white p-2 px-3 flex justify-between font-bold uppercase italic text-[11px]">
                <span>Seguimiento Controlador - YEGO Eco-T</span>
                <button onclick="location.href='/'" class="bg-emerald-600 px-3 rounded text-[9px] py-0.5">Volver</button>
            </div>
            <div class="grid grid-cols-6 border-b border-slate-300">
                <div class="p-2 border-r border-b bg-blue-900 text-white font-bold uppercase">Placa</div>
                <div class="p-2 border-b border-r font-black text-blue-800 text-xs">${r.placa}</div>
                <div class="p-2 border-r border-b bg-blue-900 text-white font-bold uppercase">Marca</div>
                <div class="p-2 border-b border-r uppercase">${r.marca || '-'}</div>
                <div class="p-2 border-r border-b bg-blue-900 text-white font-bold uppercase">Modelo</div>
                <div class="p-2 border-b font-bold">${r.modelo || '-'}</div>
                <div class="p-2 border-r bg-blue-900 text-white font-bold uppercase">Conductor</div>
                <div class="p-2 border-r font-bold uppercase">${r.nombre_conductor}</div>
                <div class="p-2 border-r bg-blue-900 text-white font-bold uppercase">C.C.</div>
                <div class="p-2 border-r">${r.cedula_conductor || '-'}</div>
                <div class="p-2 border-r bg-blue-900 text-white font-bold uppercase">Celular</div>
                <div class="p-2 font-black text-emerald-700">${r.celular_conductor || '-'}</div>
            </div>
            <div id="mapDetail" class="h-64 bg-slate-200 w-full border-b border-slate-300"></div>
        </div>
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        <script>
            var mapDetail = L.map('mapDetail').setView([${r.latitud || 4.5}, ${r.longitud || -74}], 12);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(mapDetail);
            L.marker([${r.latitud || 4.5}, ${r.longitud || -74}]).addTo(mapDetail);
        </script>
    </body>`);
});

app.listen(PORT, () => console.log('Servicio YEGO Online'));
