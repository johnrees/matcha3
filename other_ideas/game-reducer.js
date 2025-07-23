// Game Reducer - Vanilla JS with no booleans, just states
// Each state has a specific type, making impossible states impossible

// State types (like an enum)
const GamePhase = {
  MENU: 'MENU',
  PLAYING: 'PLAYING',
  GAME_OVER: 'GAME_OVER'
};

const PlayState = {
  WAITING_FIRST_MOVE: 'WAITING_FIRST_MOVE',
  SELECTING: 'SELECTING',
  SHAKING: 'SHAKING',
  MATCHING: 'MATCHING',
  AUTO_MATCHING: 'AUTO_MATCHING',
  LEVEL_COMPLETE: 'LEVEL_COMPLETE'
};

// Action types
const Actions = {
  START_GAME: 'START_GAME',
  SELECT_TILE: 'SELECT_TILE',
  ANIMATION_COMPLETE: 'ANIMATION_COMPLETE',
  TIMER_TICK: 'TIMER_TICK',
  AUTO_MATCH_STEP: 'AUTO_MATCH_STEP'
};

// Initial state - no booleans!
function createInitialState() {
  return {
    // Current phase and play state
    phase: GamePhase.MENU,
    playState: null,
    
    // Animation state (which animation is playing, if any)
    animation: null, // null | 'shake' | 'match' | 'autoMatch'
    animatingTiles: [],
    
    // Game data
    board: [],
    selectedTiles: [],
    score: 0,
    matches: 0,
    level: 1,
    timeRemaining: 30,
    timerRunning: false,
    
    // For auto-matching
    autoMatchStep: 0
  };
}

