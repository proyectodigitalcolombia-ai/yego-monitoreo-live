const express = require('express');
const setupDb = require('./database');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

let db;
setupDb().then(database => { db = database; });

// --- VISTA 1: RADAR GENERAL (MAPA + LISTA) ---
app.get('/', async (req, res) => {
    if (!db) return res.send('Iniciando base de datos...');
    const rutas = await db.all('SELECT * FROM rutas WHERE estado = "EN RUTA"');
    
    res.send(`
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
    <body class="bg-slate-900 h-screen flex flex-col overflow-hidden font-sans">
        <header class="bg-purple-900 p-4 text-white flex justify-between items-center shadow-2xl">
            <h1 class="font-black italic uppercase tracking-tighter text-xl">YEGO <span class="text-emerald-400">Live Monitor</span></h1>
            <div class="text-[9px] text-right font-bold uppercase opacity-60">Control de Activos v2.0</div>
        </header>

        <div class="flex-1 flex flex-col md:flex-row overflow-hidden">
            <aside class="w-full md:w-80 bg-white border-r border-slate-200 overflow-y-auto p-4 shadow-inner">
                <p class="text-[10px] font-black text-slate-400 uppercase mb-4 tracking-widest">Vehículos en Tránsito</p>
                <div class="space-y-3">
                    ${rutas.length === 0 ? '<p class="text-xs italic text-slate-400">No hay vehículos activos. Entra a /test para crear uno.</p>' : ''}
                    ${rutas.map(r => `
                        <div class="p-4 border border-slate-100 rounded-2xl bg-slate-50 hover:border-purple-500 cursor-pointer transition-all shadow-sm group">
                            <div class="flex justify-between items-center mb-2">
                                <span class="bg-purple-950 text-white px-3 py-1 rounded-lg font-black text-xs tracking-widest">${r.placa}</span>
                                <span class="h-2 w-2 bg-emerald-500 rounded-full animate-pulse"></span>
                            </div>
                            <p class="text-[11px] font-bold text-slate-700 uppercase">${r.nombre_conductor}</p>
                            <a href="/detalle/${r.id}" class="mt-3 block text-center bg-purple-600 text-white py-2 rounded-xl font-black text-[9px] uppercase hover:bg-emerald-500 transition-all">Ver Panel de Control 🔍</a>
                        </div>
                    `).join('')}
                </div>
            </aside>
            <main id="map" class="flex-1 bg-slate-200"></main>
        </div>

        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        <script>
            var map = L.map('map').setView([4.5708, -74.2973], 6);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
            ${rutas.map(r => `
                L.marker([${r.latitud}, ${r.longitud}]).addTo(map).bindPopup("<b>${r.placa}</b><br>${r.nombre_conductor}");
            `).join('')}
        </script>
    </body>`);
});

// --- VISTA 2: PANEL DE CONTROL DETALLADO (LA TABLA AZUL) ---
app.get('/detalle/:id', async (req, res) => {
    const r = await db.get('SELECT * FROM rutas WHERE id = ?', [req.params.id]);
    if (!r) return res.redirect('/');
    
    res.send(`
    <script src="https://cdn.tailwindcss.com"></script>
    <body class="bg-slate-200 p-2 md:p-6 font-sans text-[11px]">
        <div class="max-w-6xl mx-auto bg-white shadow-2xl rounded-lg overflow-hidden border border-slate-300">
            <div class="bg-blue-800 text-white p-2 px-4 flex justify-between font-bold uppercase italic text-[12px]">
                <span>Seguimiento de Activos - YEGO Eco-T</span>
                <button onclick="location.href='/'" class="bg-white/20 hover:bg-white/30 px-4 rounded text-[10px] py-1 transition-all">✕ Cerrar</button>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-6 border-b border-slate-300 bg-blue-50">
                <div class="p-2 border-r border-b bg-blue-900 text-white font-black uppercase">Placa</div>
                <div class="p-2 border-b border-r font-black text-blue-800 text-sm">${r.placa}</div>
                <div class="p-2 border-r border-b bg-blue-900 text-white font-black uppercase">Marca</div>
                <div class="p-2 border-b border-r uppercase font-bold">${r.marca || '-'}</div>
                <div class="p-2 border-r border-b bg-blue-900 text-white font-black uppercase">Modelo</div>
                <div class="p-2 border-b font-bold">${r.modelo || '-'}</div>

                <div class="p-2 border-r bg-blue-900 text-white font-black uppercase">Conductor</div>
                <div class="p-2 border-r font-black uppercase text-slate-700">${r.nombre_conductor}</div>
                <div class="p-2 border-r bg-blue-900 text-white font-black uppercase">C.C.</div>
                <div class="p-2 border-r font-bold">${r.cedula_conductor || '-'}</div>
                <div class="p-2 border-r bg-blue-900 text-white font-black uppercase">Celular</div>
                <div class="p-2 font-black text-emerald-600">${r.celular_conductor || '-'}</div>
            </div>

            <div id="mapDetail" class="h-80 bg-slate-100 w-full border-b border-slate-300"></div>

            <div class="p-4 bg-white">
                <h3 class="text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">Puestos de Control / Novedades</h3>
                <div class="border rounded-xl p-4 bg-slate-50 text-slate-600 italic">
                    ${r.notas || 'No se registran novedades en el sistema.'}
                </div>
            </div>
        </div>

        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        <script>
            var mapDetail = L.map('mapDetail').setView([${r.latitud}, ${r.longitud}], 12);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(mapDetail);
            L.marker([${r.latitud}, ${r.longitud}]).addTo(mapDetail)
                .bindPopup("<b>${r.placa}</b>").openPopup();
        </script>
    </body>`);
});

// --- RUTA DE PRUEBA PARA INYECTAR DATOS ---
app.get('/test', async (req, res) => {
    await db.run(\`
        INSERT INTO rutas (placa, marca, modelo, nombre_conductor, cedula_conductor, celular_conductor, latitud, longitud, hora_inicio, notas) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)\`, 
        ['YEGO-01', 'KENWORTH', '2024', 'CARLOS PEREZ', '1.020.333', '310 555 1234', 4.6482, -74.0921, '08:00 AM', 'Cargando en bodega principal.']
    );
    res.send('✅ Vehículo de prueba creado con éxito. Ve a la página principal.');
});

app.listen(PORT, () => console.log('Servicio YEGO Online'));
