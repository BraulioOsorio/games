const words = [
    "HALO WARS DEFINITIVE EDITION", "HALO WARS 2 ULTIMATE EDITION", "CYBERPUNK 2077","MARVEL'S SPIDER-MAN MILES MORALES","ASSASSIN'S CREED II DELUXE EDITION","ALAN WAKE II DELUXE EDITION","CALL OF DUTY VANGUARD",
    "CALL OF DUTY BLACK OPS II PLUTONIUM","JUST CAUSE 4 COMPLETE EDITION","ASSASSIN'S CREED ODYSSEY GOLD EDITION","BATMAN ARKHAM KNIGHT PREMIUM EDITION","MAFIA DEFINITIVE EDITION","MAFIA 2 DEFINITIVE EDITION","SAINTS ROW PLATINUM EDITION",
    "WOLFENSTEIN II THE NEW COLOSSUS","WATCH DOGS 2 DELUXE EDITION","TOM CLANCY'S GHOST RECON WILDLANDS GOLD EDITION","FAR CRY 6 GOLD EDITION","OUTPOST INFINITY SIEGE VANGUARD EDITION","DYING LIGHT 2 STAY HUMAN",
    "MARVEL SPIDER-MAN 2 DELUXE EDITION","DEAD SPACE 2","ROBOCOP ROGUE CITY","ASSASSIN'S CREED VALHALLA","WANTED DEAD","GENERATION ZERO ULTIMATE BUNDLE","MORTAL KOMBAT XL","FAR CRY PRIMAL","METRO 2033 REDUX","SAINTS ROW 2",
    "SHADOW OF THE TOMB RAIDER DEFINITIVE EDITION","RATCHET AND CLANK RIFT APART","NEED FOR SPEED HEAT DELUXE EDITION","DAYMARE 1994 SANDCASTLE","LEGO HORIZON ADVENTURES DELUXE EDITION","SNIPER ELITE 4","FAR CRY 5",
    "EURO TRUCK SIMULATOR 2","ASSASSIN'S CREED ORIGINS GOLD EDITION","DAYS GONE","MASS EFFECT LEGENDARY EDITION","BLACK SAILS","HITMAN ABSOLUTION PROFESSIONAL EDITION","RAGE 2 DELUXE EDITION","FAR CRY 4","CALL OF DUTY 4 MODERN WARFARE",
    "GEARS OF WAR","BIOSHOCK INFINITE","PREY","KINGDOM HEARTS III + RE MIND","LIES OF P DELUXE EDITION","OUTCAST A NEW BEGINNING","BRIGHT MEMORY: INFINITE","HIGH ON LIFE","BATTLEFIELD 3","METRO LAST LIGHT",
    "BANISHERS GHOSTS OF NEW EDEN","REMNANT II ULTIMATE EDITION","CALL OF DUTY MODERN WARFARE 2 REMASTERED","CALL OF DUTY BLACK OPS III","RAYMAN ORIGINS","FAR CRY 3","ATOMIC HEART","A PLAGUE TALE INNOCENCE",
    "NECROMUNDA HIRED GUN","STEELRISING","THE LAST OF US PART II","EVIL WEST","AIRPORTSIM","PSYCHONAUTS 2","EMPIRE OF THE ANTS DELUXE","A QUIET PLACE THE ROAD AHEAD","DEUS EX MANKIND DIVIDED","TOM CLANCY'S SPLINTER CELL BLACKLIST",
    "SOULSTICE","FORSPOKEN DIGITAL DELUXE EDITION","RESISTANCE 3","CONTAIN","POWERWASH ADVENTURE","WARFRAME","WOLFENSTEIN THE NEW ORDER","OUTPOST INFINITY SIEGE VANGUARD","GENERATION ZERO ULTIMATE BUNDLE","GRAND THEFT AUTO V",
    "STAR WARS JEDI SURVIVOR","BRIGHT MEMORY INFINITE","RETURNAL","CALL OF DUTY GHOSTS","TITANFALL 2","HALF-LIFE ALYX","CALL OF DUTY MODERN WARFARE REMASTERED","EVERSPACE 2","GOD OF WAR RAGNARÖK","STARLKER 2",",MAX PAYNE 3",
    "MECHWARRIOR 5 MERCENARIES","WOLFENSTEIN YOUNGBLOOD","STAR WARS JEDI FALLEN ORDER","DRAGON BALL SPARKING! ZERO","NEED FOR SPEED MOST WANTED LIMITED EDITION  ","UNCHARTED 4 LEGACY THIEVES COLLECTION",
    "FAR CRY NEW DAWN DELUXE EDITION","PACIFIC DRIVE","UNKNOWN 9 AWAKENING","WARHAMMER 40000 SPACE MARINE 2","QUANTUM BREAK STEAM EDITION","CALL OF DUTY WWII","METAL GEAR SOLID V THE PHANTOM PAIN","THE SURGE",
    "TERMINATOR RESISTANCE","SCARS ABOVE","OBSERVER SYSTEM REDUX","CRASH BANDICOOT 4 IT'S ABOUT TIME","GHOST OF TSUSHIMA DIRECTOR'S CUT","GEARS 5 ULTIMATE EDITION","THE EVIL WITHIN 2","HOMEFRONT THE REVOLUTION",
    "INDIANA JONES AND THE GREAT CIRCLE","SYNDICATE 2012","UNRAVEL TWO","CALL OF DUTY BLACK OPS","ASSASSINS CREED MIRAGE MASTER ASSASSIN EDITION","TRANSFORMERS FALL OF CYBERTRON","ROADCRAFT","THE CHORUS","GUARDIANS OF THE GALAXY",
    "STAR WARS BATTLEFRONT II ULTIMATE EDITION","RECORE DEFINITIVE EDITION","RESIDENT EVIL 2 REMAKE DELUXE EDITION","CRYSIS 3 REMASTERED","BATTLEFIRLD HARDLINE","CALL OF DUTY: ADVANCED WARFARE"
];

