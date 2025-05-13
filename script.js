const words = [
    "HALO WARS DEFINITIVE EDITION  ", "HALO WARS 2 ULTIMATE EDITION  ", "CYBERPUNK 2077","MARVEL'S SPIDER-MAN MILES MORALES","ASSASSIN'S CREED II DELUXE EDITION","ALAN WAKE II DELUXE EDITION",
    "CALL OF DUTY BLACK OPS II PLUTONIUM","JUST CAUSE 4 COMPLETE EDITION","ASSASSIN'S CREED ODYSSEY GOLD EDITION","BATMAN ARKHAM KNIGHT PREMIUM EDITION","MAFIA DEFINITIVE EDITION","MAFIA 2 DEFINITIVE EDITION",
    "WOLFENSTEIN II THE NEW COLOSSUS","WATCH DOGS 2 DELUXE EDITION","TOM CLANCY'S GHOST RECON WILDLANDS GOLD EDITION","FAR CRY 6 GOLD EDITION","OUTPOST INFINITY SIEGE VANGUARD EDITION","DYING LIGHT 2 STAY HUMAN",
    "MARVEL SPIDER-MAN 2 DELUXE EDITION","DEAD SPACE 2","ROBOCOP ROGUE CITY","ASSASSIN'S CREED VALHALLA","WANTED DEAD","GENERATION ZERO ULTIMATE BUNDLE","MORTAL KOMBAT XL","FAR CRY PRIMAL",
    "SHADOW OF THE TOMB RAIDER DEFINITIVE EDITION","RATCHET AND CLANK RIFT APART","NEED FOR SPEED HEAT DELUXE EDITION","DAYMARE 1994 SANDCASTLE","LEGO HORIZON ADVENTURES DELUXE EDITION","SNIPER ELITE 4","FAR CRY 5",
    "EURO TRUCK SIMULATOR 2","ASSASSIN'S CREED ORIGINS GOLD EDITION","DAYS GONE","MASS EFFECT LEGENDARY EDITION","BLACK SAILS","HITMAN ABSOLUTION PROFESSIONAL EDITION","RAGE 2 DELUXE EDITION","FAR CRY 4",
    "CRYSIS 2 REMASTERED  ","GEARS OF WAR 4  ","GEARS OF WAR","BIOSHOCK INFINITE","PREY","KINGDOM HEARTS III + RE MIND","LIES OF P DELUXE EDITION","OUTCAST A NEW BEGINNING","BRIGHT MEMORY: INFINITE","HIGH ON LIFE","BATTLEFIELD 3",
    "BANISHERS GHOSTS OF NEW EDEN","REMNANT II ULTIMATE EDITION","CALL OF DUTY MODERN WARFARE 2 REMASTERED","CALL OF DUTY BLACK OPS III","RAYMAN ORIGINS","FAR CRY 3","ATOMIC HEART",
    "NECROMUNDA HIRED GUN","STEELRISING","THE LAST OF US PART II","EVIL WEST","AIRPORTSIM","PSYCHONAUTS 2","EMPIRE OF THE ANTS DELUXE","A QUIET PLACE THE ROAD AHEAD","DEUS EX MANKIND DIVIDED","TOM CLANCY'S SPLINTER CELL BLACKLIST",
    "SOULSTICE","FORSPOKEN DIGITAL DELUXE EDITION","RESISTANCE 3","CONTAIN","POWERWASH ADVENTURE","WARFRAME","WOLFENSTEIN THE NEW ORDER","OUTPOST INFINITY SIEGE VANGUARD","GENERATION ZERO ULTIMATE BUNDLE",
    "STAR WARS JEDI SURVIVOR","BRIGHT MEMORY INFINITE","RETURNAL","CALL OF DUTY GHOSTS","TITANFALL 2","HALF-LIFE ALYX","CALL OF DUTY MODERN WARFARE REMASTERED","EVERSPACE 2","GOD OF WAR RAGNARÖK","STARLKER 2",
    "MECHWARRIOR 5 MERCENARIES","SHADOW WARRIOR 3","WOLFENSTEIN YOUNGBLOOD","STAR WARS JEDI FALLEN ORDER","DRAGON BALL SPARKING! ZERO","NEED FOR SPEED MOST WANTED LIMITED EDITION  ","UNCHARTED 4 LEGACY THIEVES COLLECTION",
    "FAR CRY NEW DAWN DELUXE EDITION","PACIFIC DRIVE","UNKNOWN 9 AWAKENING","WARHAMMER 40000 SPACE MARINE 2","QUANTUM BREAK STEAM EDITION","CALL OF DUTY WWII","METAL GEAR SOLID V THE PHANTOM PAIN",
    "TERMINATOR RESISTANCE","SCARS ABOVE","OBSERVER SYSTEM REDUX","CRASH BANDICOOT 4 IT'S ABOUT TIME","GHOST OF TSUSHIMA DIRECTOR'S CUT","GEARS 5 ULTIMATE EDITION","THE EVIL WITHIN 2","HOMEFRONT THE REVOLUTION",
    "INDIANA JONES AND THE GREAT CIRCLE","SYNDICATE 2012","UNRAVEL TWO","CALL OF DUTY BLACK OPS","ASSASSINS CREED MIRAGE MASTER ASSASSIN EDITION","TRANSFORMERS FALL OF CYBERTRON",   
    "CHERNOBYLITE COMPLETE EDITION","STAR WARS BATTLEFRONT II ULTIMATE EDITION","RECORE DEFINITIVE EDITION","JUST CAUSE 3","RESIDENT EVIL 2 REMAKE DELUXE EDITION","CRYSIS 3 REMASTERED","BATTLEFIRLD HARDLINE"

];


