// Game configuration
const DIFFICULTY_SETTINGS = {
  easy: {
    name: 'Easy',
    moleSpeed: 1200,
    moleShowTime: 2000,
    gameDuration: 45,
    icon: '🐌',
    color: 'var(--easy-color)'
  },
  medium: {
    name: 'Medium',
    moleSpeed: 800,
    moleShowTime: 1500,
    gameDuration: 35,
    icon: '🚀',
    color: 'var(--medium-color)'
  },
  hard: {
    name: 'Hard',
    moleSpeed: 500,
    moleShowTime: 1000,
    gameDuration: 25,
    icon: '⚡',
    color: 'var(--hard-color)'
  }
};

// Game state
let gameState = {
  score: 0,
  highScore: 0,
  timeLeft: 30,
  isGameActive: false,
  isPaused: false,
  gameInterval: null,
  timerInterval: null,
  moleTimeout: null,
  currentDifficulty: 'easy',
  currentMoleIndex: -1
};

// DOM elements
const gameBoard = document.querySelector(".game-board");
const currentScoreElement = document.querySelector(".current-score");
const highScoreElement = document.querySelector(".high-score");
const timerElement = document.querySelector(".timer");
const startBtn = document.querySelector(".start-btn");
const pauseBtn = document.querySelector(".pause-btn");
const newGameBtn = document.querySelector(".new-game-btn");
const resetBtn = document.querySelector(".reset-btn");
const playAgainBtn = document.querySelector(".play-again-btn");
const closeModalBtn = document.querySelector(".close-modal-btn");
const modalOverlay = document.querySelector(".modal-overlay");
const finalScoreElement = document.querySelector(".final-score");
const difficultyBadge = document.querySelector(".difficulty-badge .badge-text");
const themeToggle = document.querySelector(".theme-toggle");
const difficultyButtons = document.querySelectorAll(".difficulty-btn");

// Create mole SVG
function createMoleSVG() {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("class", "mole-svg");
  svg.setAttribute("viewBox", "0 0 100 100");
  svg.innerHTML = `
    <!-- Mole body -->
    <ellipse cx="50" cy="70" rx="35" ry="25" fill="#8B4513" stroke="#654321" stroke-width="2"/>
    
    <!-- Mole head -->
    <ellipse cx="50" cy="45" rx="28" ry="22" fill="#A0522D" stroke="#654321" stroke-width="2"/>
    
    <!-- Eyes -->
    <circle cx="42" cy="40" r="4" fill="#000"/>
    <circle cx="58" cy="40" r="4" fill="#000"/>
    <circle cx="43" cy="38" r="1.5" fill="#fff"/>
    <circle cx="59" cy="38" r="1.5" fill="#fff"/>
    
    <!-- Nose -->
    <ellipse cx="50" cy="48" rx="3" ry="2" fill="#000"/>
    
    <!-- Mouth -->
    <path d="M 46 52 Q 50 56 54 52" stroke="#000" stroke-width="1.5" fill="none"/>
    
    <!-- Ears -->
    <ellipse cx="35" cy="35" rx="6" ry="8" fill="#8B4513" stroke="#654321" stroke-width="1"/>
    <ellipse cx="65" cy="35" rx="6" ry="8" fill="#8B4513" stroke="#654321" stroke-width="1"/>
    
    <!-- Inner ears -->
    <ellipse cx="35" cy="35" rx="3" ry="5" fill="#D2691E"/>
    <ellipse cx="65" cy="35" rx="3" ry="5" fill="#D2691E"/>
    
    <!-- Whiskers -->
    <line x1="25" y1="45" x2="35" y2="47" stroke="#000" stroke-width="1"/>
    <line x1="25" y1="50" x2="35" y2="50" stroke="#000" stroke-width="1"/>
    <line x1="65" y1="47" x2="75" y2="45" stroke="#000" stroke-width="1"/>
    <line x1="65" y1="50" x2="75" y2="50" stroke="#000" stroke-width="1"/>
    
    <!-- Front paws -->
    <ellipse cx="38" cy="65" rx="6" ry="4" fill="#A0522D" stroke="#654321" stroke-width="1"/>
    <ellipse cx="62" cy="65" rx="6" ry="4" fill="#A0522D" stroke="#654321" stroke-width="1"/>
  `;
  return svg;
}

