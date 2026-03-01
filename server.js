const express = require('express');
const setupDb = require('./database');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

let db;
setupDb().then(database => { db = database; });

// VISTA PRINCIPAL: MAPA Y LISTA DE ACTIVOS
app.get('/', async (req, res) => {
    if (!db) return res.send('Cargando base de datos...');
    const rutas = await db.all('SELECT * FROM rutas WHERE estado = "EN RUTA"');

    res.send(`
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
    <body class="bg-slate-900 font-sans h-screen flex flex-col overflow-hidden">
        <div class="bg-purple-900 p-4 text-white flex justify-between items-center shadow-xl">
            <h1 class="font-black italic uppercase tracking-tighter">YEGO <span class="text-emerald-400">Live Tracking</span></h1>
            <span class="text-[10px] font-bold bg-white/10 px-3 py-1 rounded-full uppercase">Servicio de Monitoreo Activo</span>
        </div>

        <div class="flex-1 flex flex-col md:flex-row overflow-hidden">
            <div class="w-full md:w-80 bg-white overflow-y-auto p-4 border-r border-slate-200">
                <h2 class="text-[10px] font-black text-slate-400 uppercase mb-4 tracking-widest">Vehículos en Mapa</h2>
                <div class="space-y-3">
                    ${rutas.map(r => `
                        <div class="p-4 border border-slate-100 rounded-2xl bg-slate-50 hover:border-purple-500 cursor-pointer transition-all shadow-sm" onclick="enfocarMapa(${r.latitud}, ${r.longitud}, '${r.placa}')">
                            <div class="flex justify-between items-center mb-2">
                                <span class="bg-purple-900 text-white px-3 py-1 rounded-lg font-black text-xs tracking-widest">${r.placa}</span>
                                <span class="text-[9px] font-bold text-emerald-500 uppercase italic">Online</span>
                            </div>
                            <p class="text-[11px] font-bold text-slate-700 uppercase">${r.nombre_conductor}</p>
                            <p class="text-[9px] text-slate-400 uppercase">H. Inicio: ${r.hora_inicio}</p>
                            <a href="/detalle/${r.id}" class="mt-2 block text-center bg-white border border-purple-200 text-purple-700 py-1 rounded-lg font-black text-[9px] uppercase hover:bg-purple-700 hover:text-white transition-all italic">Ver Panel de Control 🔍</a>
                        </div>
                    `).join('')}
                </div>
            </div>

            <div id="map" class="flex-1 bg-slate-100"></div>
        </div>

        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        <script>
            var map = L.map('map').setView([4.5708, -74.2973], 6);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

            function enfocarMapa(lat, lng, placa) {
                map.setView([lat, lng], 13);
                L.marker([lat, lng]).addTo(map).bindPopup("<b>Placa: " + placa + "</b>").openPopup();
            }
        </script>
    </body>`);
});

// RUTA PARA EL PANEL DE CONTROL DETALLADO (LA TABLA AZUL)
app.get('/detalle/:id', async (req, res) => {
    const r = await db.get('SELECT * FROM rutas WHERE id = ?', [req.params.id]);
    if (!r) return res.redirect('/');

    res.send(\`
        <script src="https://cdn.tailwindcss.com"></script>
        <body class="bg-slate-100 p-8">
            <div class="max-w-4xl mx-auto bg-white p-8 rounded-3xl shadow-2xl">
                <h1 class="text-2xl font-black text-purple-900 mb-6 uppercase italic">Detalle de Activos: \${r.placa}</h1>
                <div class="grid grid-cols-2 gap-4">
                    <div class="p-4 bg-slate-50 rounded-xl border-l-4 border-purple-500">
                        <p class="text-[10px] font-bold text-slate-400 uppercase">Conductor</p>
                        <p class="font-black text-lg uppercase text-slate-800">\${r.nombre_conductor}</p>
                    </div>
                    <div class="p-4 bg-slate-50 rounded-xl border-l-4 border-emerald-500">
                        <p class="text-[10px] font-bold text-slate-400 uppercase">Cédula / ID</p>
                        <p class="font-black text-lg text-slate-800">\${r.cedula_conductor || 'N/A'}</p>
                    </div>
                </div>
                <button onclick="window.history.back()" class="mt-8 bg-slate-900 text-white px-8 py-3 rounded-xl font-black uppercase text-xs tracking-widest">Volver</button>
            </div>
        </body>
    \`);
});

app.listen(PORT, () => console.log('Servicio de Monitoreo YEGO Online'));