// NUEVO: Array para la lista de descargas dinámicas
let downloadList = ["BATTLEFIELD 4"];

// Arrays existentes
let usedWords = [];
let remainingWords = [...words];
let currentWord = ""; // Para guardar la palabra actual mostrada

const apiKey = 'c6beb639913a47a8b4148f99ab751619';
let imageTimeout;

// NUEVAS FUNCIONES: Sistema de persistencia con localStorage
function saveToLocalStorage() {
  try {
    const gameData = {
      downloadList: downloadList,
      customWords: words.filter(word => !originalWords.includes(word)), // Solo palabras agregadas por el usuario
      usedWords: usedWords,
      remainingWords: remainingWords,
      lastUpdated: new Date().toISOString()
    };
    localStorage.setItem('gamerWordApp', JSON.stringify(gameData));
  } catch (error) {
    console.error('Error guardando datos:', error);
  }
}

function loadFromLocalStorage() {
  try {
    const savedData = localStorage.getItem('gamerWordApp');
    if (savedData) {
      const gameData = JSON.parse(savedData);
      
      // Restaurar lista de descargas
      if (gameData.downloadList) {
        downloadList = gameData.downloadList;
      }
      
      // Restaurar palabras personalizadas (agregar las que no estén en el diccionario original)
      if (gameData.customWords && Array.isArray(gameData.customWords)) {
        gameData.customWords.forEach(word => {
          if (!words.includes(word)) {
            words.push(word);
          }
        });
      }
      
      // Eliminar de words las palabras que están en downloadList
      downloadList.forEach(downloadedGame => {
        const index = words.indexOf(downloadedGame);
        if (index > -1) {
          words.splice(index, 1);
        }
      });
      
      // Restaurar palabras usadas (opcional)
      if (gameData.usedWords) {
        usedWords = gameData.usedWords;
      }
      
      // Recalcular remainingWords
      remainingWords = words.filter(word => !usedWords.includes(word));
      
      Swal.fire({
        ...gamingAlert,
        title: '💾 ¡Datos Cargados!',
        text: 'Tus datos guardados han sido restaurados exitosamente.',
        icon: 'success',
        confirmButtonText: 'Perfecto',
        timer: 2000,
        timerProgressBar: true
      });
    }
  } catch (error) {
    console.error('Error cargando datos:', error);
    Swal.fire({
      ...gamingAlert,
      title: '⚠️ Error de Carga',
      text: 'Hubo un problema al cargar los datos guardados. Se usarán los datos por defecto.',
      icon: 'warning',
      confirmButtonText: 'Entendido'
    });
  }
}