// Create game holes
for (let i = 0; i < 9; i++) {
  let hole = document.createElement("div");
  hole.classList.add("hole");
  
  // Add mole SVG to each hole
  const moleSVG = createMoleSVG();
  hole.appendChild(moleSVG);
  
  hole.addEventListener("click", handleHoleClick);
  hole.addEventListener("touchstart", handleHoleClick, { passive: true });
  gameBoard.append(hole);
}

const holes = document.querySelectorAll(".hole");

// Initialize game
function initGame() {
  loadHighScore();
  loadTheme();
  loadDifficulty();
  updateDisplay();
  setupDifficultyButtons();
}

// Local Storage functions
function saveHighScore(difficulty) {
  const key = `whac-a-mole-highscore-${difficulty}`;
  const currentHigh = localStorage.getItem(key);
  if (!currentHigh || gameState.score > parseInt(currentHigh)) {
    localStorage.setItem(key, gameState.score);
    return true; // New high score
  }
  return false;
}

function loadHighScore() {
  const key = `whac-a-mole-highscore-${gameState.currentDifficulty}`;
  const savedScore = localStorage.getItem(key);
  gameState.highScore = savedScore ? parseInt(savedScore) : 0;
}

function saveTheme(theme) {
  localStorage.setItem("whac-a-mole-theme", theme);
}

function loadTheme() {
  const savedTheme = localStorage.getItem("whac-a-mole-theme");
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const theme = savedTheme || (prefersDark ? "dark" : "light");
  
  document.documentElement.setAttribute("data-theme", theme);
}

function saveDifficulty(difficulty) {
  localStorage.setItem("whac-a-mole-difficulty", difficulty);
}

function loadDifficulty() {
  const savedDifficulty = localStorage.getItem("whac-a-mole-difficulty");
  gameState.currentDifficulty = savedDifficulty || 'easy';
  loadHighScore();
}

// Theme toggle functionality
function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute("data-theme");
  const newTheme = currentTheme === "dark" ? "light" : "dark";
  
  document.documentElement.setAttribute("data-theme", newTheme);
  saveTheme(newTheme);
}

// Difficulty management
function setupDifficultyButtons() {
  // Clear all active states first
  difficultyButtons.forEach(btn => btn.classList.remove('active'));
  
  difficultyButtons.forEach(btn => {
    const difficulty = btn.dataset.difficulty;
    
    // Set active state based on current difficulty
    if (difficulty === gameState.currentDifficulty) {
      btn.classList.add('active');
    }
    
    // Add click handler
    btn.addEventListener('click', () => {
      if (gameState.isGameActive || gameState.isPaused) return; // Don't allow change during game
      
      // Update active state
      difficultyButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      // Update difficulty
      gameState.currentDifficulty = difficulty;
      saveDifficulty(difficulty);
      loadHighScore();
      updateDisplay();
      
      // Add haptic feedback for mobile
      if (navigator.vibrate) {
        navigator.vibrate(50);
      }
    });
  });
}

function getDifficultySettings() {
  return DIFFICULTY_SETTINGS[gameState.currentDifficulty];
}

// Game logic
function showRandomMole() {
  if (!gameState.isGameActive || gameState.isPaused) return;

  // Clear any existing mole
  holes.forEach(hole => hole.classList.remove("mole"));
  
  // Clear previous timeout
  if (gameState.moleTimeout) {
    clearTimeout(gameState.moleTimeout);
  }

  // Show new mole in random hole
  const randomIndex = Math.floor(Math.random() * holes.length);
  gameState.currentMoleIndex = randomIndex;
  holes[randomIndex].classList.add("mole");
  
  const settings = getDifficultySettings();
  
  // Hide mole after show time
  gameState.moleTimeout = setTimeout(() => {
    if (holes[randomIndex].classList.contains("mole")) {
      holes[randomIndex].classList.remove("mole");
      gameState.currentMoleIndex = -1;
    }
  }, settings.moleShowTime);
}

