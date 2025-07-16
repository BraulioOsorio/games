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
    showLoading('Agregando juego a la base de datos...');
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

    // Elegir un juego aleatorio de remainingWords
    const randomIndex = Math.floor(Math.random() * remainingWords.length);
    const gameName = remainingWords[randomIndex];
    
    // Actualizar variables
    currentWord = gameName;
    usedWords.push(gameName);
    remainingWords.splice(randomIndex, 1);

    // Mostrar texto al instante
    const txtEl = document.getElementById('random-word');
    txtEl.textContent = gameName;
    txtEl.classList.add('visible');

    // Habilitar el botón de agregar a descargas
    document.getElementById('add-word-btn').disabled = false;

    // Limpiar y ocultar la imagen antigua
    const imgEl = document.getElementById('game-img');
    imgEl.classList.remove('loaded');
    imgEl.src = '';
    imgEl.alt = '';

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
    
    // Ocultar loading
    hideLoading();
    
    // Verificar cuántos juegos descargados hay y mostrar alerta si es necesario
    const downloadedGamesCount = downloadList.filter(game => game.status === 2).length;
    
    if (downloadedGamesCount > 0) {
      // Mostrar alerta flotante con el conteo
      Swal.fire({
        ...gamingAlert,
        title: '📥 Juegos Descargados Encontrados',
        html: `
          <div style="text-align: center;">
            <div style="font-size: 2em; margin: 10px 0;">📦</div>
            <p><strong>${downloadedGamesCount}</strong> juego${downloadedGamesCount >= 1 ? 's' : ''} descargado${downloadedGamesCount >= 1 ? 's' : ''}</p>
            <p style="font-size: 0.9em; color: #888;">Usa el botón "Ver Descargas" para gestionarlos</p>
          </div>
        `,
        icon: 'info',
        confirmButtonText: 'Entendido',
        timer: 4000,
        timerProgressBar: true,
        showConfirmButton: false,
        toast: true,
        position: 'top-end',
        width: '300px'
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
    const input = document.getElementById('new-word-input');
    const value = input.value.trim().toUpperCase();
    
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
  document.getElementById('search-input').addEventListener('input', (e) => {
    clearTimeout(searchTimeout);
    const searchTerm = e.target.value.trim();
    
    if (searchTerm.length >= 2) {
      // Búsqueda automática después de 500ms de inactividad
      searchTimeout = setTimeout(() => {
        searchGames();
      }, 500);
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
});

// ------ FUNCIONES DEL BUSCADOR ------

// Buscar juegos en la base de datos
async function searchGames() {
  const searchInput = document.getElementById('search-input');
  const searchTerm = searchInput.value.trim();
  
  if (!searchTerm) {
    Swal.fire({
      ...gamingAlert,
      title: '⚠️ Campo Vacío',
      text: 'Por favor ingresa un término de búsqueda.',
      icon: 'warning',
      confirmButtonText: 'Entendido'
    });
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
    
    displaySearchResults(data.results, data.count, data.searchTerm);
    
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
  
  // Mostrar resultados
  searchResults.style.display = 'block';
  
  // Scroll suave hasta los resultados
  searchResults.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// Limpiar búsqueda
function clearSearch() {
  const searchInput = document.getElementById('search-input');
  const searchResults = document.getElementById('search-results');
  
  searchInput.value = '';
  searchResults.style.display = 'none';
  searchInput.focus();
}