function clearLocalStorage() {
  Swal.fire({
    ...gamingAlert,
    title: '🗑️ ¿Borrar Todos los Datos?',
    text: '¿Estás seguro? Esto eliminará:\n- Lista de descargas\n- Palabras personalizadas\n- Progreso guardado\n\nEsta acción no se puede deshacer.',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: '🗑️ Sí, Borrar Todo',
    cancelButtonText: '❌ Cancelar',
    confirmButtonColor: '#a64444',
    reverseButtons: true
  }).then((result) => {
    if (result.isConfirmed) {
      localStorage.removeItem('gamerWordApp');
      
      // Resetear a valores originales
      downloadList = [];
      usedWords = [];
      words.length = 0;
      words.push(...originalWords);
      remainingWords = [...words];
      currentWord = "";
      
      // Actualizar UI
      updateWordCount();
      updateProgressBar();
      updateDownloadTable();
      document.getElementById('random-word').textContent = '';
      document.getElementById('current-word-number').textContent = '0';
      document.getElementById('add-word-btn').disabled = true;
      
      Swal.fire({
        ...gamingAlert,
        title: '✅ ¡Datos Borrados!',
        text: 'Todos los datos han sido eliminados. La aplicación se ha reiniciado.',
        icon: 'success',
        confirmButtonText: 'Perfecto',
        timer: 3000,
        timerProgressBar: true
      });
    }
  });
}

// Guardar copia del diccionario original para poder resetear
const originalWords = [...words];

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

// Mezcla un array aleatoriamente
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

// Actualiza la barra de progreso
function updateProgressBar() {
  const pct = (usedWords.length / words.length) * 100;
  document.getElementById('progress-bar').style.width = pct + '%';
}

// Actualiza el contador de palabras restantes
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

// Esta función sólo hace la petición de la imagen tras 1.5s de inactividad en clicks
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

// Al presionar el botón mostramos la palabra ya y programamos la carga de la imagen
function showRandomWord() {
  if (remainingWords.length === 0) {
    remainingWords = [...words];
    usedWords = [];
    Swal.fire({
      ...gamingAlert,
      title: '🎮 ¡Lista Reiniciada!',
      text: 'Todas las palabras mostradas. Reiniciando lista.',
      icon: 'info',
      confirmButtonText: 'Continuar'
    });
  }

  shuffleArray(remainingWords);
  const word = remainingWords.pop();
  usedWords.push(word);
  currentWord = word; // Guardar la palabra actual

  // Guardar progreso en localStorage
  saveToLocalStorage();

  // Mostrar texto al instante
  const txtEl = document.getElementById('random-word');
  txtEl.textContent = word;
  txtEl.classList.add('visible');

  // Habilitar el botón de agregar a descargas
  document.getElementById('add-word-btn').disabled = false;

  // Limpiar y ocultar la imagen antigua
  const imgEl = document.getElementById('game-img');
  imgEl.classList.remove('loaded');
  imgEl.src = '';
  imgEl.alt = '';

  // Programar la petición de imagen tras 1.5s sin más clicks
  scheduleImageLoad(word);

  // Actualizar UI
  updateWordCount();
  updateProgressBar();
  document.getElementById('current-word-number').textContent = usedWords.length;
}

// NUEVA FUNCIÓN: Agregar la palabra actual a la lista de descargas
function addCurrentWordToDownloadList() {
  if (!currentWord || downloadList.includes(currentWord)) {
    if (downloadList.includes(currentWord)) {
      Swal.fire({
        ...gamingAlert,
        title: '⚠️ Juego Duplicado',
        text: 'Este juego ya está en la lista de descargas.',
        icon: 'warning',
        confirmButtonText: 'Entendido'
      });
    }
    return;
  }

  // Agregar a la lista de descargas
  downloadList.push(currentWord);
  
  // Eliminar de los arrays de palabras disponibles
  const wordIndex = words.indexOf(currentWord);
  if (wordIndex > -1) {
    words.splice(wordIndex, 1);
  }
  
  // Eliminar de remainingWords si está ahí
  const remainingIndex = remainingWords.indexOf(currentWord);
  if (remainingIndex > -1) {
    remainingWords.splice(remainingIndex, 1);
  }

  // Guardar cambios en localStorage
  saveToLocalStorage();

  // Actualizar UI
  updateWordCount();
  updateProgressBar();
  document.getElementById('add-word-btn').disabled = true;
  
  // Mostrar notificación
  Swal.fire({
    ...gamingAlert,
    title: '✅ ¡Agregado Exitosamente!',
    html: `<strong>"${currentWord}"</strong><br><br>Agregado a la lista de descargas y eliminado del diccionario.`,
    icon: 'success',
    confirmButtonText: 'Genial',
    timer: 3000,
    timerProgressBar: true
  });
  
  // Limpiar palabra actual
  currentWord = "";
  document.getElementById('random-word').textContent = "";
}