function handleHoleClick(event) {
  if (!gameState.isGameActive || gameState.isPaused) return;
  
  const hole = event.currentTarget;
  const holeIndex = Array.from(holes).indexOf(hole);
  
  // Add haptic feedback for mobile
  if (navigator.vibrate) {
    navigator.vibrate(30);
  }
  
  if (hole.classList.contains("mole")) {
    // Hit a mole!
    gameState.score++;
    hole.classList.remove("mole");
    hole.classList.add("hit");
    
    // Clear the mole timeout since it was hit
    if (gameState.moleTimeout) {
      clearTimeout(gameState.moleTimeout);
    }
    
    gameState.currentMoleIndex = -1;
    
    // Remove hit effect after animation
    setTimeout(() => {
      hole.classList.remove("hit");
    }, 400);
    
    updateDisplay();
    
    // Check for new high score
    if (gameState.score > gameState.highScore) {
      gameState.highScore = gameState.score;
    }
    
    // Show next mole sooner for better gameplay flow
    const settings = getDifficultySettings();
    setTimeout(showRandomMole, settings.moleSpeed * 0.3);
  } else {
    // Missed - add miss effect
    hole.style.transform = 'scale(0.95)';
    setTimeout(() => {
      hole.style.transform = '';
    }, 150);
  }
}

function startGame() {
  const settings = getDifficultySettings();
  
  gameState.score = 0;
  gameState.timeLeft = settings.gameDuration;
  gameState.isGameActive = true;
  gameState.isPaused = false;
  gameState.currentMoleIndex = -1;
  
  // Update UI state
  updateButtonStates('playing');
  
  // Disable difficulty buttons during game
  difficultyButtons.forEach(btn => btn.style.pointerEvents = 'none');
  
  updateDisplay();
  
  // Start mole spawning
  gameState.gameInterval = setInterval(showRandomMole, settings.moleSpeed);
  
  // Show first mole immediately
  setTimeout(showRandomMole, 500);
  
  // Start timer
  gameState.timerInterval = setInterval(() => {
    gameState.timeLeft--;
    updateDisplay();
    
    if (gameState.timeLeft <= 0) {
      endGame();
    }
  }, 1000);
  
  // Add haptic feedback for game start
  if (navigator.vibrate) {
    navigator.vibrate([50, 100, 50]);
  }
}

function pauseGame() {
  if (!gameState.isGameActive || gameState.isPaused) return;
  
  gameState.isPaused = true;
  
  // Clear intervals
  clearInterval(gameState.gameInterval);
  clearInterval(gameState.timerInterval);
  if (gameState.moleTimeout) {
    clearTimeout(gameState.moleTimeout);
  }
  
  // Remove all moles
  holes.forEach(hole => hole.classList.remove("mole"));
  
  // Update UI
  updateButtonStates('paused');
  
  // Add haptic feedback
  if (navigator.vibrate) {
    navigator.vibrate(100);
  }
}

function resumeGame() {
  if (!gameState.isGameActive || !gameState.isPaused) return;
  
  gameState.isPaused = false;
  
  const settings = getDifficultySettings();
  
  // Update UI
  updateButtonStates('playing');
  
  // Resume mole spawning
  gameState.gameInterval = setInterval(showRandomMole, settings.moleSpeed);
  
  // Resume timer
  gameState.timerInterval = setInterval(() => {
    gameState.timeLeft--;
    updateDisplay();
    
    if (gameState.timeLeft <= 0) {
      endGame();
    }
  }, 1000);
  
  // Show mole immediately
  setTimeout(showRandomMole, 200);
  
  // Add haptic feedback
  if (navigator.vibrate) {
    navigator.vibrate([50, 50]);
  }
}

