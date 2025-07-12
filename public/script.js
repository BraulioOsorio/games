// Configuración de la API
const API_BASE_URL = window.location.origin;

// Variables globales
let currentWord = "";
let allGames = [];
let downloadList = [];
let usedWords = [];
let remainingWords = [];

const apiKey = 'c6beb639913a47a8b4148f99ab751619';
let imageTimeout;

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
    const response = await fetch(`${API_BASE_URL}/api/games`);
    if (!response.ok) throw new Error('Error obteniendo juegos');
    const games = await response.json();
    allGames = games;
    remainingWords = games.map(game => game.name);
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
    const response = await fetch(`${API_BASE_URL}/api/games`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name: gameName })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error agregando juego');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
}

async function markAsDownloaded(gameName) {
  try {
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
    
    return await response.json();
  } catch (error) {
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
    const response = await fetch(`${API_BASE_URL}/api/downloads/${encodeURIComponent(gameName)}`, {
      method: 'DELETE'
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error restaurando juego');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
}

async function populateDatabase() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/populate`, {
      method: 'POST'
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error poblando base de datos');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
}

// Funciones de utilidad
function showError(message) {
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

function scheduleImageLoad(word) {
  clearTimeout(imageTimeout);
  imageTimeout = setTimeout(async () => {
    const imgEl = document.getElementById('game-img');
    const url = await fetchGameImage(word);

    if (url) {
      imgEl.src = url;
      imgEl.alt = word;
      imgEl.onload = () => imgEl.classList.add('loaded');
    } else {
      imgEl.src = '';
      imgEl.alt = 'No encontrada';
    }
  }, 1500);
}

// Función principal para mostrar palabra aleatoria
async function showRandomWord() {
  try {
    const game = await getRandomGame();
    currentWord = game.name;
    usedWords.push(game.name);
    
    // Remover de remainingWords
    remainingWords = remainingWords.filter(word => word !== game.name);

    // Mostrar texto al instante
    const txtEl = document.getElementById('random-word');
    txtEl.textContent = game.name;
    txtEl.classList.add('visible');

    // Habilitar el botón de agregar a descargas
    document.getElementById('add-word-btn').disabled = false;

    // Limpiar y ocultar la imagen antigua
    const imgEl = document.getElementById('game-img');
    imgEl.classList.remove('loaded');
    imgEl.src = '';
    imgEl.alt = '';

    // Programar la petición de imagen tras 1.5s sin más clicks
    scheduleImageLoad(game.name);

    // Actualizar UI
    updateWordCount();
    updateProgressBar();
    document.getElementById('current-word-number').textContent = usedWords.length;

  } catch (error) {
    if (error.message === 'No hay juegos disponibles') {
      Swal.fire({
        ...gamingAlert,
        title: '🎮 ¡No hay juegos disponibles!',
        text: 'Todos los juegos han sido descargados o no hay juegos en la base de datos.',
        icon: 'info',
        confirmButtonText: 'Entendido'
      });
    } else {
      showError('Error obteniendo juego aleatorio: ' + error.message);
    }
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
      game_name: currentWord,
      download_date: new Date().toISOString()
    });
    
    // Remover de remainingWords
    remainingWords = remainingWords.filter(word => word !== currentWord);
    
    // Actualizar UI
    updateWordCount();
    updateProgressBar();
    document.getElementById('add-word-btn').disabled = true;
    
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
function showDownloadModal() {
  fetchDownloads().then(() => {
    updateDownloadTable();
    document.getElementById('downloadModal').style.display = 'flex';
  });
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
    const date = new Date(download.download_date).toLocaleDateString();
    row.innerHTML = `
      <div class="table-cell">${index + 1}</div>
      <div class="table-cell">${download.game_name}</div>
      <div class="table-cell">${date}</div>
      <div class="table-cell">
        <button class="danger-btn small-btn" onclick="removeFromDownloadList('${download.game_name}')">
          ↩️ Restaurar
        </button>
      </div>
    `;
    tbody.appendChild(row);
  });
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
      downloadList = downloadList.filter(d => d.game_name !== gameName);
      remainingWords.push(gameName);
      
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

// Agregar nueva palabra al diccionario
async function addNewWordToDictionary(newWord) {
  try {
    await addGameToDatabase(newWord);
    
    // Actualizar listas locales
    allGames.push({ name: newWord, status: 'available' });
    remainingWords.push(newWord);
    
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
    // Cargar juegos desde la base de datos
    await fetchGames();
    
    // Si no hay juegos, preguntar si quiere poblar la base de datos
    if (allGames.length === 0) {
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
    await fetchDownloads();
    
    console.log('✅ Aplicación inicializada correctamente');
    
  } catch (error) {
    console.error('Error inicializando aplicación:', error);
    showError('Error inicializando la aplicación');
  }
}

// Inicializar cuando se carga la página
document.addEventListener('DOMContentLoaded', initializeApp);

// Cerrar modal cuando se hace clic fuera de él
document.addEventListener('click', (e) => {
  if (e.target.id === 'downloadModal') {
    closeDownloadModal();
  }
});
