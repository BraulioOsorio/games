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
    // Eliminar tabla downloads si existe
    await pool.query('DROP TABLE IF EXISTS downloads');
    
    // Crear solo tabla games
    await pool.query(`
      CREATE TABLE IF NOT EXISTS games (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        status INTEGER DEFAULT 1,
        added_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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
    // Solo cambiar status a 2 (descargado)
    const datetime = new Date();
    await pool.query(
      'UPDATE games SET status = $1, added_date = $2 WHERE name = $3',
      [2, datetime, gameName]
    );

    res.json({ message: 'Juego marcado como descargado' });
  } catch (err) {
    console.error('Error marcando descarga:', err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// Obtener juegos descargados (estado 2)
app.get('/api/downloads', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM games WHERE status = $1 ORDER BY added_date',
      [2]
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

// Migrar a Supabase
app.post('/api/migrate-to-supabase', async (req, res) => {
  try {
    console.log('🚀 Iniciando migración a Supabase...');
    
    // Leer archivo de backup
    const fs = require('fs');
    const path = require('path');
    const backupFile = path.join(__dirname, '3358.dat');
    
    if (!fs.existsSync(backupFile)) {
      return res.status(404).json({ error: 'Archivo de backup no encontrado' });
    }
    
    // Parsear archivo de backup
    const content = fs.readFileSync(backupFile, 'utf8');
    const lines = content.trim().split('\n');
    const games = [];
    
    lines.forEach(line => {
      const parts = line.split('\t');
      if (parts.length >= 4) {
        const [id, name, status, date] = parts;
        games.push({
          id: parseInt(id),
          name: name.trim(),
          status: parseInt(status),
          added_date: new Date(date.trim()).toISOString()
        });
      }
    });
    
    console.log(`📁 Juegos leídos del backup: ${games.length}`);
    
    // Crear tabla en Supabase usando la API
    const { createClient } = require('@supabase/supabase-js');
    
    const supabaseUrl = 'https://iityjrvlzgmlbuyvjdra.supabase.co';
    const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlpdHlqcnZsemdtbGJ1eXZqZHJhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUwMzIxMDIsImV4cCI6MjA3MDYwODEwMn0.a1S3wuGK5QYZRuhRIaqUAkNKQD7l-6zLEnj03slR2ys';
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Limpiar tabla existente en Supabase
    console.log('🧹 Limpiando tabla en Supabase...');
    const { error: deleteError } = await supabase
      .from('games')
      .delete()
      .neq('id', 0);
    
    if (deleteError) {
      console.log('⚠️ Error limpiando tabla:', deleteError.message);
    }
    
    // Insertar juegos en Supabase
    console.log('📤 Insertando juegos en Supabase...');
    const { data, error } = await supabase
      .from('games')
      .insert(games);
    
    if (error) {
      console.error('❌ Error insertando en Supabase:', error);
      return res.status(500).json({ error: `Error insertando en Supabase: ${error.message}` });
    }
    
    // Contar juegos por estado
    const statusCounts = {};
    games.forEach(game => {
      statusCounts[game.status] = (statusCounts[game.status] || 0) + 1;
    });
    
    console.log('✅ Migración completada exitosamente');
    
    res.json({
      success: true,
      totalGames: games.length,
      status1: statusCounts[1] || 0,
      status2: statusCounts[2] || 0,
      status3: statusCounts[3] || 0,
      message: 'Migración a Supabase completada exitosamente'
    });
    
  } catch (error) {
    console.error('❌ Error en migración a Supabase:', error);
    res.status(500).json({ error: `Error en migración: ${error.message}` });
  }
});

// Buscar juegos por nombre
app.get('/api/search', async (req, res) => {
  const { q } = req.query;
  
  if (!q || q.trim() === '') {
    return res.status(400).json({ error: 'El término de búsqueda es requerido' });
  }

  try {
    const searchTerm = `%${q.trim().toUpperCase()}%`;
    const result = await pool.query(
      'SELECT * FROM games WHERE name ILIKE $1 ORDER BY name',
      [searchTerm]
    );
    
    res.json({
      results: result.rows,
      count: result.rows.length,
      searchTerm: q.trim()
    });
  } catch (err) {
    console.error('Error buscando juegos:', err);
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