// NUEVA FUNCIÓN: Mostrar el modal de descargas
function showDownloadModal() {
  updateDownloadTable();
  document.getElementById('downloadModal').style.display = 'flex';
}

// NUEVA FUNCIÓN: Cerrar el modal de descargas
function closeDownloadModal() {
  document.getElementById('downloadModal').style.display = 'none';
}

// NUEVA FUNCIÓN: Actualizar la tabla de descargas en el modal
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
  downloadList.forEach((game, index) => {
    const row = document.createElement('div');
    row.className = 'table-row';
    row.innerHTML = `
      <div class="table-cell">${index + 1}</div>
      <div class="table-cell">${game}</div>
      <div class="table-cell">
        <button class="danger-btn small-btn" onclick="removeFromDownloadList(${index})">
          🗑️ Eliminar
        </button>
      </div>
    `;
    tbody.appendChild(row);
  });
}

// NUEVA FUNCIÓN: Eliminar juego de la lista de descargas
function removeFromDownloadList(index) {
  const removedGame = downloadList[index];
  
  Swal.fire({
    ...gamingAlert,
    title: '🎮 ¿Qué hacer con este juego?',
    html: `<strong>"${removedGame}"</strong><br><br>¿Qué quieres hacer con este juego?`,
    icon: 'question',
    showCancelButton: true,
    showDenyButton: true,
    confirmButtonText: '↩️ Restaurar al Diccionario',
    denyButtonText: '🗑️ Eliminar Completamente',
    cancelButtonText: '❌ Cancelar',
    customClass: {
      ...gamingAlert.customClass,
      denyButton: 'gaming-deny-btn'
    },
    reverseButtons: false
  }).then((result) => {
    if (result.isConfirmed) {
      // Opción 1: Restaurar al diccionario
      downloadList.splice(index, 1);
      words.push(removedGame);
      remainingWords.push(removedGame);
      
      // Guardar cambios en localStorage
      saveToLocalStorage();
      
      updateWordCount();
      updateProgressBar();
      updateDownloadTable();
      
      Swal.fire({
        ...gamingAlert,
        title: '↩️ ¡Juego Restaurado!',
        html: `<strong>"${removedGame}"</strong><br><br>Ha sido devuelto al diccionario y estará disponible nuevamente.`,
        icon: 'success',
        confirmButtonText: 'Perfecto',
        timer: 3000,
        timerProgressBar: true
      });
      
    } else if (result.isDenied) {
      // Opción 2: Eliminar completamente
      Swal.fire({
        ...gamingAlert,
        title: '⚠️ ¿Eliminar Permanentemente?',
        html: `<strong>"${removedGame}"</strong><br><br>¿Estás seguro? Esta acción no se puede deshacer. El juego será eliminado completamente de todo el sistema.`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: '🗑️ Sí, Eliminar',
        cancelButtonText: '❌ Cancelar',
        confirmButtonColor: '#dc143c',
        reverseButtons: true
      }).then((confirmResult) => {
        if (confirmResult.isConfirmed) {
          // Eliminar completamente
          downloadList.splice(index, 1);
          
          // Guardar cambios en localStorage
          saveToLocalStorage();
          
          updateDownloadTable();
          
          Swal.fire({
            ...gamingAlert,
            title: '🗑️ ¡Juego Eliminado!',
            html: `<strong>"${removedGame}"</strong><br><br>Ha sido eliminado permanentemente del sistema.`,
            icon: 'success',
            confirmButtonText: 'Entendido',
            timer: 3000,
            timerProgressBar: true
          });
        }
      });
    }
    // Si cancela (result.dismiss), no hacer nada
  });
}

