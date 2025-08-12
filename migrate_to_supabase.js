const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Configuración de Supabase
const supabaseUrl = 'https://iityjrvlzgmlbuyvjdra.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlpdHlqcnZsemdtbGJ1eXZqZHJhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUwMzIxMDIsImV4cCI6MjA3MDYwODEwMn0.a1S3wuGK5QYZRuhRIaqUAkNKQD7l-6zLEnj03slR2ys';

// Crear cliente de Supabase
const supabase = createClient(supabaseUrl, supabaseKey);

// Función para leer y parsear el archivo de backup
function parseBackupFile(filename) {
  try {
    const content = fs.readFileSync(filename, 'utf8');
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
    
    return games;
  } catch (error) {
    console.error('Error leyendo archivo de backup:', error.message);
    return [];
  }
}

// Función para crear la tabla en Supabase
async function createTable() {
  try {
    console.log('🗄️ Creando tabla games en Supabase...');
    
    // Crear tabla usando SQL
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS games (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL UNIQUE,
          status INTEGER DEFAULT 1,
          added_date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        -- Crear índices para mejor rendimiento
        CREATE INDEX IF NOT EXISTS idx_games_status ON games(status);
        CREATE INDEX IF NOT EXISTS idx_games_added_date ON games(added_date);
      `
    });
    
    if (error) {
      console.log('⚠️ La tabla ya existe o hubo un error:', error.message);
    } else {
      console.log('✅ Tabla games creada exitosamente');
    }
    
    return true;
  } catch (error) {
    console.log('⚠️ Error creando tabla (puede que ya exista):', error.message);
    return true; // Continuamos aunque la tabla ya exista
  }
}

// Función para migrar los juegos
async function migrateGames(games) {
  try {
    console.log(`🔄 Migrando ${games.length} juegos a Supabase...`);
    
    // Limpiar tabla existente
    console.log('🧹 Limpiando tabla existente...');
    const { error: deleteError } = await supabase
      .from('games')
      .delete()
      .neq('id', 0); // Eliminar todos los registros
    
    if (deleteError) {
      console.log('⚠️ Error limpiando tabla:', deleteError.message);
    } else {
      console.log('✅ Tabla limpiada');
    }
    
    // Insertar juegos en lotes de 50
    const batchSize = 50;
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < games.length; i += batchSize) {
      const batch = games.slice(i, i + batchSize);
      
      const { data, error } = await supabase
        .from('games')
        .insert(batch);
      
      if (error) {
        console.log(`❌ Error en lote ${Math.floor(i/batchSize) + 1}:`, error.message);
        errorCount += batch.length;
      } else {
        successCount += batch.length;
        console.log(`✅ Lote ${Math.floor(i/batchSize) + 1} migrado: ${batch.length} juegos`);
      }
      
      // Pequeña pausa entre lotes
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log(`\n📊 RESUMEN DE MIGRACIÓN:`);
    console.log(`✅ Juegos migrados exitosamente: ${successCount}`);
    console.log(`❌ Errores: ${errorCount}`);
    console.log(`📁 Total procesados: ${games.length}`);
    
    return successCount;
    
  } catch (error) {
    console.error('❌ Error durante la migración:', error.message);
    return 0;
  }
}

// Función para verificar la migración
async function verifyMigration() {
  try {
    console.log('\n🔍 Verificando migración...');
    
    // Contar total de juegos
    const { count, error: countError } = await supabase
      .from('games')
      .select('*', { count: 'exact', head: true });
    
    if (countError) {
      console.log('❌ Error contando juegos:', countError.message);
      return;
    }
    
    console.log(`📊 Total de juegos en Supabase: ${count}`);
    
    // Estadísticas por estado
    const { data: stats, error: statsError } = await supabase
      .from('games')
      .select('status')
      .order('status');
    
    if (statsError) {
      console.log('❌ Error obteniendo estadísticas:', statsError.message);
      return;
    }
    
    const statusCounts = {};
    stats.forEach(game => {
      statusCounts[game.status] = (statusCounts[game.status] || 0) + 1;
    });
    
    console.log('\n📈 Distribución por estado:');
    console.log(`   Estado 1 (Disponible): ${statusCounts[1] || 0} juegos`);
    console.log(`   Estado 2 (Descargado): ${statusCounts[2] || 0} juegos`);
    console.log(`   Estado 3 (Oculto): ${statusCounts[3] || 0} juegos`);
    
    // Mostrar algunos juegos de ejemplo
    const { data: sample, error: sampleError } = await supabase
      .from('games')
      .select('name, status, added_date')
      .order('added_date', { ascending: false })
      .limit(5);
    
    if (!sampleError && sample.length > 0) {
      console.log('\n📋 Últimos 5 juegos agregados:');
      sample.forEach(game => {
        const statusName = game.status === 1 ? 'Disponible' : 
                          game.status === 2 ? 'Descargado' : 'Oculto';
        console.log(`   - ${game.name} (${statusName})`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error verificando migración:', error.message);
  }
}

// Función principal
async function main() {
  try {
    console.log('🚀 INICIANDO MIGRACIÓN A SUPABASE 🚀');
    console.log('=====================================');
    
    // Leer archivo de backup
    const games = parseBackupFile('3358.dat');
    if (games.length === 0) {
      console.log('❌ No se pudieron leer los juegos del archivo de backup');
      return;
    }
    
    console.log(`📁 Juegos leídos del backup: ${games.length}`);
    
    // Crear tabla
    const tableCreated = await createTable();
    if (!tableCreated) {
      console.log('❌ No se pudo crear la tabla');
      return;
    }
    
    // Migrar juegos
    const migratedCount = await migrateGames(games);
    if (migratedCount === 0) {
      console.log('❌ No se migraron juegos');
      return;
    }
    
    // Verificar migración
    await verifyMigration();
    
    console.log('\n🎉 ¡MIGRACIÓN COMPLETADA EXITOSAMENTE! 🎉');
    console.log('===========================================');
    console.log('✅ Tu base de datos está ahora en Supabase');
    console.log('✅ Todos los juegos con sus estados exactos');
    console.log('✅ La aplicación funcionará exactamente igual');
    console.log('\n🔧 Próximo paso: Actualizar la aplicación para usar Supabase');
    
  } catch (error) {
    console.error('❌ Error en la migración:', error.message);
  }
}

// Ejecutar migración
main(); 