function newGame() {
  // End current game if active
  if (gameState.isGameActive) {
    endGame(false); // Don't show modal
  }
  
  // Reset game state
  gameState.score = 0;
  const settings = getDifficultySettings();
  gameState.timeLeft = settings.gameDuration;
  gameState.isGameActive = false;
  gameState.isPaused = false;
  gameState.currentMoleIndex = -1;
  
  // Clear all intervals and timeouts
  clearInterval(gameState.gameInterval);
  clearInterval(gameState.timerInterval);
  if (gameState.moleTimeout) {
    clearTimeout(gameState.moleTimeout);
  }
  
  // Remove all moles and effects
  holes.forEach(hole => {
    hole.classList.remove("mole", "hit");
  });
  
  // Update UI
  updateButtonStates('idle');
  
  // Re-enable difficulty buttons
  difficultyButtons.forEach(btn => btn.style.pointerEvents = 'auto');
  
  updateDisplay();
  
  // Add haptic feedback
  if (navigator.vibrate) {
    navigator.vibrate(100);
  }
}

function updateButtonStates(state) {
  const startBtnIcon = startBtn.querySelector('.btn-icon');
  const startBtnText = startBtn.querySelector('.btn-text');
  
  switch(state) {
    case 'idle':
      startBtn.style.display = 'flex';
      startBtn.disabled = false;
      startBtnText.textContent = 'Start Game';
      startBtn.classList.remove('resume');
      
      pauseBtn.style.display = 'none';
      newGameBtn.style.display = 'flex';
      resetBtn.style.display = 'flex';
      break;
      
    case 'playing':
      startBtn.style.display = 'none';
      pauseBtn.style.display = 'flex';
      pauseBtn.querySelector('.btn-text').textContent = 'Pause';
      
      newGameBtn.style.display = 'flex';
      resetBtn.style.display = 'none';
      break;
      
    case 'paused':
      startBtn.style.display = 'flex';
      startBtn.disabled = false;
      startBtnText.textContent = 'Resume';
      startBtn.classList.add('resume');
      
      pauseBtn.style.display = 'none';
      newGameBtn.style.display = 'flex';
      resetBtn.style.display = 'none';
      break;
  }
}

function endGame(showModal = true) {
  gameState.isGameActive = false;
  gameState.isPaused = false;
  
  // Clear intervals and timeouts
  clearInterval(gameState.gameInterval);
  clearInterval(gameState.timerInterval);
  if (gameState.moleTimeout) {
    clearTimeout(gameState.moleTimeout);
  }
  
  // Remove all moles
  holes.forEach(hole => {
    hole.classList.remove("mole", "hit");
  });
  
  // Update UI
  updateButtonStates('idle');
  
  // Re-enable difficulty buttons
  difficultyButtons.forEach(btn => btn.style.pointerEvents = 'auto');
  
  // Check for new high score
  const isNewHighScore = saveHighScore(gameState.currentDifficulty);
  if (isNewHighScore) {
    gameState.highScore = gameState.score;
  }
  
  // Show game over modal if requested
  if (showModal) {
    finalScoreElement.textContent = gameState.score;
    difficultyBadge.textContent = `${DIFFICULTY_SETTINGS[gameState.currentDifficulty].name} Mode`;
    modalOverlay.style.display = "flex";
    
    // Add celebration haptic for high score
    if (isNewHighScore && navigator.vibrate) {
      navigator.vibrate([100, 50, 100, 50, 200]);
    }
  }
}

function resetHighScore() {
  if (confirm(`Are you sure you want to reset the high score for ${DIFFICULTY_SETTINGS[gameState.currentDifficulty].name} difficulty?`)) {
    const key = `whac-a-mole-highscore-${gameState.currentDifficulty}`;
    localStorage.removeItem(key);
    gameState.highScore = 0;
    updateDisplay();
    
    // Add haptic feedback
    if (navigator.vibrate) {
      navigator.vibrate(100);
    }
  }
}

