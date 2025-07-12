const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public')); // Servir archivos estáticos

// Configuración de PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Lista completa de juegos
const allGames = [
  "HALO WARS DEFINITIVE EDITION", "HALO WARS 2 ULTIMATE EDITION", "CYBERPUNK 2077",
  "MARVEL'S SPIDER-MAN MILES MORALES", "ASSASSIN'S CREED II DELUXE EDITION", "ALAN WAKE II DELUXE EDITION",
  "CALL OF DUTY VANGUARD", "CALL OF DUTY BLACK OPS II PLUTONIUM", "JUST CAUSE 4 COMPLETE EDITION",
  "ASSASSIN'S CREED ODYSSEY GOLD EDITION", "BATMAN ARKHAM KNIGHT PREMIUM EDITION", "MAFIA DEFINITIVE EDITION",
  "MAFIA 2 DEFINITIVE EDITION", "SAINTS ROW PLATINUM EDITION", "WOLFENSTEIN II THE NEW COLOSSUS",
  "WATCH DOGS 2 DELUXE EDITION", "TOM CLANCY'S GHOST RECON WILDLANDS GOLD EDITION", "FAR CRY 6 GOLD EDITION",
  "OUTPOST INFINITY SIEGE VANGUARD EDITION", "DYING LIGHT 2 STAY HUMAN", "MARVEL SPIDER-MAN 2 DELUXE EDITION",
  "DEAD SPACE 2", "ROBOCOP ROGUE CITY", "ASSASSIN'S CREED VALHALLA", "WANTED DEAD",
  "GENERATION ZERO ULTIMATE BUNDLE", "MORTAL KOMBAT XL", "FAR CRY PRIMAL", "METRO 2033 REDUX",
  "SAINTS ROW 2", "SHADOW OF THE TOMB RAIDER DEFINITIVE EDITION", "RATCHET AND CLANK RIFT APART",
  "NEED FOR SPEED HEAT DELUXE EDITION", "DAYMARE 1994 SANDCASTLE", "LEGO HORIZON ADVENTURES DELUXE EDITION",
  "SNIPER ELITE 4", "FAR CRY 5", "EURO TRUCK SIMULATOR 2", "ASSASSIN'S CREED ORIGINS GOLD EDITION",
  "DAYS GONE", "MASS EFFECT LEGENDARY EDITION", "BLACK SAILS", "HITMAN ABSOLUTION PROFESSIONAL EDITION",
  "RAGE 2 DELUXE EDITION", "FAR CRY 4", "CALL OF DUTY 4 MODERN WARFARE", "GEARS OF WAR",
  "BIOSHOCK INFINITE", "PREY", "KINGDOM HEARTS III + RE MIND", "LIES OF P DELUXE EDITION",
  "OUTCAST A NEW BEGINNING", "BRIGHT MEMORY: INFINITE", "HIGH ON LIFE", "BATTLEFIELD 3",
  "METRO LAST LIGHT", "BANISHERS GHOSTS OF NEW EDEN", "REMNANT II ULTIMATE EDITION",
  "CALL OF DUTY MODERN WARFARE 2 REMASTERED", "CALL OF DUTY BLACK OPS III", "RAYMAN ORIGINS",
  "FAR CRY 3", "ATOMIC HEART", "A PLAGUE TALE INNOCENCE", "NECROMUNDA HIRED GUN",
  "STEELRISING", "THE LAST OF US PART II", "EVIL WEST", "AIRPORTSIM", "PSYCHONAUTS 2",
  "EMPIRE OF THE ANTS DELUXE", "A QUIET PLACE THE ROAD AHEAD", "DEUS EX MANKIND DIVIDED",
  "TOM CLANCY'S SPLINTER CELL BLACKLIST", "SOULSTICE", "FORSPOKEN DIGITAL DELUXE EDITION",
  "RESISTANCE 3", "CONTAIN", "POWERWASH ADVENTURE", "WARFRAME", "WOLFENSTEIN THE NEW ORDER",
  "OUTPOST INFINITY SIEGE VANGUARD", "GRAND THEFT AUTO V", "STAR WARS JEDI SURVIVOR",
  "BRIGHT MEMORY INFINITE", "RETURNAL", "CALL OF DUTY GHOSTS", "TITANFALL 2", "HALF-LIFE ALYX",
  "CALL OF DUTY MODERN WARFARE REMASTERED", "EVERSPACE 2", "GOD OF WAR RAGNARÖK", "STALKER 2",
  "MAX PAYNE 3", "MECHWARRIOR 5 MERCENARIES", "WOLFENSTEIN YOUNGBLOOD", "STAR WARS JEDI FALLEN ORDER",
  "DRAGON BALL SPARKING! ZERO", "NEED FOR SPEED MOST WANTED LIMITED EDITION", "UNCHARTED 4 LEGACY THIEVES COLLECTION",
  "FAR CRY NEW DAWN DELUXE EDITION", "PACIFIC DRIVE", "UNKNOWN 9 AWAKENING", "WARHAMMER 40000 SPACE MARINE 2",
  "QUANTUM BREAK STEAM EDITION", "CALL OF DUTY WWII", "METAL GEAR SOLID V THE PHANTOM PAIN",
  "THE SURGE", "TERMINATOR RESISTANCE", "SCARS ABOVE", "OBSERVER SYSTEM REDUX",
  "CRASH BANDICOOT 4 IT'S ABOUT TIME", "GHOST OF TSUSHIMA DIRECTOR'S CUT", "GEARS 5 ULTIMATE EDITION",
  "THE EVIL WITHIN 2", "HOMEFRONT THE REVOLUTION", "INDIANA JONES AND THE GREAT CIRCLE",
  "SYNDICATE 2012", "UNRAVEL TWO", "CALL OF DUTY BLACK OPS", "ASSASSINS CREED MIRAGE MASTER ASSASSIN EDITION",
  "TRANSFORMERS FALL OF CYBERTRON", "ROADCRAFT", "THE CHORUS", "GUARDIANS OF THE GALAXY",
  "STAR WARS BATTLEFRONT II ULTIMATE EDITION", "RECORE DEFINITIVE EDITION", "RESIDENT EVIL 2 REMAKE DELUXE EDITION",
  "CRYSIS 3 REMASTERED", "BATTLEFIELD HARDLINE", "CALL OF DUTY: ADVANCED WARFARE"
];

