const express = require('express');
const cors = require('cors');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Configuración de Supabase
const supabaseUrl = 'https://iityjrvlzgmlbuyvjdra.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlpdHlqcnZsemdtbGJ1eXZqZHJhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUwMzIxMDIsImV4cCI6MjA3MDYwODEwMn0.a1S3wuGK5QYZRuhRIaqUAkNKQD7l-6zLEnj03slR2ys';

const supabase = createClient(supabaseUrl, supabaseKey);


// API ROUTES

// Obtener juegos disponibles (estado 1)
app.get('/api/games', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('games')
      .select('*')
      .eq('status', 1)
      .order('name');
    
    if (error) throw error;
    
    res.json(data);
  } catch (err) {
    console.error('Error obteniendo juegos:', err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// Agregar nuevo juego
app.post('/api/games', async (req, res) => {
  try {
    const { gameName } = req.body;
    if (!gameName) {
      return res.status(400).json({ error: 'El nombre del juego es requerido' });
    }
    
    const { data, error } = await supabase
      .from('games')
      .insert([{
        name: gameName.toUpperCase(),
        status: 1,
        added_date: new Date().toISOString()
      }])
      .select();
    
    if (error) throw error;
    
    res.json({ message: 'Juego agregado exitosamente', game: data[0] });
  } catch (err) {
    console.error('Error agregando juego:', err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// Marcar juego como descargado (cambiar estado a 2)
app.post('/api/downloads', async (req, res) => {
  try {
    const { gameName } = req.body;
    if (!gameName) {
      return res.status(400).json({ error: 'El nombre del juego es requerido' });
    }
    
    const downloadedAt = new Date().toISOString();
    
    const { error } = await supabase
      .from('games')
      .update({ status: 2, added_date: downloadedAt })
      .eq('name', gameName);
    
    if (error) throw error;
    
    res.json({ message: 'Juego marcado como descargado', downloadedAt });
  } catch (err) {
    console.error('Error marcando descarga:', err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// Obtener juegos descargados (estado 2)
app.get('/api/downloads', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('games')
      .select('*')
      .eq('status', 2)
      .order('added_date', { ascending: true });
    
    if (error) throw error;
    
    // Formatear fechas
    const formattedData = data.map(game => ({
      ...game,
      formatted_date: new Date(game.added_date).toLocaleString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    }));
    
    res.json(formattedData);
  } catch (err) {
    console.error('Error obteniendo descargas:', err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// Obtener juego aleatorio (estado 1)
app.get('/api/random-game', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('games')
      .select('*')
      .eq('status', 1)
      .order('RANDOM()')
      .limit(1);
    
    if (error) throw error;
    
    if (data.length === 0) {
      return res.status(404).json({ error: 'No hay juegos disponibles' });
    }
    
    res.json(data[0]);
  } catch (err) {
    console.error('Error obteniendo juego aleatorio:', err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// Restaurar juego (cambiar estado de 2 a 1)
app.delete('/api/downloads/:gameName', async (req, res) => {
  try {
    const { gameName } = req.params;
    
    const { error } = await supabase
      .from('games')
      .update({ status: 1 })
      .eq('name', gameName);
    
    if (error) throw error;
    
    res.json({ message: 'Juego restaurado exitosamente' });
  } catch (err) {
    console.error('Error restaurando juego:', err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// Ocultar juego permanentemente (cambiar estado a 3)
app.delete('/api/games/:gameName', async (req, res) => {
  try {
    const { gameName } = req.params;
    
    const { error } = await supabase
      .from('games')
      .update({ status: 3 })
      .eq('name', gameName);
    
    if (error) throw error;
    
    res.json({ message: 'Juego ocultado permanentemente' });
  } catch (err) {
    console.error('Error ocultando juego:', err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// Obtener estadísticas
app.get('/api/stats', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('games')
      .select('status');
    
    if (error) throw error;
    
    const stats = {
      total: data.length,
      available: data.filter(g => g.status === 1).length,
      downloaded: data.filter(g => g.status === 2).length,
      hidden: data.filter(g => g.status === 3).length
    };
    
    res.json(stats);
  } catch (err) {
    console.error('Error obteniendo estadísticas:', err);
    res.status(500).json({ error: 'Error del servidor' });
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
    const { data, error } = await supabase
      .from('games')
      .select('*')
      .ilike('name', searchTerm)
      .order('name');
    
    if (error) throw error;
    
    res.json({
      results: data,
      count: data.length,
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
app.listen(PORT, () => {
  console.log(`🚀 Servidor ejecutándose en puerto ${PORT}`);
  console.log(`🔗 Conectado a Supabase: ${supabaseUrl}`);
  console.log(`📊 Base de datos: games`);
  console.log(`🎮 Estados: 1=Disponible, 2=Descargado, 3=Oculto`);
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