function updateDisplay() {
  currentScoreElement.textContent = gameState.score;
  highScoreElement.textContent = gameState.highScore;
  timerElement.textContent = gameState.timeLeft;
}

// Event listeners
startBtn.addEventListener("click", () => {
  if (gameState.isPaused) {
    resumeGame();
  } else {
    startGame();
  }
});

pauseBtn.addEventListener("click", pauseGame);
newGameBtn.addEventListener("click", newGame);
resetBtn.addEventListener("click", resetHighScore);

playAgainBtn.addEventListener("click", () => {
  modalOverlay.style.display = "none";
  startGame();
});

closeModalBtn.addEventListener("click", () => {
  modalOverlay.style.display = "none";
});

themeToggle.addEventListener("click", toggleTheme);

// Close modal when clicking overlay
modalOverlay.addEventListener("click", (event) => {
  if (event.target === modalOverlay) {
    modalOverlay.style.display = "none";
  }
});

// Keyboard shortcuts
document.addEventListener("keydown", (event) => {
  if (event.code === "Space") {
    event.preventDefault();
    if (modalOverlay.style.display === "flex") {
      modalOverlay.style.display = "none";
      startGame();
    } else if (gameState.isPaused) {
      resumeGame();
    } else if (!gameState.isGameActive) {
      startGame();
    } else if (gameState.isGameActive && !gameState.isPaused) {
      pauseGame();
    }
  } else if (event.code === "Escape") {
    if (modalOverlay.style.display === "flex") {
      modalOverlay.style.display = "none";
    } else if (gameState.isGameActive || gameState.isPaused) {
      newGame();
    }
  } else if (event.key >= "1" && event.key <= "3" && !gameState.isGameActive && !gameState.isPaused) {
    // Quick difficulty selection with number keys
    const difficulties = ['easy', 'medium', 'hard'];
    const index = parseInt(event.key) - 1;
    if (index < difficulties.length) {
      const targetBtn = document.querySelector(`[data-difficulty="${difficulties[index]}"]`);
      if (targetBtn) {
        targetBtn.click();
      }
    }
  } else if (event.key.toLowerCase() === 'n' && !gameState.isGameActive) {
    // N key for new game
    newGame();
  } else if (event.key.toLowerCase() === 'r' && !gameState.isGameActive) {
    // R key for reset high score
    resetHighScore();
  }
});

// Prevent zoom on double tap for iOS
let lastTouchEnd = 0;
document.addEventListener('touchend', function (event) {
  const now = (new Date()).getTime();
  if (now - lastTouchEnd <= 300) {
    event.preventDefault();
  }
  lastTouchEnd = now;
}, false);

// Handle orientation change
window.addEventListener('orientationchange', function() {
  setTimeout(() => {
    // Force a repaint to fix any layout issues
    document.body.style.display = 'none';
    document.body.offsetHeight; // Trigger reflow
    document.body.style.display = '';
  }, 500);
});

// Prevent context menu on long press for mobile
document.addEventListener('contextmenu', function(event) {
  if (event.target.closest('.hole')) {
    event.preventDefault();
  }
});

// Add visual feedback for touch
holes.forEach(hole => {
  hole.addEventListener('touchstart', function() {
    this.style.transform = 'scale(0.95)';
  }, { passive: true });
  
  hole.addEventListener('touchend', function() {
    setTimeout(() => {
      this.style.transform = '';
    }, 100);
  }, { passive: true });
});

// Performance optimization: Preload sounds (if you add them later)
function preloadAssets() {
  // Future: Add sound preloading here
}

// Initialize the game
document.addEventListener('DOMContentLoaded', () => {
  initGame();
  preloadAssets();
});

// Add service worker registration for PWA (optional future enhancement)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', function() {
    // Future: Add service worker registration here for offline play
  });
}