// Pure reducer function - no side effects
function gameReducer(state, action) {
  switch (action.type) {
    case Actions.START_GAME: {
      return {
        ...createInitialState(),
        phase: GamePhase.PLAYING,
        playState: PlayState.WAITING_FIRST_MOVE,
        board: action.board,
        level: action.level || 1
      };
    }
    
    case Actions.SELECT_TILE: {
      // Can only select during certain states
      if (state.phase !== GamePhase.PLAYING) return state;
      if (state.playState !== PlayState.WAITING_FIRST_MOVE && 
          state.playState !== PlayState.SELECTING) return state;
      if (state.animation) return state; // No selection during animations
      
      const { row, col } = action;
      const tile = state.board[row][col];
      if (!tile) return state;
      
      // Check if already selected (toggle off)
      const existingIndex = state.selectedTiles.findIndex(
        t => t.row === row && t.col === col
      );
      if (existingIndex !== -1) {
        return {
          ...state,
          selectedTiles: state.selectedTiles.filter((_, i) => i !== existingIndex)
        };
      }
      
      // Check if same type already selected
      const hasSameType = state.selectedTiles.some(pos => {
        const t = state.board[pos.row][pos.col];
        return t?.type === tile.type;
      });
      if (hasSameType) return state;
      
      // Add to selection
      const newSelected = [...state.selectedTiles, { row, col }];
      
      // Start timer on first move
      const newPlayState = state.playState === PlayState.WAITING_FIRST_MOVE 
        ? PlayState.SELECTING 
        : state.playState;
      
      // Check for 2 tiles - early mismatch detection
      if (newSelected.length === 2) {
        const [t1, t2] = newSelected.map(pos => state.board[pos.row][pos.col]);
        if (t1.kanaIndex !== t2.kanaIndex) {
          return {
            ...state,
            playState: PlayState.SHAKING,
            animation: 'shake',
            animatingTiles: newSelected,
            selectedTiles: newSelected,
            timerRunning: true
          };
        }
      }
      
      // Check for 3 tiles - validate match
      if (newSelected.length === 3) {
        const tiles = newSelected.map(pos => state.board[pos.row][pos.col]);
        const isMatch = tiles.every(t => t.kanaIndex === tiles[0].kanaIndex);
        
        if (isMatch) {
          return {
            ...state,
            playState: PlayState.MATCHING,
            animation: 'match',
            animatingTiles: newSelected,
            selectedTiles: newSelected,
            score: state.score + 100,
            matches: state.matches + 1,
            timeRemaining: Math.min(state.timeRemaining + 5, 30),
            timerRunning: newPlayState === PlayState.SELECTING
          };
        } else {
          return {
            ...state,
            playState: PlayState.SHAKING,
            animation: 'shake',
            animatingTiles: newSelected,
            selectedTiles: newSelected,
            timerRunning: true
          };
        }
      }
      
      return {
        ...state,
        selectedTiles: newSelected,
        playState: newPlayState,
        timerRunning: newPlayState === PlayState.SELECTING
      };
    }
    
    case Actions.ANIMATION_COMPLETE: {
      switch (state.animation) {
        case 'shake':
          return {
            ...state,
            playState: PlayState.SELECTING,
            animation: null,
            animatingTiles: [],
            selectedTiles: []
          };
          
        case 'match': {
          // Remove matched tiles
          const newBoard = state.board.map(row => [...row]);
          state.animatingTiles.forEach(({ row, col }) => {
            newBoard[row][col] = null;
          });
          
          // Count remaining tiles
          const remaining = newBoard.flat().filter(t => t !== null).length;
          
          // Check what's next
          if (remaining === 3) {
            // Start auto-match
            const remainingPositions = [];
            newBoard.forEach((row, ri) => {
              row.forEach((tile, ci) => {
                if (tile) remainingPositions.push({ row: ri, col: ci });
              });
            });
            
            return {
              ...state,
              board: newBoard,
              playState: PlayState.AUTO_MATCHING,
              animation: 'autoMatch',
              animatingTiles: [],
              selectedTiles: [],
              autoMatchStep: 0,
              timerRunning: false // Pause during auto-match
            };
          } else if (state.matches >= 12) {
            return {
              ...state,
              board: newBoard,
              playState: PlayState.LEVEL_COMPLETE,
              animation: null,
              animatingTiles: [],
              selectedTiles: []
            };
          } else {
            return {
              ...state,
              board: newBoard,
              playState: PlayState.SELECTING,
              animation: null,
              animatingTiles: [],
              selectedTiles: []
            };
          }
        }
        
        case 'autoMatch':
          // This is handled by AUTO_MATCH_STEP
          return state;
          
        default:
          return state;
      }
    }
    
    case Actions.AUTO_MATCH_STEP: {
      if (state.playState !== PlayState.AUTO_MATCHING) return state;
      
      const remainingTiles = [];
      state.board.forEach((row, ri) => {
        row.forEach((tile, ci) => {
          if (tile) remainingTiles.push({ row: ri, col: ci, tile });
        });
      });
      
      const step = state.autoMatchStep;
      
      if (step < 3) {
        // Select next tile
        return {
          ...state,
          selectedTiles: [...state.selectedTiles, remainingTiles[step]],
          autoMatchStep: step + 1
        };
      } else {
        // All selected, now match them
        return {
          ...state,
          playState: PlayState.MATCHING,
          animation: 'match',
          animatingTiles: state.selectedTiles,
          score: state.score + 100,
          matches: state.matches + 1,
          timeRemaining: Math.min(state.timeRemaining + 5, 30)
        };
      }
    }
    
    case Actions.TIMER_TICK: {
      if (!state.timerRunning) return state;
      
      const newTime = state.timeRemaining - 1;
      if (newTime <= 0) {
        return {
          ...state,
          phase: GamePhase.GAME_OVER,
          playState: null,
          timerRunning: false,
          timeRemaining: 0
        };
      }
      
      return {
        ...state,
        timeRemaining: newTime
      };
    }
    
    default:
      return state;
  }
}

// Game store with reducer
class GameStore {
  constructor() {
    this.state = createInitialState();
    this.listeners = new Set();
    this.timerId = null;
    this.animationTimeouts = new Set();
  }
  
  // Dispatch actions
  dispatch(action) {
    const prevState = this.state;
    this.state = gameReducer(this.state, action);
    
    // Handle side effects based on state changes
    this.handleSideEffects(prevState, this.state);
    
    // Notify listeners
    this.notify();
  }
  
  // Handle side effects (timers, animations)
  handleSideEffects(prevState, newState) {
    // Start/stop timer
    if (!prevState.timerRunning && newState.timerRunning) {
      this.startTimer();
    } else if (prevState.timerRunning && !newState.timerRunning) {
      this.stopTimer();
    }
    
    // Handle animation completions
    if (!prevState.animation && newState.animation) {
      const duration = {
        shake: 500,
        match: 600,
        autoMatch: 0 // Handled separately
      }[newState.animation];
      
      if (duration > 0) {
        const timeout = setTimeout(() => {
          this.dispatch({ type: Actions.ANIMATION_COMPLETE });
          this.animationTimeouts.delete(timeout);
        }, duration);
        this.animationTimeouts.add(timeout);
      }
    }
    
    // Handle auto-match sequence
    if (newState.playState === PlayState.AUTO_MATCHING && 
        prevState.playState !== PlayState.AUTO_MATCHING) {
      this.runAutoMatchSequence();
    }
    
    // Handle level complete
    if (newState.playState === PlayState.LEVEL_COMPLETE &&
        prevState.playState !== PlayState.LEVEL_COMPLETE) {
      setTimeout(() => {
        const nextLevel = newState.level + 1;
        this.dispatch({ 
          type: Actions.START_GAME,
          board: generateBoard(nextLevel),
          level: nextLevel
        });
      }, 2000);
    }
  }
  