// NUEVA FUNCIÓN: Limpiar toda la lista de descargas
function clearDownloadList() {
  if (downloadList.length === 0) {
    Swal.fire({
      ...gamingAlert,
      title: '📋 Lista Vacía',
      text: 'La lista de descargas ya está vacía.',
      icon: 'info',
      confirmButtonText: 'Entendido'
    });
    return;
  }
  
  Swal.fire({
    ...gamingAlert,
    title: '🗑️ ¿Limpiar Lista Completa?',
    text: '¿Estás seguro de que quieres limpiar toda la lista de descargas? Todos los juegos serán devueltos al diccionario.',
    icon: 'question',
    showCancelButton: true,
    confirmButtonText: 'Sí, limpiar',
    cancelButtonText: 'Cancelar',
    reverseButtons: true
  }).then((result) => {
    if (result.isConfirmed) {
      // Devolver todos los juegos al diccionario principal
      downloadList.forEach(game => {
        words.push(game);
        remainingWords.push(game);
      });
      
      // Limpiar la lista
      downloadList = [];
      
      // Guardar cambios en localStorage
      saveToLocalStorage();
      
      // Actualizar UI
      updateWordCount();
      updateProgressBar();
      updateDownloadTable();
      
      Swal.fire({
        ...gamingAlert,
        title: '✅ ¡Lista Limpiada!',
        text: 'Todos los juegos han sido devueltos al diccionario.',
        icon: 'success',
        confirmButtonText: 'Excelente',
        timer: 3000,
        timerProgressBar: true
      });
    }
  });
}

// NUEVA FUNCIÓN: Agregar nueva palabra al diccionario
function addNewWordToDictionary(newWord) {
  const trimmedWord = newWord.trim().toUpperCase();
  
  if (!trimmedWord) {
    Swal.fire({
      ...gamingAlert,
      title: '❌ Palabra Inválida',
      text: 'Por favor ingresa un nombre válido para el juego.',
      icon: 'error',
      confirmButtonText: 'Entendido'
    });
    return false;
  }
  
  if (words.includes(trimmedWord) || downloadList.includes(trimmedWord)) {
    Swal.fire({
      ...gamingAlert,
      title: '⚠️ Juego Duplicado',
      text: 'Este juego ya existe en el diccionario o en la lista de descargas.',
      icon: 'warning',
      confirmButtonText: 'Entendido'
    });
    return false;
  }
  
  // Agregar al diccionario principal
  words.push(trimmedWord);
  remainingWords.push(trimmedWord);
  
  // Guardar cambios en localStorage
  saveToLocalStorage();
  
  // Actualizar UI
  updateWordCount();
  updateProgressBar();
  
  Swal.fire({
    ...gamingAlert,
    title: '🎮 ¡Juego Agregado!',
    html: `<strong>"${trimmedWord}"</strong><br><br>Agregado exitosamente al diccionario.`,
    icon: 'success',
    confirmButtonText: 'Genial',
    timer: 3000,
    timerProgressBar: true
  });
  return true;
}

// Reinicia manualmente la lista
function resetWords() {
  Swal.fire({
    ...gamingAlert,
    title: '🔄 ¿Reiniciar Lista?',
    text: '¿Estás seguro de que quieres reiniciar? Esto NO afectará tu lista de descargas.',
    icon: 'question',
    showCancelButton: true,
    confirmButtonText: 'Sí, reiniciar',
    cancelButtonText: 'Cancelar',
    reverseButtons: true
  }).then((result) => {
    if (result.isConfirmed) {
      usedWords = [];
      remainingWords = [...words];
      currentWord = "";
      
      // Guardar cambios en localStorage
      saveToLocalStorage();
      
      updateWordCount();
      updateProgressBar();
      document.getElementById('random-word').textContent = '';
      document.getElementById('current-word-number').textContent = '0';
      document.getElementById('add-word-btn').disabled = true;
      
      clearTimeout(imageTimeout);
      const imgEl = document.getElementById('game-img');
      imgEl.src = '';
      imgEl.alt = '';
      imgEl.classList.remove('loaded');

      Swal.fire({
        ...gamingAlert,
        title: '✅ ¡Lista Reiniciada!',
        text: 'La lista ha sido reiniciada exitosamente.',
        icon: 'success',
        confirmButtonText: 'Perfecto',
        timer: 2000,
        timerProgressBar: true
      });
    }
  });
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
  loadFromLocalStorage(); // Cargar datos al inicio
  updateWordCount();
  updateProgressBar();
  
  // Agregar listener para el formulario de nueva palabra
  document.getElementById('add-word-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const input = document.getElementById('new-word-input');
    if (addNewWordToDictionary(input.value)) {
      input.value = '';
    }
  });

  // Cerrar modal al hacer click fuera de él
  document.getElementById('downloadModal').addEventListener('click', (e) => {
    if (e.target.id === 'downloadModal') {
      closeDownloadModal();
    }
  });
});

//www.compucalitv.com
//www.gamezfull.com
