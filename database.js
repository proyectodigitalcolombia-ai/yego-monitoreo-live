const sqlite3 = require('sqlite3');
const { open } = require('sqlite');

async function setupDb() {
    const dbPath = process.env.RENDER ? '/data/monitoreo.db' : './monitoreo.db';
    const db = await open({ filename: dbPath, driver: sqlite3.Database });

    await db.exec(`
        CREATE TABLE IF NOT EXISTS rutas (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            placa TEXT,
            marca TEXT,
            modelo TEXT,
            color TEXT,
            nombre_conductor TEXT,
            cedula_conductor TEXT,
            celular_conductor TEXT,
            estado TEXT DEFAULT 'EN RUTA',
            hora_inicio TEXT,
            notas TEXT DEFAULT '',
            latitud REAL DEFAULT 4.5708,
            longitud REAL DEFAULT -74.2973
        )
    `);
    return db;
}
module.exports = setupDb;