  runAutoMatchSequence() {
    let delay = 300;
    
    // Select tiles one by one
    for (let i = 0; i < 3; i++) {
      setTimeout(() => {
        if (this.state.playState === PlayState.AUTO_MATCHING) {
          this.dispatch({ type: Actions.AUTO_MATCH_STEP });
        }
      }, delay);
      delay += 250;
    }
    
    // Final step triggers the match
    setTimeout(() => {
      if (this.state.playState === PlayState.AUTO_MATCHING) {
        this.dispatch({ type: Actions.AUTO_MATCH_STEP });
      }
    }, delay);
  }
  
  startTimer() {
    this.timerId = setInterval(() => {
      this.dispatch({ type: Actions.TIMER_TICK });
    }, 1000);
  }
  
  stopTimer() {
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
  }
  
  // Public API
  startGame() {
    const level = this.state.phase === GamePhase.GAME_OVER ? 1 : this.state.level;
    this.dispatch({ 
      type: Actions.START_GAME,
      board: generateBoard(level),
      level: level
    });
  }
  
  selectTile(row, col) {
    this.dispatch({ 
      type: Actions.SELECT_TILE, 
      row, 
      col 
    });
  }
  
  // Subscribe pattern
  subscribe(fn) {
    this.listeners.add(fn);
    fn(this.state); // Call immediately with current state
    return () => this.listeners.delete(fn);
  }
  
  notify() {
    this.listeners.forEach(fn => fn(this.state));
  }
  
  // Cleanup
  destroy() {
    this.stopTimer();
    this.animationTimeouts.forEach(timeout => clearTimeout(timeout));
    this.animationTimeouts.clear();
    this.listeners.clear();
  }
}

// Helper function to derive UI state - no booleans needed!
function deriveUIState(state) {
  return {
    // What screen to show
    showMenu: state.phase === GamePhase.MENU,
    showGame: state.phase === GamePhase.PLAYING,
    showGameOver: state.phase === GamePhase.GAME_OVER,
    
    // Can user interact?
    canInteract: state.phase === GamePhase.PLAYING && 
                 !state.animation &&
                 state.playState !== PlayState.AUTO_MATCHING,
    
    // New game button
    newGameDisabled: state.phase === GamePhase.PLAYING && 
                     state.playState === PlayState.WAITING_FIRST_MOVE,
    
    // Visual effects
    showErrorPulse: state.animation === 'shake',
    timerWarning: state.timeRemaining <= 10,
    
    // Which tiles are faded
    fadedTypes: state.selectedTiles
      .map(pos => state.board[pos.row][pos.col]?.type)
      .filter(Boolean),
    
    // Message to show
    neededTypes: deriveNeededTypes(state.selectedTiles, state.board),
    
    // Per-tile states
    getTileState: (row, col) => {
      const isSelected = state.selectedTiles.some(
        t => t.row === row && t.col === col
      );
      const isAnimating = state.animatingTiles.some(
        t => t.row === row && t.col === col
      );
      
      return {
        isSelected,
        isShaking: isAnimating && state.animation === 'shake',
        isMatching: isAnimating && state.animation === 'match',
        tile: state.board[row][col]
      };
    }
  };
}

// Usage example (commented out to avoid conflicts with HTML file)
// const game = new GameStore();
// 
// game.subscribe(state => {
//   const ui = deriveUIState(state);
//   // ... update UI
// });

