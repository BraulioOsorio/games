// Configuración de la API
const API_BASE_URL = window.location.origin;

// Variables globales
let currentWord = "";
let allGames = [];
let downloadList = [];
let usedWords = [];
let remainingWords = [];
let statsChart = null;

const apiKey = 'c6beb639913a47a8b4148f99ab751619';
let imageTimeout;
let currentSearchFilter = 'all'; // Variable para el filtro de búsqueda actual
let gameHistory = []; // Historial de juegos generados con fechas
let currentGameInfo = null; // Información actual del juego desde RAWG

// Funciones de loading
function showLoading(message = 'Cargando...') {
  const loadingEl = document.getElementById('loading');
  const loadingText = loadingEl.querySelector('p');
  loadingText.textContent = message;
  loadingEl.classList.remove('loading-hidden');
}

function hideLoading() {
  const loadingEl = document.getElementById('loading');
  loadingEl.classList.add('loading-hidden');
}

// Configuración personalizada de SweetAlert2 con tema gaming
const gamingAlert = {
  customClass: {
    popup: 'gaming-popup',
    title: 'gaming-title',
    content: 'gaming-content',
    confirmButton: 'gaming-confirm-btn',
    cancelButton: 'gaming-cancel-btn'
  },
  background: 'rgba(0, 0, 0, 0.95)',
  color: '#b3b3b3',
  confirmButtonColor: '#4b0082',
  cancelButtonColor: '#dc143c',
  showClass: {
    popup: 'animate__animated animate__fadeInDown'
  },
  hideClass: {
    popup: 'animate__animated animate__fadeOutUp'
  }
};

// Funciones de API
async function fetchGames() {
  try {
    showLoading('Cargando juegos desde la base de datos...');
    const response = await fetch(`${API_BASE_URL}/api/games`);
    if (!response.ok) throw new Error('Error obteniendo juegos');
    const games = await response.json();
    allGames = games;
    
    // Solo incluir en remainingWords los juegos disponibles (status = 1)
    // y que no estén ya en usedWords
    remainingWords = games
      .filter(game => game.status === 1 && !usedWords.includes(game.name))
      .map(game => game.name);
    
    updateWordCount();
    updateProgressBar();
    return games;
  } catch (error) {
    console.error('Error:', error);
    showError('Error cargando juegos desde la base de datos');
    return [];
  }
}

async function fetchDownloads() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/downloads`);
    if (!response.ok) throw new Error('Error obteniendo descargas');
    const downloads = await response.json();
    downloadList = downloads;
    updateDownloadTable();
    return downloads;
  } catch (error) {
    console.error('Error:', error);
    showError('Error cargando historial de descargas');
    return [];
  }
}

async function addGameToDatabase(gameName) {
  try {
    console.log('🎮 Intentando agregar juego:', gameName);
    console.log('🎮 Tipo de dato:', typeof gameName);
    console.log('🎮 Longitud:', gameName?.length);
    
    if (!gameName || gameName.trim() === '') {
      throw new Error('El nombre del juego no puede estar vacío');
    }
    
    showLoading('Agregando juego a la base de datos...');
    const response = await fetch(`${API_BASE_URL}/api/games`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ gameName: gameName.trim() })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error agregando juego');
    }
    
    const result = await response.json();
    hideLoading();
    return result;
  } catch (error) {
    hideLoading();
    console.error('Error:', error);
    throw error;
  }
}

async function markAsDownloaded(gameName) {
  try {
    showLoading('Marcando juego como descargado...');
    const response = await fetch(`${API_BASE_URL}/api/downloads`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ gameName })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error marcando descarga');
    }
    
    const result = await response.json();
    hideLoading();
    return result;
  } catch (error) {
    hideLoading();
    console.error('Error:', error);
    throw error;
  }
}

async function getRandomGame() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/random-game`);
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('No hay juegos disponibles');
      }
      throw new Error('Error obteniendo juego aleatorio');
    }
    return await response.json();
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
}