// Inicializar base de datos
async function initDatabase() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS games (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        status INTEGER DEFAULT 1,
        added_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS downloads (
        id SERIAL PRIMARY KEY,
        game_name VARCHAR(255) NOT NULL,
        download_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('✅ Base de datos inicializada correctamente');
    console.log('📊 Estados: 1=Lista Principal, 2=Descargado, 3=Oculto');
  } catch (err) {
    console.error('❌ Error inicializando base de datos:', err);
  }
}

// Rutas API

// Obtener todos los juegos (solo estado 1 - disponibles)
app.get('/api/games', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM games WHERE status = $1 ORDER BY name', [1]);
    res.json(result.rows);
  } catch (err) {
    console.error('Error obteniendo juegos:', err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// Agregar un nuevo juego
app.post('/api/games', async (req, res) => {
  const { name } = req.body;
  
  if (!name || name.trim() === '') {
    return res.status(400).json({ error: 'El nombre del juego es requerido' });
  }

  try {
    const result = await pool.query(
      'INSERT INTO games (name, status) VALUES ($1, $2) RETURNING *',
      [name.trim().toUpperCase(), 1]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') { // Duplicate key
      res.status(409).json({ error: 'El juego ya existe' });
    } else {
      console.error('Error agregando juego:', err);
      res.status(500).json({ error: 'Error del servidor' });
    }
  }
});

// Marcar juego como descargado (cambiar estado a 2)
app.post('/api/downloads', async (req, res) => {
  const { gameName } = req.body;
  
  if (!gameName) {
    return res.status(400).json({ error: 'El nombre del juego es requerido' });
  }

  try {
    // Agregar a la tabla de descargas
    await pool.query(
      'INSERT INTO downloads (game_name) VALUES ($1)',
      [gameName]
    );

    // Cambiar status a 2 (descargado)
    await pool.query(
      'UPDATE games SET status = $1 WHERE name = $2',
      [2, gameName]
    );

    res.json({ message: 'Juego marcado como descargado' });
  } catch (err) {
    console.error('Error marcando descarga:', err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// Obtener historial de descargas (juegos con estado 2)
app.get('/api/downloads', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT d.*, g.status FROM downloads d LEFT JOIN games g ON d.game_name = g.name ORDER BY d.download_date DESC'
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error obteniendo descargas:', err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// Obtener un juego aleatorio (solo estado 1)
app.get('/api/random-game', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM games WHERE status = $1 ORDER BY RANDOM() LIMIT 1',
      [1]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'No hay juegos disponibles' });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error obteniendo juego aleatorio:', err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// Restaurar juego de descargas (cambiar estado de 2 a 1)
app.delete('/api/downloads/:gameName', async (req, res) => {
  const { gameName } = req.params;
  
  try {
    // Cambiar status de vuelta a 1 (disponible)
    await pool.query(
      'UPDATE games SET status = $1 WHERE name = $2',
      [1, gameName]
    );

    res.json({ message: 'Juego restaurado a disponible' });
  } catch (err) {
    console.error('Error restaurando juego:', err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// Ocultar juego permanentemente (cambiar estado a 3)
app.delete('/api/games/:gameName', async (req, res) => {
  const { gameName } = req.params;
  
  try {
    // Cambiar status a 3 (oculto)
    await pool.query(
      'UPDATE games SET status = $1 WHERE name = $2',
      [3, gameName]
    );

    res.json({ message: 'Juego ocultado permanentemente' });
  } catch (err) {
    console.error('Error ocultando juego:', err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// Poblar base de datos con juegos iniciales
app.post('/api/populate', async (req, res) => {
  try {
    let added = 0;
    let updated = 0;
    
    for (const game of allGames) {
      try {
        // Intentar insertar el juego
        await pool.query('INSERT INTO games (name, status) VALUES ($1, $2)', [game, 1]);
        added++;
      } catch (err) {
        if (err.code === '23505') {
          // Si ya existe, asegurar que esté en estado 1
          await pool.query('UPDATE games SET status = $1 WHERE name = $2', [1, game]);
          updated++;
        } else {
          console.error(`Error agregando ${game}:`, err);
        }
      }
    }
    
    res.json({ 
      message: `Base de datos poblada: ${added} juegos agregados, ${updated} juegos actualizados`,
      total: allGames.length
    });
  } catch (err) {
    console.error('Error poblando base de datos:', err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// Obtener estadísticas
app.get('/api/stats', async (req, res) => {
  try {
    const totalGames = await pool.query('SELECT COUNT(*) FROM games');
    const availableGames = await pool.query('SELECT COUNT(*) FROM games WHERE status = 1');
    const downloadedGames = await pool.query('SELECT COUNT(*) FROM games WHERE status = 2');
    const hiddenGames = await pool.query('SELECT COUNT(*) FROM games WHERE status = 3');
    
    res.json({
      total: parseInt(totalGames.rows[0].count),
      available: parseInt(availableGames.rows[0].count),
      downloaded: parseInt(downloadedGames.rows[0].count),
      hidden: parseInt(hiddenGames.rows[0].count)
    });
  } catch (err) {
    console.error('Error obteniendo estadísticas:', err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// Ruta para servir tu aplicación frontend
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Inicializar servidor
app.listen(PORT, async () => {
  console.log(`🚀 Servidor ejecutándose en puerto ${PORT}`);
  console.log(`🔗 Conectando a PostgreSQL...`);
  await initDatabase();
});

// Manejo de errores
process.on('uncaughtException', (err) => {
  console.error('Error no capturado:', err);
  process.exit(1);
});

process.on('unhandledRejection', (err) => {
  console.error('Promesa rechazada no manejada:', err);
  process.exit(1);
}); 