// Helper functions
function generateBoard(level) {
  const kanaMap = [
    { hiragana: "あ", katakana: "ア", romaji: "a" },
    { hiragana: "い", katakana: "イ", romaji: "i" },
    { hiragana: "う", katakana: "ウ", romaji: "u" },
    { hiragana: "え", katakana: "エ", romaji: "e" },
    { hiragana: "お", katakana: "オ", romaji: "o" },
    { hiragana: "か", katakana: "カ", romaji: "ka" },
    { hiragana: "き", katakana: "キ", romaji: "ki" },
    { hiragana: "く", katakana: "ク", romaji: "ku" },
    { hiragana: "け", katakana: "ケ", romaji: "ke" },
    { hiragana: "こ", katakana: "コ", romaji: "ko" },
    { hiragana: "さ", katakana: "サ", romaji: "sa" },
    { hiragana: "し", katakana: "シ", romaji: "shi" },
    { hiragana: "す", katakana: "ス", romaji: "su" },
    { hiragana: "せ", katakana: "セ", romaji: "se" },
    { hiragana: "そ", katakana: "ソ", romaji: "so" },
    { hiragana: "た", katakana: "タ", romaji: "ta" },
    { hiragana: "ち", katakana: "チ", romaji: "chi" },
    { hiragana: "つ", katakana: "ツ", romaji: "tsu" },
    { hiragana: "て", katakana: "テ", romaji: "te" },
    { hiragana: "と", katakana: "ト", romaji: "to" },
    { hiragana: "な", katakana: "ナ", romaji: "na" },
    { hiragana: "に", katakana: "ニ", romaji: "ni" },
    { hiragana: "ぬ", katakana: "ヌ", romaji: "nu" },
    { hiragana: "ね", katakana: "ネ", romaji: "ne" },
    { hiragana: "の", katakana: "ノ", romaji: "no" },
    { hiragana: "は", katakana: "ハ", romaji: "ha" },
    { hiragana: "ひ", katakana: "ヒ", romaji: "hi" },
    { hiragana: "ふ", katakana: "フ", romaji: "fu" },
    { hiragana: "へ", katakana: "ヘ", romaji: "he" },
    { hiragana: "ほ", katakana: "ホ", romaji: "ho" },
    { hiragana: "ま", katakana: "マ", romaji: "ma" },
    { hiragana: "み", katakana: "ミ", romaji: "mi" },
    { hiragana: "む", katakana: "ム", romaji: "mu" },
    { hiragana: "め", katakana: "メ", romaji: "me" },
    { hiragana: "も", katakana: "モ", romaji: "mo" },
    { hiragana: "や", katakana: "ヤ", romaji: "ya" },
    { hiragana: "ゆ", katakana: "ユ", romaji: "yu" },
    { hiragana: "よ", katakana: "ヨ", romaji: "yo" },
    { hiragana: "ら", katakana: "ラ", romaji: "ra" },
    { hiragana: "り", katakana: "リ", romaji: "ri" },
    { hiragana: "る", katakana: "ル", romaji: "ru" },
    { hiragana: "れ", katakana: "レ", romaji: "re" },
    { hiragana: "ろ", katakana: "ロ", romaji: "ro" },
    { hiragana: "わ", katakana: "ワ", romaji: "wa" },
    { hiragana: "を", katakana: "ヲ", romaji: "wo" },
    { hiragana: "ん", katakana: "ン", romaji: "n" }
  ];
  
  // Create random indices array
  const allIndices = Array.from({length: kanaMap.length}, (_, i) => i);
  
  // Fisher-Yates shuffle
  for (let i = allIndices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [allIndices[i], allIndices[j]] = [allIndices[j], allIndices[i]];
  }
  
  // Take 12 random kana
  const kanaPool = allIndices.slice(0, 12).map(i => kanaMap[i]);
  
  // Create tiles (3 per kana - hiragana, katakana, romaji)
  const tiles = [];
  kanaPool.forEach((kana, poolIndex) => {
    const kanaIndex = kanaMap.findIndex(k => k.hiragana === kana.hiragana);
    
    tiles.push({
      kana: kana,
      kanaIndex: kanaIndex,
      type: 'hiragana',
      display: kana.hiragana
    });
    tiles.push({
      kana: kana,
      kanaIndex: kanaIndex,
      type: 'katakana',
      display: kana.katakana
    });
    tiles.push({
      kana: kana,
      kanaIndex: kanaIndex,
      type: 'romaji',
      display: kana.romaji
    });
  });
  
  // Shuffle tiles
  for (let i = tiles.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [tiles[i], tiles[j]] = [tiles[j], tiles[i]];
  }
  
  // Create 6x6 board
  const board = [];
  let tileIndex = 0;
  
  for (let row = 0; row < 6; row++) {
    board[row] = [];
    for (let col = 0; col < 6; col++) {
      board[row][col] = tiles[tileIndex++];
    }
  }
  
  return board;
}

function deriveNeededTypes(selectedTiles, board) {
  if (selectedTiles.length === 0) return [];
  
  const selectedTypes = selectedTiles
    .map(pos => board[pos.row][pos.col]?.type)
    .filter(Boolean);
  
  const allTypes = ['hiragana', 'katakana', 'romaji'];
  return allTypes.filter(type => !selectedTypes.includes(type));
}