//BATTLEFIELD 4

let usedWords      = [];
let remainingWords = [...words];
const apiKey       = 'c6beb639913a47a8b4148f99ab751619';

let imageTimeout;  // temporizador para la petición de la imagen

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
    const res  = await fetch(url);
    const data = await res.json();
    return data.results?.[0]?.background_image || null;
  } catch (e) {
    console.error('RAWG error:', e);
    return null;
  }
}

// Esta función sólo hace la petición de la imagen tras 10s de inactividad en clicks
function scheduleImageLoad(word) {
  clearTimeout(imageTimeout);
  imageTimeout = setTimeout(async () => {
    const imgEl = document.getElementById('game-img');
    const url   = await fetchGameImage(word);

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
    alert('Todas las palabras mostradas. Reiniciando lista.');
  }

  shuffleArray(remainingWords);
  const word = remainingWords.pop();
  usedWords.push(word);

  // Mostrar texto al instante
  const txtEl = document.getElementById('random-word');
  txtEl.textContent = word;
  txtEl.classList.add('visible');

  // Limpiar y ocultar la imagen antigua
  const imgEl = document.getElementById('game-img');
  imgEl.classList.remove('loaded');
  imgEl.src = '';
  imgEl.alt = '';

  // Programar la petición de imagen tras 10s sin más clicks
  scheduleImageLoad(word);

  // Actualizar UI
  updateWordCount();
  updateProgressBar();
  document.getElementById('current-word-number').textContent = usedWords.length;
}

// Reinicia manualmente la lista
function resetWords() {
  usedWords = [];
  remainingWords = [...words];
  updateWordCount();
  updateProgressBar();
  document.getElementById('random-word').textContent = '';
  document.getElementById('current-word-number').textContent = '0';
  clearTimeout(imageTimeout);
  const imgEl = document.getElementById('game-img');
  imgEl.src = '';
  imgEl.alt = '';
}

document.addEventListener('DOMContentLoaded', () => {
  updateWordCount();
  updateProgressBar();
});

//www.compucalitv.com