async function restoreGame(gameName) {
  try {
    showLoading('Restaurando juego...');
    const response = await fetch(`${API_BASE_URL}/api/downloads/${encodeURIComponent(gameName)}`, {
      method: 'DELETE'
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error restaurando juego');
    }
    
    const result = await response.json();
    hideLoading();
    return result;
  } catch (error) {
    hideLoading();
    console.error('Error:', error);
    throw error;
  }
}

async function populateDatabase() {
  try {
    showLoading('Poblando base de datos con juegos...');
    const response = await fetch(`${API_BASE_URL}/api/populate`, {
      method: 'POST'
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error poblando base de datos');
    }
    
    const result = await response.json();
    hideLoading();
    return result;
  } catch (error) {
    hideLoading();
    console.error('Error:', error);
    throw error;
  }
}

// Obtener estadísticas de la base de datos
async function fetchStats() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/stats`);
    if (!response.ok) throw new Error('Error obteniendo estadísticas');
    const stats = await response.json();
    updateStatsDisplay(stats);
    updateStatsChart(stats);
    return stats;
  } catch (error) {
    console.error('Error:', error);
    showError('Error cargando estadísticas');
    return null;
  }
}

// Actualizar la visualización de estadísticas
function updateStatsDisplay(stats) {
  document.getElementById('total-games').textContent = stats.total;
  document.getElementById('available-games').textContent = stats.available;
  document.getElementById('downloaded-games').textContent = stats.downloaded;
  document.getElementById('hidden-games').textContent = stats.hidden;
}

// Función para migrar a Supabase
async function migrateToSupabase() {
  try {
    // Deshabilitar botón durante la migración
    const migrateBtn = document.getElementById('migrate-supabase-btn');
    migrateBtn.disabled = true;
    migrateBtn.textContent = '🔄 Migrando...';
    
    // Mostrar loading
    showLoading();
    
    // Mostrar confirmación
    const result = await Swal.fire({
      ...gamingAlert,
      title: '🚀 ¿Migrar a Supabase?',
      text: 'Esto migrará todos tus juegos a Supabase para que nunca más pierdas datos. ¿Continuar?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: '¡Sí, Migrar!',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#667eea',
      cancelButtonColor: '#d33'
    });
    
    if (!result.isConfirmed) {
      hideLoading();
      migrateBtn.disabled = false;
      migrateBtn.textContent = '🚀 Migrar a Supabase';
      return;
    }
    
    // Llamar a la API de migración
    const response = await fetch('/api/migrate-to-supabase', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }
    
    const resultData = await response.json();
    
    // Mostrar éxito
    await Swal.fire({
      ...gamingAlert,
      title: '🎉 ¡Migración Exitosa!',
      html: `
        <div style="text-align: left; margin: 20px 0;">
          <p><strong>✅ Total migrado:</strong> ${resultData.totalGames} juegos</p>
          <p><strong>📊 Estado 1 (Disponible):</strong> ${resultData.status1} juegos</p>
          <p><strong>📥 Estado 2 (Descargado):</strong> ${resultData.status2} juegos</p>
          <p><strong>🚫 Estado 3 (Oculto):</strong> ${resultData.status3} juegos</p>
        </div>
        <p style="color: #667eea; font-weight: bold;">
          🚀 Tu aplicación ahora usa Supabase y nunca más perderás datos
        </p>
      `,
      icon: 'success',
      confirmButtonText: '¡Perfecto!',
      confirmButtonColor: '#667eea'
    });
    
    // Recargar la aplicación para usar Supabase
    location.reload();
    
  } catch (error) {
    console.error('Error en migración:', error);
    
    await Swal.fire({
      ...gamingAlert,
      title: '❌ Error en la Migración',
      text: `No se pudo migrar a Supabase: ${error.message}`,
      icon: 'error',
      confirmButtonText: 'Entendido',
      confirmButtonColor: '#d33'
    });
    
  } finally {
    hideLoading();
    const migrateBtn = document.getElementById('migrate-supabase-btn');
    migrateBtn.disabled = false;
    migrateBtn.textContent = '🚀 Migrar a Supabase';
    hideLoading();
  }
}

// Crear/actualizar el gráfico de estadísticas
function updateStatsChart(stats) {
  const ctx = document.getElementById('statsChart').getContext('2d');
  
  // Destruir gráfico existente si hay uno
  if (statsChart) {
    statsChart.destroy();
  }
  
  statsChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Disponibles', 'Juegos Descargados', 'Juegos Completados'],
      datasets: [{
        data: [stats.available, stats.downloaded, stats.hidden],
        backgroundColor: [
          'rgba(112, 85, 163, 0.8)',   // Morado para disponibles
          'rgba(76, 175, 80, 0.8)',    // Verde para descargados
          'rgba(244, 67, 54, 0.8)'     // Rojo para ocultos
        ],
        borderColor: [
          'rgba(112, 85, 163, 1)',
          'rgba(76, 175, 80, 1)',
          'rgba(244, 67, 54, 1)'
        ],
        borderWidth: 2,
        hoverBackgroundColor: [
          'rgba(112, 85, 163, 1)',
          'rgba(76, 175, 80, 1)',
          'rgba(244, 67, 54, 1)'
        ]
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            color: '#b3b3b3',
            font: {
              family: 'Press Start 2P',
              size: 10
            },
            padding: 15
          }
        },
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.9)',
          titleColor: '#7055a3',
          bodyColor: '#b3b3b3',
          borderColor: '#3a0066',
          borderWidth: 1,
          cornerRadius: 8,
          displayColors: true
        }
      },
      animation: {
        animateRotate: true,
        animateScale: true
      }
    }
  });
}

// Funciones de utilidad
function showError(message) {
  hideLoading();
  Swal.fire({
    ...gamingAlert,
    title: '❌ Error',
    text: message,
    icon: 'error',
    confirmButtonText: 'Entendido'
  });
}

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function updateProgressBar() {
  const total = allGames.length;
  const remaining = remainingWords.length;
  const used = total - remaining;
  const pct = total > 0 ? (used / total) * 100 : 0;
  document.getElementById('progress-bar').style.width = pct + '%';
}

function updateWordCount() {
  document.getElementById('remaining-count').textContent = remainingWords.length;
}

// Busca la imagen en RAWG
async function fetchGameImage(gameName) {
  const url = `https://api.rawg.io/api/games?key=${apiKey}&search=${encodeURIComponent(gameName)}`;
  try {
    const res = await fetch(url);
    const data = await res.json();
    return data.results?.[0]?.background_image || null;
  } catch (e) {
    console.error('RAWG error:', e);
    return null;
  }
}

// Obtener información completa del juego desde RAWG
async function fetchGameInfo(gameName) {
  const url = `https://api.rawg.io/api/games?key=${apiKey}&search=${encodeURIComponent(gameName)}`;
  try {
    const res = await fetch(url);
    const data = await res.json();
    const game = data.results?.[0];
    
    if (!game) return null;
    
    return {
      name: game.name,
      image: game.background_image,
      rating: game.rating,
      ratingTop: game.rating_top,
      released: game.released,
      platforms: game.platforms?.map(p => p.platform.name) || [],
      genres: game.genres?.map(g => g.name) || [],
      description: game.description_raw || '',
      metacritic: game.metacritic,
      website: game.website,
      slug: game.slug,
      id: game.id
    };
  } catch (e) {
    console.error('RAWG error:', e);
    return null;
  }
}

function scheduleImageLoad(word) {
  clearTimeout(imageTimeout);
  imageTimeout = setTimeout(async () => {
    const imgEl = document.getElementById('game-img');
    const url = await fetchGameImage(word);

    if (url) {
      imgEl.src = url;
      imgEl.alt = word;
      imgEl.onload = () => {
        imgEl.style.display = 'block';
        imgEl.style.opacity = '0';
        imgEl.classList.add('loaded');
        // Animación suave de entrada
        setTimeout(() => {
          imgEl.style.transition = 'opacity 0.6s ease-in';
          imgEl.style.opacity = '1';
        }, 50);
      };
      imgEl.onerror = () => {
        imgEl.style.display = 'none';
      };
    } else {
      imgEl.style.display = 'none';
      imgEl.alt = 'No encontrada';
    }
  }, 1500);
}

// Función principal para mostrar palabra aleatoria
async function showRandomWord() {
  try {
    // Verificar si hay juegos disponibles
    if (remainingWords.length === 0) {
      Swal.fire({
        ...gamingAlert,
        title: '🎮 ¡No hay juegos disponibles!',
        text: 'Todos los juegos han sido mostrados. Usa "Reiniciar Lista" para empezar de nuevo.',
        icon: 'info',
        confirmButtonText: 'Entendido'
      });
      return;
    }

    // Animación de transición - ocultar palabra actual
    const txtEl = document.getElementById('random-word');
    const wordContainer = document.getElementById('word-container');
    
    // Efecto de fade out
    txtEl.style.transition = 'opacity 0.3s ease-out, transform 0.3s ease-out';
    txtEl.style.opacity = '0';
    txtEl.style.transform = 'translateY(-20px)';
    
    // Elegir un juego aleatorio de remainingWords
    const randomIndex = Math.floor(Math.random() * remainingWords.length);
    const gameName = remainingWords[randomIndex];
    
    // Actualizar variables
    currentWord = gameName;
    usedWords.push(gameName);
    remainingWords.splice(randomIndex, 1);
    
    // Registrar en historial con fecha
    const historyEntry = {
      name: gameName,
      date: new Date().toISOString(),
      timestamp: Date.now()
    };
    gameHistory.push(historyEntry);
    
    // Mantener solo últimos 1000 registros para no sobrecargar
    if (gameHistory.length > 1000) {
      gameHistory = gameHistory.slice(-1000);
    }
    
    // Guardar en localStorage
    try {
      localStorage.setItem('gameHistory', JSON.stringify(gameHistory));
    } catch (e) {
      console.warn('No se pudo guardar historial:', e);
    }
    
    // Obtener información completa del juego
    currentGameInfo = null;
    fetchGameInfo(gameName).then(info => {
      currentGameInfo = info;
      // Habilitar botón de info si hay información
      const infoBtn = document.getElementById('info-btn');
      if (info && infoBtn) {
        infoBtn.disabled = false;
      }
    });

    // Esperar un poco antes de mostrar el nuevo juego
    setTimeout(() => {
      // Mostrar nuevo texto con animación
      txtEl.textContent = gameName;
      txtEl.style.opacity = '0';
      txtEl.style.transform = 'translateY(20px)';
      txtEl.classList.add('visible');
      
      // Efecto glow en el contenedor
      wordContainer.classList.add('glow-effect');
      setTimeout(() => {
        wordContainer.classList.remove('glow-effect');
      }, 2000);
      
      // Animación de entrada
      setTimeout(() => {
        txtEl.style.transition = 'opacity 0.5s ease-out, transform 0.5s ease-out';
        txtEl.style.opacity = '1';
        txtEl.style.transform = 'translateY(0)';
      }, 50);
    }, 300);

    // Habilitar el botón de agregar a descargas con animación
    const addBtn = document.getElementById('add-word-btn');
    addBtn.disabled = false;
    addBtn.classList.add('pulse-effect');
    setTimeout(() => {
      addBtn.classList.remove('pulse-effect');
    }, 1000);
    
    // Habilitar botón de info (se deshabilitará si no hay info)
    const infoBtn = document.getElementById('info-btn');
    if (infoBtn) {
      infoBtn.disabled = true; // Se habilitará cuando cargue la info
    }

    // Limpiar y ocultar la imagen antigua
    const imgEl = document.getElementById('game-img');
    imgEl.classList.remove('loaded');
    imgEl.src = '';
    imgEl.alt = '';
    imgEl.style.display = 'none';

    // Programar la petición de imagen tras 1.5s sin más clicks
    scheduleImageLoad(gameName);

    // Actualizar UI
    updateWordCount();
    updateProgressBar();
    document.getElementById('current-word-number').textContent = usedWords.length;

  } catch (error) {
    showError('Error mostrando juego aleatorio: ' + error.message);
  }
}

// Agregar la palabra actual a la lista de descargas
async function addCurrentWordToDownloadList() {
  if (!currentWord) {
    showError('No hay ningún juego seleccionado');
    return;
  }

  try {
    await markAsDownloaded(currentWord);
    
    // Actualizar listas locales
    downloadList.push({
      name: currentWord,
      download_date: new Date().toISOString()
    });
    
    // Remover de remainingWords (ya se hizo en showRandomWord, pero por seguridad)
    remainingWords = remainingWords.filter(word => word !== currentWord);
    
    // Actualizar UI
    updateWordCount();
    updateProgressBar();
    document.getElementById('add-word-btn').disabled = true;
    
    // Actualizar estadísticas
    await fetchStats();
    
    // Mostrar notificación
    Swal.fire({
      ...gamingAlert,
      title: '✅ ¡Agregado Exitosamente!',
      html: `<strong>"${currentWord}"</strong><br><br>Agregado a la lista de descargas.`,
      icon: 'success',
      confirmButtonText: 'Genial',
      timer: 3000,
      timerProgressBar: true
    });
    
    // Limpiar palabra actual
    currentWord = "";
    document.getElementById('random-word').textContent = "";
    
  } catch (error) {
    showError('Error agregando a descargas: ' + error.message);
  }
}

// Mostrar el modal de descargas
async function showDownloadModal() {
  try {
    showLoading('Cargando lista de descargas...');
    await fetchDownloads();
    updateDownloadTable();
    hideLoading();
    document.getElementById('downloadModal').style.display = 'flex';
  } catch (error) {
    hideLoading();
    showError('Error cargando descargas: ' + error.message);
  }
}

// Cerrar el modal de descargas
function closeDownloadModal() {
  document.getElementById('downloadModal').style.display = 'none';
}

// Actualizar la tabla de descargas en el modal
function updateDownloadTable() {
  const noMessage = document.getElementById('no-downloads-message');
  const tableContainer = document.getElementById('download-table-container');
  const tbody = document.getElementById('download-table-body');
  
  if (downloadList.length === 0) {
    noMessage.style.display = 'block';
    tableContainer.style.display = 'none';
    return;
  }
  
  noMessage.style.display = 'none';
  tableContainer.style.display = 'block';
  
  tbody.innerHTML = '';
  downloadList.forEach((download, index) => {
    const row = document.createElement('div');
    row.className = 'table-row';
    row.innerHTML = `
      <div class="table-cell">${index + 1}</div>
      <div class="table-cell">${download.name}</div>
      <div class="table-cell actions-cell">
        <div class="actions-stack">
          <button class="danger-btn small-btn" onclick="removeFromDownloadList('${download.name}')">
            Restaurar
          </button>
          <button class="delete-btn small-btn" onclick="hideGamePermanently('${download.name}')">
            Eliminar
          </button>
        </div>
      </div>
    `;
    tbody.appendChild(row);
  });
}

// Reiniciar la lista de palabras usadas COMPLETAMENTE (desde 0)
async function resetWords() {
  const result = await Swal.fire({
    ...gamingAlert,
    title: '🔄 ¿Reiniciar Completamente?',
    text: 'Esto reiniciará todo desde 0: contador de palabras, interfaz y recargará los juegos desde la base de datos. Los juegos descargados permanecerán en tu lista.',
    icon: 'question',
    showCancelButton: true,
    confirmButtonText: '✅ Sí, Reiniciar Todo',
    cancelButtonText: '❌ Cancelar',
    reverseButtons: true
  });

  if (result.isConfirmed) {
    try {
      showLoading('Reiniciando aplicación...');
      
      // Reiniciar COMPLETAMENTE todas las variables
      usedWords = [];
      currentWord = "";
      
      // Recargar juegos desde la base de datos
      await fetchGames();
      
      // Limpiar interfaz completamente
      document.getElementById('random-word').textContent = '';
      document.getElementById('current-word-number').textContent = '0';
      document.getElementById('add-word-btn').disabled = true;
      
      // Limpiar imagen
      clearTimeout(imageTimeout);
      const imgEl = document.getElementById('game-img');
      imgEl.src = '';
      imgEl.alt = '';
      imgEl.classList.remove('loaded');

      // Actualizar UI
      updateWordCount();
      updateProgressBar();
      
      hideLoading();
      
      Swal.fire({
        ...gamingAlert,
        title: '✅ ¡Aplicación Reiniciada!',
        text: 'Todo se ha reiniciado desde 0. Los datos están actualizados desde la base de datos.',
        icon: 'success',
        confirmButtonText: 'Perfecto',
        timer: 3000,
        timerProgressBar: true
      });
    } catch (error) {
      hideLoading();
      showError('Error reiniciando la aplicación: ' + error.message);
    }
  }
}

// Eliminar juego de la lista de descargas
async function removeFromDownloadList(gameName) {
  try {
    const result = await Swal.fire({
      ...gamingAlert,
      title: '↩️ ¿Restaurar Juego?',
      html: `<strong>"${gameName}"</strong><br><br>¿Quieres restaurar este juego para que esté disponible nuevamente?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: '↩️ Sí, Restaurar',
      cancelButtonText: '❌ Cancelar',
      reverseButtons: true
    });

    if (result.isConfirmed) {
      await restoreGame(gameName);
      
      // Actualizar listas locales
      downloadList = downloadList.filter(d => d.name !== gameName);
      
      // Solo agregar a remainingWords si no está ya en usedWords (para evitar duplicados)
      if (!usedWords.includes(gameName)) {
        remainingWords.push(gameName);
      }
      
      // Actualizar UI
      updateWordCount();
      updateProgressBar();
      updateDownloadTable();
      
      Swal.fire({
        ...gamingAlert,
        title: '↩️ ¡Juego Restaurado!',
        html: `<strong>"${gameName}"</strong><br><br>Ha sido restaurado y está disponible nuevamente.`,
        icon: 'success',
        confirmButtonText: 'Perfecto',
        timer: 3000,
        timerProgressBar: true
      });
    }
  } catch (error) {
    showError('Error restaurando juego: ' + error.message);
  }
}

// Ocultar juego permanentemente (cambiar estado a 3)
async function hideGamePermanently(gameName) {
  try {
    const result = await Swal.fire({
      ...gamingAlert,
      title: '🗑️ ¿Eliminar Permanentemente?',
      html: `<strong>"${gameName}"</strong><br><br>⚠️ <strong>ATENCIÓN:</strong> Esta acción es irreversible.<br><br>El juego será ocultado permanentemente y no aparecerá más en ninguna lista.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: '🗑️ Sí, Eliminar',
      cancelButtonText: '❌ Cancelar',
      reverseButtons: true,
      confirmButtonColor: '#dc143c'
    });

    if (result.isConfirmed) {
      showLoading('Eliminando juego permanentemente...');
      
      const response = await fetch(`${API_BASE_URL}/api/games/${encodeURIComponent(gameName)}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error eliminando juego');
      }
      
      const result = await response.json();
      hideLoading();
      
      // Actualizar listas locales
      downloadList = downloadList.filter(d => d.name !== gameName);
      
      // Actualizar UI
      updateDownloadTable();
      
      Swal.fire({
        ...gamingAlert,
        title: '🗑️ ¡Juego Eliminado!',
        html: `<strong>"${gameName}"</strong><br><br>Ha sido eliminado permanentemente de todas las listas.`,
        icon: 'success',
        confirmButtonText: 'Entendido',
        timer: 3000,
        timerProgressBar: true
      });
    }
  } catch (error) {
    hideLoading();
    showError('Error eliminando juego: ' + error.message);
  }
}

// Agregar nueva palabra al diccionario
async function addNewWordToDictionary(newWord) {
  try {
    await addGameToDatabase(newWord);
    
    // Actualizar listas locales
    allGames.push({ name: newWord, status: 'available' });
    
    // Solo agregar a remainingWords si no está ya en usedWords (para evitar duplicados)
    if (!usedWords.includes(newWord)) {
      remainingWords.push(newWord);
    }
    
    // Actualizar UI
    updateWordCount();
    updateProgressBar();
    
    Swal.fire({
      ...gamingAlert,
      title: '✅ ¡Palabra Agregada!',
      html: `<strong>"${newWord}"</strong><br><br>Se agregó exitosamente al diccionario.`,
      icon: 'success',
      confirmButtonText: 'Excelente',
      timer: 3000,
      timerProgressBar: true
    });
    
  } catch (error) {
    if (error.message === 'El juego ya existe') {
      Swal.fire({
        ...gamingAlert,
        title: '⚠️ Juego Duplicado',
        text: 'Este juego ya existe en la base de datos.',
        icon: 'warning',
        confirmButtonText: 'Entendido'
      });
    } else {
      showError('Error agregando juego: ' + error.message);
    }
  }
}

// Función para agregar nueva palabra
function addNewWord() {
  Swal.fire({
    ...gamingAlert,
    title: '🎮 Agregar Nuevo Juego',
    html: `
      <input type="text" id="new-word-input" class="swal2-input" placeholder="Nombre del juego" style="background: #1a1a1a; color: #b3b3b3; border: 2px solid #3a0066;">
    `,
    showCancelButton: true,
    confirmButtonText: 'Agregar',
    cancelButtonText: 'Cancelar',
    reverseButtons: true,
    focusConfirm: false,
    preConfirm: () => {
      const input = document.getElementById('new-word-input');
      const value = input.value.trim().toUpperCase();
      
      console.log('🎯 Modal - Input encontrado:', input);
      console.log('🎯 Modal - Valor obtenido:', value);
      console.log('🎯 Modal - Longitud:', value.length);
      
      if (!value) {
        Swal.showValidationMessage('Por favor ingresa un nombre válido');
        return false;
      }
      
      if (value.length < 3) {
        Swal.showValidationMessage('El nombre debe tener al menos 3 caracteres');
        return false;
      }
      
      return value;
    }
  }).then((result) => {
    if (result.isConfirmed) {
      addNewWordToDictionary(result.value);
    }
  });
}

// Inicializar la aplicación
async function initializeApp() {
  try {
    showLoading('Inicializando aplicación...');
    
    // Cargar historial desde localStorage
    loadGameHistory();
    
    // Cargar juegos desde la base de datos
    await fetchGames();
    
    // Si no hay juegos, preguntar si quiere poblar la base de datos
    if (allGames.length === 0) {
      hideLoading();
      const result = await Swal.fire({
        ...gamingAlert,
        title: '🎮 Base de Datos Vacía',
        text: '¿Quieres poblar la base de datos con los juegos predeterminados?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: '✅ Sí, Poblar',
        cancelButtonText: '❌ No, Mantener Vacía',
        reverseButtons: true
      });
      
      if (result.isConfirmed) {
        const populated = await populateDatabase();
        await fetchGames();
        Swal.fire({
          ...gamingAlert,
          title: '✅ ¡Base de Datos Poblada!',
          text: populated.message,
          icon: 'success',
          confirmButtonText: 'Perfecto',
          timer: 3000,
          timerProgressBar: true
        });
      }
    }
    
    // Cargar descargas
    showLoading('Cargando historial de descargas...');
    await fetchDownloads();
    
    // Cargar estadísticas
    showLoading('Cargando estadísticas...');
    await fetchStats();
    
    // Ocultar loading
    hideLoading();
    
    // Verificar cuántos juegos descargados hay y mostrar alerta si es necesario
    const downloadedGamesCount = downloadList.filter(game => game.status === 2).length;
    
    if (downloadedGamesCount > 0) {
      // Mostrar alerta centrada con mejor diseño
      Swal.fire({
        ...gamingAlert,
        title: '📦 ¡Juegos Descargados Disponibles!',
        html: `
          <div style="text-align: center; padding: 20px 0;">
            <div style="font-size: 3em; margin: 15px 0; animation: bounce 2s infinite;">📦</div>
            <div style="background: linear-gradient(135deg, rgba(58, 0, 102, 0.3), rgba(112, 85, 163, 0.2)); padding: 15px; border-radius: 10px; border: 1px solid #3a0066; margin: 15px 0;">
              <p style="font-size: 1.2em; margin: 10px 0; color: #7055a3;"><strong>${downloadedGamesCount}</strong> juego${downloadedGamesCount !== 1 ? 's' : ''} descargado${downloadedGamesCount !== 1 ? 's' : ''}</p>
            </div>
            <p style="font-size: 0.9em; color: #b3b3b3; margin: 15px 0;">Usa el botón <strong>"Ver Descargas"</strong> para gestionarlos</p>
            <div style="background: rgba(58, 0, 102, 0.2); padding: 10px; border-radius: 8px; border: 1px solid #3a0066; margin-top: 15px;">
              <p style="font-size: 0.8em; color: #888; margin: 0;">💡 Puedes restaurar juegos o eliminarlos permanentemente</p>
            </div>
          </div>
        `,
        icon: 'info',
        confirmButtonText: '🎮 Ver Descargas',
        cancelButtonText: 'Cerrar',
        showCancelButton: true,
        reverseButtons: true,
        timer: 8000,
        timerProgressBar: true,
        width: '450px',
        customClass: {
          ...gamingAlert.customClass,
          popup: 'gaming-popup downloaded-alert'
        }
      }).then((result) => {
        if (result.isConfirmed) {
          showDownloadModal();
        }
      });
    }
  } catch (error) {
    hideLoading();
    console.error('Error inicializando aplicación:', error);
    showError('Error inicializando la aplicación');
  }
}

// Inicializar cuando se carga la página
document.addEventListener('DOMContentLoaded', () => {
  initializeApp();
  
  // Event listener para el formulario de agregar nuevas palabras
  document.getElementById('add-word-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const input = document.getElementById('form-word-input');
    const value = input.value.trim().toUpperCase();
    
    console.log('📝 Formulario - Valor obtenido:', value);
    console.log('📝 Formulario - Longitud:', value.length);
    
    if (value && value.length >= 3) {
      addNewWordToDictionary(value);
      input.value = ''; // Limpiar el input después de agregar
    } else {
      showError('Por favor ingresa un nombre válido de al menos 3 caracteres');
    }
  });
  
  // Event listener para búsqueda con Enter
  document.getElementById('search-input').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      searchGames();
    }
  });
  
  // Event listener para búsqueda en tiempo real (opcional)
  let searchTimeout;
  let isSearching = false;
  document.getElementById('search-input').addEventListener('input', (e) => {
    clearTimeout(searchTimeout);
    const searchTerm = e.target.value.trim();
    
    if (searchTerm.length >= 3) {
      // Búsqueda automática después de 800ms de inactividad (más suave)
      searchTimeout = setTimeout(() => {
        if (!isSearching) {
          isSearching = true;
          searchGames(false).finally(() => { // false = no mostrar warning si está vacío
            isSearching = false;
          });
        }
      }, 800);
    } else if (searchTerm.length === 0) {
      // Limpiar resultados si el campo está vacío
      clearSearch();
    }
  });
});

// Cerrar modal cuando se hace clic fuera de él
document.addEventListener('click', (e) => {
  if (e.target.id === 'downloadModal') {
    closeDownloadModal();
  }
  if (e.target.id === 'gameInfoModal') {
    closeGameInfoModal();
  }
});

// ------ FUNCIONES DEL BUSCADOR ------

// Establecer filtro de búsqueda
function setSearchFilter(status) {
  currentSearchFilter = status;
  
  // Actualizar botones activos
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.classList.remove('active');
    if (btn.getAttribute('data-status') === status) {
      btn.classList.add('active');
    }
  });
  
  // Si hay resultados mostrados, volver a buscar con el filtro
  const searchInput = document.getElementById('search-input');
  if (searchInput.value.trim()) {
    searchGames();
  }
}

// Buscar juegos en la base de datos
async function searchGames(showEmptyWarning = true) {
  const searchInput = document.getElementById('search-input');
  const searchTerm = searchInput.value.trim();
  
  if (!searchTerm) {
    if (showEmptyWarning) {
      Swal.fire({
        ...gamingAlert,
        title: '⚠️ Campo Vacío',
        text: 'Por favor ingresa un término de búsqueda.',
        icon: 'warning',
        confirmButtonText: 'Entendido'
      });
    }
    return;
  }
  
  try {
    showLoading('Buscando juegos...');
    
    const response = await fetch(`${API_BASE_URL}/api/search?q=${encodeURIComponent(searchTerm)}`);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error en la búsqueda');
    }
    
    const data = await response.json();
    hideLoading();
    
    // Aplicar filtro de estado si no es "all"
    let filteredResults = data.results;
    if (currentSearchFilter !== 'all') {
      const filterStatus = parseInt(currentSearchFilter);
      filteredResults = data.results.filter(game => game.status === filterStatus);
    }
    
    displaySearchResults(filteredResults, filteredResults.length, data.searchTerm);
    
  } catch (error) {
    hideLoading();
    console.error('Error:', error);
    showError('Error buscando juegos: ' + error.message);
  }
}

// Mostrar resultados de búsqueda
function displaySearchResults(results, count, searchTerm) {
  const searchResults = document.getElementById('search-results');
  const searchCount = document.getElementById('search-count');
  const searchTableBody = document.getElementById('search-table-body');
  
  // Actualizar contador
  searchCount.textContent = `${count} juego${count !== 1 ? 's' : ''} encontrado${count !== 1 ? 's' : ''}`;
  
  // Limpiar tabla anterior
  searchTableBody.innerHTML = '';
  
  if (count === 0) {
    // Mostrar mensaje de no resultados
    searchTableBody.innerHTML = `
      <div class="table-row">
        <div class="table-cell" style="width: 100%; text-align: center; padding: 20px; color: #888;">
          No se encontraron juegos que coincidan con "${searchTerm}"
        </div>
      </div>
    `;
  } else {
    // Mostrar resultados
    results.forEach((game, index) => {
      const row = document.createElement('div');
      row.className = 'table-row';
      
      // Determinar el estado del juego
      let statusText, statusClass;
      switch (game.status) {
        case 1:
          statusText = 'Disponible';
          statusClass = 'available';
          break;
        case 2:
          statusText = 'Descargado';
          statusClass = 'downloaded';
          break;
        case 3:
          statusText = 'Oculto';
          statusClass = 'hidden';
          break;
        default:
          statusText = 'Desconocido';
          statusClass = 'hidden';
      }
      
      row.innerHTML = `
        <div class="table-cell">${index + 1}</div>
        <div class="table-cell">${game.name}</div>
        <div class="table-cell">
          <span class="status-badge ${statusClass}">${statusText}</span>
        </div>
      `;
      
      searchTableBody.appendChild(row);
    });
  }
  
  // Mostrar resultados con animación suave
  searchResults.style.display = 'block';
  searchResults.style.opacity = '0';
  searchResults.style.transform = 'translateY(20px)';
  
  // Animar la aparición suavemente
  setTimeout(() => {
    searchResults.style.transition = 'all 0.4s ease-out';
    searchResults.style.opacity = '1';
    searchResults.style.transform = 'translateY(0)';
  }, 50);
}

// ------ FUNCIONES DE INFORMACIÓN DEL JUEGO ------

// Mostrar información del juego
async function showGameInfo() {
  if (!currentWord) {
    showError('No hay ningún juego seleccionado');
    return;
  }
  
  const modal = document.getElementById('gameInfoModal');
  const body = document.getElementById('game-info-body');
  const title = document.getElementById('game-info-title');
  
  modal.style.display = 'flex';
  body.innerHTML = '<div class="loading-info">Cargando información...</div>';
  title.textContent = currentWord;
  
  // Si ya tenemos la info, mostrarla, sino obtenerla
  let info = currentGameInfo;
  if (!info) {
    showLoading('Obteniendo información del juego...');
    info = await fetchGameInfo(currentWord);
    hideLoading();
    currentGameInfo = info;
  }
  
  if (!info) {
    body.innerHTML = `
      <div class="no-game-info">
        <p>No se encontró información adicional para este juego en RAWG.</p>
        <p style="font-size: 0.6rem; color: #888; margin-top: 10px;">
          Puedes buscar más información en <a href="https://rawg.io/search?query=${encodeURIComponent(currentWord)}" target="_blank" style="color: #7055a3;">RAWG.io</a>
        </p>
      </div>
    `;
    return;
  }
  
  // Formatear fecha de lanzamiento
  const releaseDate = info.released ? new Date(info.released).toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }) : 'No disponible';
  
  // Formatear rating
  const rating = info.rating ? info.rating.toFixed(1) : 'N/A';
  const ratingStars = '⭐'.repeat(Math.floor(info.rating || 0));
  
  // Formatear plataformas
  const platforms = info.platforms.length > 0 
    ? info.platforms.slice(0, 5).join(', ') + (info.platforms.length > 5 ? '...' : '')
    : 'No disponible';
  
  // Formatear géneros
  const genres = info.genres.length > 0 
    ? info.genres.join(', ')
    : 'No disponible';
  
  // Descripción (limitada a 500 caracteres)
  let description = info.description || 'No hay descripción disponible.';
  if (description.length > 500) {
    description = description.substring(0, 500) + '...';
  }
  
  body.innerHTML = `
    <div class="game-info-content">
      ${info.image ? `<img src="${info.image}" alt="${info.name}" class="game-info-image">` : ''}
      
      <div class="game-info-details">
        <div class="info-row">
          <span class="info-label">📅 Fecha de Lanzamiento:</span>
          <span class="info-value">${releaseDate}</span>
        </div>
        
        <div class="info-row">
          <span class="info-label">⭐ Rating:</span>
          <span class="info-value">${rating} ${ratingStars}</span>
          ${info.metacritic ? `<span class="metacritic-score">Metacritic: ${info.metacritic}</span>` : ''}
        </div>
        
        <div class="info-row">
          <span class="info-label">🎮 Plataformas:</span>
          <span class="info-value">${platforms}</span>
        </div>
        
        <div class="info-row">
          <span class="info-label">🏷️ Géneros:</span>
          <span class="info-value">${genres}</span>
        </div>
        
        ${description ? `
          <div class="info-row full-width">
            <span class="info-label">📝 Descripción:</span>
            <p class="info-description">${description}</p>
          </div>
        ` : ''}
        
        ${info.website ? `
          <div class="info-row">
            <span class="info-label">🌐 Sitio Web:</span>
            <a href="${info.website}" target="_blank" class="info-link">Visitar sitio oficial</a>
          </div>
        ` : ''}
        
        <div class="info-row">
          <span class="info-label">🔗 Ver en RAWG:</span>
          <a href="https://rawg.io/games/${info.slug || info.id}" target="_blank" class="info-link">Abrir en RAWG.io</a>
        </div>
      </div>
    </div>
  `;
}

// Cerrar modal de información
function closeGameInfoModal() {
  document.getElementById('gameInfoModal').style.display = 'none';
}

// ------ FUNCIONES DE CALENDARIO ------

let currentCalendarDate = new Date();

// Cargar historial desde localStorage
function loadGameHistory() {
  try {
    const saved = localStorage.getItem('gameHistory');
    if (saved) {
      gameHistory = JSON.parse(saved);
    }
  } catch (e) {
    console.warn('Error cargando historial:', e);
    gameHistory = [];
  }
}

// Mostrar vista de calendario
function showCalendarView() {
  const calendarView = document.getElementById('calendar-view');
  const isVisible = calendarView.style.display !== 'none';
  
  if (isVisible) {
    calendarView.style.display = 'none';
  } else {
    calendarView.style.display = 'block';
    renderCalendar();
  }
}

// Renderizar calendario
function renderCalendar() {
  const year = currentCalendarDate.getFullYear();
  const month = currentCalendarDate.getMonth();
  
  // Actualizar título
  const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  document.getElementById('calendar-month-year').textContent = `${monthNames[month]} ${year}`;
  
  // Obtener primer día del mes y número de días
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  
  // Agrupar juegos por fecha
  const gamesByDate = {};
  gameHistory.forEach(entry => {
    const date = new Date(entry.date);
    if (date.getFullYear() === year && date.getMonth() === month) {
      const day = date.getDate();
      if (!gamesByDate[day]) {
        gamesByDate[day] = [];
      }
      gamesByDate[day].push(entry);
    }
  });
  
  // Crear grid del calendario
  const grid = document.getElementById('calendar-grid');
  grid.innerHTML = '';
  
  // Días de la semana
  const weekDays = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  weekDays.forEach(day => {
    const dayHeader = document.createElement('div');
    dayHeader.className = 'calendar-day-header';
    dayHeader.textContent = day;
    grid.appendChild(dayHeader);
  });
  
  // Espacios vacíos antes del primer día
  for (let i = 0; i < firstDay; i++) {
    const emptyDay = document.createElement('div');
    emptyDay.className = 'calendar-day empty';
    grid.appendChild(emptyDay);
  }
  
  // Días del mes
  for (let day = 1; day <= daysInMonth; day++) {
    const dayElement = document.createElement('div');
    dayElement.className = 'calendar-day';
    
    const games = gamesByDate[day] || [];
    const gameCount = games.length;
    
    if (gameCount > 0) {
      dayElement.classList.add('has-games');
      const intensity = Math.min(gameCount, 6);
      dayElement.style.background = `rgba(112, 85, 163, ${0.4 + (intensity * 0.1)})`;
      dayElement.style.borderColor = '#7055a3';
      
      // Tooltip con lista de juegos
      const gameNames = games.map(g => g.name).join(', ');
      dayElement.title = `${gameCount} juego${gameCount > 1 ? 's' : ''}: ${gameNames}`;
      
      dayElement.innerHTML = `
        <span class="day-number">${day}</span>
        <span class="game-count">${gameCount}</span>
      `;
      
      // Click para ver detalles
      dayElement.onclick = () => showDayDetails(day, games);
    } else {
      dayElement.innerHTML = `<span class="day-number">${day}</span>`;
    }
    
    // Marcar día actual
    const today = new Date();
    if (day === today.getDate() && month === today.getMonth() && year === today.getFullYear()) {
      dayElement.classList.add('today');
    }
    
    grid.appendChild(dayElement);
  }
}

// Mostrar detalles de un día
function showDayDetails(day, games) {
  const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  const month = monthNames[currentCalendarDate.getMonth()];
  const year = currentCalendarDate.getFullYear();
  
  const gamesList = games.map(g => {
    const date = new Date(g.date);
    const time = date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    return `<li><strong>${g.name}</strong> - ${time}</li>`;
  }).join('');
  
  Swal.fire({
    ...gamingAlert,
    title: `📅 ${day} de ${month} ${year}`,
    html: `
      <p style="margin-bottom: 15px;"><strong>${games.length}</strong> juego${games.length > 1 ? 's' : ''} generado${games.length > 1 ? 's' : ''}</p>
      <ul style="text-align: left; list-style: none; padding: 0;">
        ${gamesList}
      </ul>
    `,
    icon: 'info',
    confirmButtonText: 'Cerrar'
  });
}

// Navegar meses
function previousMonth() {
  currentCalendarDate.setMonth(currentCalendarDate.getMonth() - 1);
  renderCalendar();
}

function nextMonth() {
  currentCalendarDate.setMonth(currentCalendarDate.getMonth() + 1);
  renderCalendar();
}

// Limpiar búsqueda
function clearSearch() {
  const searchInput = document.getElementById('search-input');
  const searchResults = document.getElementById('search-results');
  
  // Animar la desaparición suavemente
  searchResults.style.transition = 'all 0.3s ease-in';
  searchResults.style.opacity = '0';
  searchResults.style.transform = 'translateY(-10px)';
  
  setTimeout(() => {
    searchResults.style.display = 'none';
    searchResults.style.opacity = '';
    searchResults.style.transform = '';
    searchResults.style.transition = '';
  }, 300);
  
  searchInput.value = '';
  // Resetear filtro a "all"
  setSearchFilter('all');
  searchInput.focus();
}

// ------ FUNCIONES DE EXPORTAR/IMPORTAR ------

// Exportar datos a JSON
async function exportData() {
  try {
    showLoading('Preparando exportación...');
    
    // Obtener todos los datos
    const [availableGames, downloadsData, statsData] = await Promise.all([
      fetch(`${API_BASE_URL}/api/games`).then(r => r.json()),
      fetch(`${API_BASE_URL}/api/downloads`).then(r => r.json()),
      fetch(`${API_BASE_URL}/api/stats`).then(r => r.json())
    ]);
    
    // Combinar todos los juegos (disponibles + descargados)
    const allGames = [
      ...availableGames.map(g => ({ ...g, status: 1 })),
      ...downloadsData.map(g => ({ ...g, status: 2 }))
    ];
    
    const exportData = {
      version: '1.0',
      exportDate: new Date().toISOString(),
      stats: statsData,
      games: allGames,
      downloads: downloadsData,
      metadata: {
        totalGames: statsData.total,
        availableGames: statsData.available,
        downloadedGames: statsData.downloaded,
        hiddenGames: statsData.hidden
      }
    };
    
    // Crear y descargar archivo JSON
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    const fileName = `juegos-export-${new Date().toISOString().split('T')[0]}.json`;
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    hideLoading();
    
    Swal.fire({
      ...gamingAlert,
      title: '✅ ¡Exportación Exitosa!',
      html: `
        <p>Se exportaron <strong>${exportData.metadata.totalGames}</strong> juegos</p>
        <p style="font-size: 0.6rem; color: #888;">Archivo: <code>${fileName}</code></p>
      `,
      icon: 'success',
      confirmButtonText: 'Perfecto',
      timer: 3000,
      timerProgressBar: true
    });
    
  } catch (error) {
    hideLoading();
    console.error('Error exportando:', error);
    showError('Error exportando datos: ' + error.message);
  }
}

// Importar datos
function importData() {
  document.getElementById('import-file-input').click();
}

// Manejar importación de archivo
async function handleFileImport(event) {
  const file = event.target.files[0];
  if (!file) return;
  
  try {
    showLoading('Leyendo archivo...');
    
    const fileText = await file.text();
    let importData;
    
    // Intentar parsear como JSON
    try {
      importData = JSON.parse(fileText);
    } catch (e) {
      throw new Error('El archivo no es un JSON válido');
    }
    
    // Validar estructura
    if (!importData.games || !Array.isArray(importData.games)) {
      throw new Error('El archivo no tiene la estructura correcta');
    }
    
    hideLoading();
    
    // Confirmar importación
    const result = await Swal.fire({
      ...gamingAlert,
      title: '📤 ¿Importar Datos?',
      html: `
        <p>Se importarán <strong>${importData.games.length}</strong> juegos</p>
        <p style="color: #dc143c; font-size: 0.7rem; margin-top: 15px;">
          ⚠️ <strong>ADVERTENCIA:</strong> Esto agregará los juegos a tu base de datos actual.
          Los juegos duplicados serán ignorados.
        </p>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: '✅ Sí, Importar',
      cancelButtonText: '❌ Cancelar',
      reverseButtons: true
    });
    
    if (!result.isConfirmed) {
      event.target.value = ''; // Resetear input
      return;
    }
    
    showLoading('Importando juegos...');
    
    // Importar juegos uno por uno
    let successCount = 0;
    let errorCount = 0;
    let duplicateCount = 0;
    
    for (const game of importData.games) {
      try {
        const response = await fetch(`${API_BASE_URL}/api/games`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ gameName: game.name })
        });
        
        if (response.ok) {
          successCount++;
        } else {
          const errorData = await response.json();
          if (errorData.error && errorData.error.includes('ya existe')) {
            duplicateCount++;
          } else {
            errorCount++;
          }
        }
      } catch (err) {
        errorCount++;
      }
    }
    
    hideLoading();
    
    // Recargar datos
    await fetchGames();
    await fetchStats();
    
    Swal.fire({
      ...gamingAlert,
      title: '✅ ¡Importación Completada!',
      html: `
        <div style="text-align: left; margin: 20px 0;">
          <p><strong>✅ Importados:</strong> ${successCount} juegos</p>
          <p><strong>⚠️ Duplicados:</strong> ${duplicateCount} juegos</p>
          ${errorCount > 0 ? `<p><strong>❌ Errores:</strong> ${errorCount} juegos</p>` : ''}
        </div>
      `,
      icon: 'success',
      confirmButtonText: 'Perfecto',
      timer: 4000,
      timerProgressBar: true
    });
    
    // Resetear input
    event.target.value = '';
    
  } catch (error) {
    hideLoading();
    console.error('Error importando:', error);
    showError('Error importando datos: ' + error.message);
    event.target.value = ''; // Resetear input
  }
}


