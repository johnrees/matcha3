# Matcha3! Idiomatic XState Implementation

This is a refactored version that follows XState best practices by using states instead of boolean flags and deriving all UI effects from state.

```typescript
import { setup, assign, fromCallback } from 'xstate';

interface GameContext {
  // Pure game data only - no UI state
  board: (Tile | null)[][];
  selectedTiles: Position[];
  score: number;
  matches: number;
  level: number;
  timeRemaining: number;
  
  // All UI state is derived from machine state
}

const gameMachine = setup({
  types: {} as {
    context: GameContext;
    events:
      | { type: 'START_GAME' }
      | { type: 'SELECT_TILE'; row: number; col: number }
      | { type: 'SHOW_HINT' }
      | { type: 'TIMER_TICK' };
  },
  actions: {
    initializeGame: assign({
      board: () => generateBoard(),
      selectedTiles: [],
      score: 0,
      matches: 0,
      timeRemaining: 30
    }),
    
    selectTile: assign({
      selectedTiles: ({ context, event }) => {
        const { row, col } = event as { row: number; col: number };
        const pos = { row, col };
        
        // Toggle selection if already selected
        const existing = context.selectedTiles.findIndex(
          t => t.row === row && t.col === col
        );
        if (existing !== -1) {
          return context.selectedTiles.filter((_, i) => i !== existing);
        }
        
        // Don't select if same type already selected
        const tile = context.board[row][col];
        if (!tile) return context.selectedTiles;
        
        const hasSameType = context.selectedTiles.some(t => {
          const selected = context.board[t.row][t.col];
          return selected?.type === tile.type;
        });
        
        if (hasSameType) return context.selectedTiles;
        
        return [...context.selectedTiles, pos];
      }
    }),
    
    clearSelection: assign({
      selectedTiles: []
    }),
    
    processMatch: assign({
      score: ({ context }) => context.score + 100,
      matches: ({ context }) => context.matches + 1,
      timeRemaining: ({ context }) => Math.min(context.timeRemaining + 5, 30),
      board: ({ context }) => {
        const newBoard = context.board.map(row => [...row]);
        context.selectedTiles.forEach(({ row, col }) => {
          newBoard[row][col] = null;
        });
        return newBoard;
      },
      selectedTiles: []
    }),
    
    decrementTimer: assign({
      timeRemaining: ({ context }) => context.timeRemaining - 1
    }),
    
    advanceLevel: assign({
      level: ({ context }) => context.level + 1
    })
  },
  
  guards: {
    hasThreeTiles: ({ context }) => context.selectedTiles.length === 3,
    
    hasTwoTiles: ({ context }) => context.selectedTiles.length === 2,
    
    isValidMatch: ({ context }) => {
      if (context.selectedTiles.length !== 3) return false;
      const tiles = context.selectedTiles.map(pos => context.board[pos.row][pos.col]);
      if (tiles.some(t => !t)) return false;
      return tiles.every(t => t!.kanaIndex === tiles[0]!.kanaIndex);
    },
    
    isEarlyMismatch: ({ context }) => {
      if (context.selectedTiles.length !== 2) return false;
      const [t1, t2] = context.selectedTiles.map(pos => context.board[pos.row][pos.col]);
      return t1?.kanaIndex !== t2?.kanaIndex;
    },
    
    isTimeUp: ({ context }) => context.timeRemaining <= 0,
    
    hasOnlyThreeTiles: ({ context }) => {
      const remaining = context.board.flat().filter(t => t !== null).length;
      return remaining === 3;
    },
    
    isLevelComplete: ({ context }) => context.matches >= 12
  },
  
  delays: {
    shakeAnimation: 500,
    matchAnimation: 600,
    autoMatchDelay: 300,
    autoMatchStep: 250,
    levelMessage: 2000
  }
}).createMachine({
  id: 'matcha3',
  initial: 'menu',
  context: {
    board: [],
    selectedTiles: [],
    score: 0,
    matches: 0,
    level: 1,
    timeRemaining: 30
  },
  
  states: {
    menu: {
      on: {
        START_GAME: {
          target: 'playing',
          actions: 'initializeGame'
        }
      }
    },
    
    playing: {
      type: 'parallel',
      
      states: {
        // Game flow state
        game: {
          initial: 'selecting',
          
          states: {
            selecting: {
              always: [
                // Check for early mismatch (2 tiles)
                {
                  target: 'shaking',
                  guard: 'isEarlyMismatch'
                },
                // Check for complete selection (3 tiles)
                {
                  target: 'validating',
                  guard: 'hasThreeTiles'
                }
              ],
              
              on: {
                SELECT_TILE: {
                  actions: 'selectTile'
                },
                SHOW_HINT: 'hinting'
              },
              
              // Check for auto-match after any change
              always: {
                target: 'autoMatching',
                guard: 'hasOnlyThreeTiles'
              }
            },
            
            shaking: {
              tags: ['error'],
              after: {
                shakeAnimation: {
                  target: 'selecting',
                  actions: 'clearSelection'
                }
              }
            },
            
            validating: {
              always: [
                {
                  target: 'matching',
                  guard: 'isValidMatch'
                },
                {
                  target: 'shaking'
                }
              ]
            },
            
            matching: {
              tags: ['animating'],
              entry: 'processMatch',
              after: {
                matchAnimation: [
                  {
                    target: 'levelComplete',
                    guard: 'isLevelComplete'
                  },
                  {
                    target: 'selecting'
                  }
                ]
              }
            },
            
            autoMatching: {
              tags: ['animating', 'auto'],
              initial: 'preparing',
              
              states: {
                preparing: {
                  after: {
                    autoMatchDelay: 'step1'
                  }
                },
                step1: {
                  entry: 'selectFirstTile',
                  after: {
                    autoMatchStep: 'step2'
                  }
                },
                step2: {
                  entry: 'selectSecondTile',
                  after: {
                    autoMatchStep: 'step3'
                  }
                },
                step3: {
                  entry: 'selectThirdTile',
                  after: {
                    autoMatchStep: '#matcha3.playing.game.matching'
                  }
                }
              }
            },
            
            levelComplete: {
              tags: ['message'],
              after: {
                levelMessage: {
                  target: 'selecting',
                  actions: ['advanceLevel', 'initializeGame']
                }
              }
            },
            
            hinting: {
              tags: ['hint'],
              after: {
                2000: 'selecting'
              }
            }
          }
        },
        
        // Timer state
        timer: {
          initial: 'waiting',
          
          states: {
            waiting: {
              on: {
                SELECT_TILE: 'running'
              }
            },
            
            running: {
              invoke: {
                src: fromCallback(({ sendBack }) => {
                  const interval = setInterval(() => {
                    sendBack({ type: 'TIMER_TICK' });
                  }, 1000);
                  
                  return () => clearInterval(interval);
                })
              },
              
              on: {
                TIMER_TICK: [
                  {
                    target: 'expired',
                    guard: 'isTimeUp'
                  },
                  {
                    actions: 'decrementTimer'
                  }
                ]
              },
              
              // Pause during auto-match
              always: {
                target: 'paused',
                in: '#matcha3.playing.game.autoMatching'
              }
            },
            
            paused: {
              always: {
                target: 'running',
                guard: { 
                  type: 'not', 
                  params: { in: '#matcha3.playing.game.autoMatching' }
                }
              }
            },
            
            expired: {
              type: 'final'
            }
          }
        }
      },
      
      // When timer expires, game over
      onDone: {
        target: 'gameOver'
      }
    },
    
    gameOver: {
      tags: ['gameOver'],
      after: {
        2000: 'menu'
      },
      on: {
        START_GAME: {
          target: 'playing',
          actions: 'initializeGame'
        }
      }
    }
  }
});
```

## Key Improvements

### 1. No Boolean Flags
Instead of `isAnimating`, `isAutoMatching`, etc., we use:
- **State nodes**: `shaking`, `matching`, `autoMatching`
- **Tags**: `['animating']`, `['error']`, `['auto']`
- **Parallel states**: Timer runs independently

### 2. All UI Effects Derived from State
```typescript
// All UI state is computed from machine state
function deriveUIState(state: State<typeof gameMachine>) {
  const { context } = state;
  
  return {
    // Animation states
    isAnimating: state.hasTag('animating'),
    showShakeAnimation: state.matches('playing.game.shaking'),
    showMatchAnimation: state.matches('playing.game.matching'),
    showErrorPulse: state.hasTag('error'),
    
    // Interaction states
    canInteract: state.matches('playing.game.selecting') && !state.hasTag('animating'),
    canStartNewGame: !state.matches('playing.timer.waiting'),
    
    // Visual states
    showHint: state.hasTag('hint'),
    isAutoMode: state.hasTag('auto'),
    timerWarning: context.timeRemaining <= 10,
    
    // Derived data
    fadedTypes: context.selectedTiles
      .map(pos => context.board[pos.row][pos.col]?.type)
      .filter(Boolean) as TileType[],
    
    neededTypes: deriveNeededTypes(context.selectedTiles, context.board),
    
    // Per-tile states (computed in tile component)
    getTileState: (row: number, col: number) => ({
      isSelected: context.selectedTiles.some(t => t.row === row && t.col === col),
      tile: context.board[row][col]
    })
  };
}

// Helper to derive needed types
function deriveNeededTypes(selectedTiles: Position[], board: (Tile | null)[][]): TileType[] {
  if (selectedTiles.length === 0) return [];
  
  const selectedTypes = selectedTiles
    .map(pos => board[pos.row][pos.col]?.type)
    .filter(Boolean) as TileType[];
  
  const allTypes: TileType[] = ['hiragana', 'katakana', 'romaji'];
  return allTypes.filter(type => !selectedTypes.includes(type));
}
```

### 3. Cleaner Timer Management
- Timer is a parallel state machine
- Automatically pauses during auto-match using state guards
- No manual timer management needed

### 4. Animation Timing
- Uses `after` for all animations
- No need for setTimeout in actions
- Animations are part of state transitions

### 5. Complete UI Integration Example

```typescript
// Main game component
function Matcha3Game() {
  const [state, send] = useMachine(gameMachine);
  const ui = deriveUIState(state);
  
  return (
    <div className={`game-container ${ui.showErrorPulse ? 'error-pulse' : ''}`}>
      <h1>Matcha3! 🍵</h1>
      
      {state.matches('menu') && (
        <button onClick={() => send({ type: 'START_GAME' })}>
          Start Game
        </button>
      )}
      
      {state.matches('playing') && (
        <>
          <GameStats state={state} />
          <GameBoard state={state} send={send} />
          <ProgressBars state={state} />
          <GameControls state={state} send={send} />
        </>
      )}
      
      {state.matches('gameOver') && (
        <GameOverScreen state={state} send={send} />
      )}
    </div>
  );
}

// Game board component
function GameBoard({ state, send }: GameBoardProps) {
  const { context } = state;
  const ui = deriveUIState(state);
  
  return (
    <>
      <div className="needed-types">
        {ui.neededTypes.length > 0 
          ? `Need: ${ui.neededTypes.join(', ')}`
          : context.selectedTiles.length > 0 
            ? 'Complete! All 3 types selected'
            : 'Select 3 matching characters (one of each type)'
        }
      </div>
      
      <div className="game-board">
        {context.board.map((row, rowIndex) => 
          row.map((_, colIndex) => (
            <GameTile
              key={`${rowIndex}-${colIndex}`}
              row={rowIndex}
              col={colIndex}
              state={state}
              send={send}
            />
          ))
        )}
      </div>
    </>
  );
}

// Individual tile component - all UI state derived
function GameTile({ row, col, state, send }: GameTileProps) {
  const { context } = state;
  const ui = deriveUIState(state);
  const { isSelected, tile } = ui.getTileState(row, col);
  
  if (!tile) {
    return <div className="tile empty" />;
  }
  
  // Derive all visual states for this specific tile
  const isShaking = state.matches('playing.game.shaking') && isSelected;
  const isDisappearing = state.matches('playing.game.matching') && isSelected;
  const isFaded = !isSelected && ui.fadedTypes.includes(tile.type);
  const isHinted = state.hasTag('hint') && 
    findHintTiles(context.board).some(t => t.row === row && t.col === col);
  
  const className = [
    'tile',
    tile.type,
    isSelected && 'selected',
    isShaking && 'shake',
    isDisappearing && 'match-animation',
    isFaded && 'faded',
    isHinted && 'hint',
    !ui.canInteract && 'disabled'
  ].filter(Boolean).join(' ');
  
  return (
    <div
      className={className}
      onClick={() => ui.canInteract && send({ type: 'SELECT_TILE', row, col })}
      onTouchStart={(e) => {
        if (ui.canInteract) {
          e.preventDefault();
          send({ type: 'SELECT_TILE', row, col });
        }
      }}
    >
      {tile.display}
    </div>
  );
}

// Progress bars component
function ProgressBars({ state }: { state: State<typeof gameMachine> }) {
  const { context } = state;
  const ui = deriveUIState(state);
  
  return (
    <>
      <div className="progress-bar">
        <div 
          className="progress-fill"
          style={{ width: `${(context.matches / 12) * 100}%` }}
        />
      </div>
      
      <div className={`timer-bar ${ui.timerWarning ? 'warning' : ''}`}>
        <div 
          className={`timer-fill ${state.matches('playing.game.matching') ? 'bonus-animation' : ''}`}
          style={{ width: `${(context.timeRemaining / 30) * 100}%` }}
        />
      </div>
    </>
  );
}
```

### 6. Vanilla JavaScript Integration

```javascript
// Create state management
const gameActor = createActor(gameMachine);
let previousState = gameActor.getSnapshot();

// Subscribe to state changes
gameActor.subscribe((state) => {
  renderGame(state, previousState);
  previousState = state;
});

gameActor.start();

// Main render function
function renderGame(state, prevState) {
  const ui = deriveUIState(state);
  
  // Update container classes
  const container = document.querySelector('.game-container');
  container.classList.toggle('error-pulse', ui.showErrorPulse);
  
  // Render different screens based on state
  if (state.matches('menu')) {
    renderMenu();
  } else if (state.matches('playing')) {
    renderPlaying(state, ui);
  } else if (state.matches('gameOver')) {
    renderGameOver(state);
  }
}

// Render game board with all effects derived from state
function renderPlaying(state, ui) {
  const { context } = state;
  
  // Update stats
  document.getElementById('score').textContent = context.score;
  document.getElementById('matches').textContent = `${context.matches}/12`;
  document.getElementById('timer').textContent = `${context.timeRemaining}s`;
  
  // Update needed types message
  const messageEl = document.querySelector('.needed-types');
  messageEl.textContent = ui.neededTypes.length > 0 
    ? `Need: ${ui.neededTypes.join(', ')}`
    : context.selectedTiles.length > 0 
      ? 'Complete! All 3 types selected'
      : 'Select 3 matching characters (one of each type)';
  
  // Render tiles
  const board = document.getElementById('gameBoard');
  board.innerHTML = '';
  
  context.board.forEach((row, rowIndex) => {
    row.forEach((tile, colIndex) => {
      const tileEl = createTileElement(tile, rowIndex, colIndex, state, ui);
      board.appendChild(tileEl);
    });
  });
  
  // Update button states
  document.getElementById('newGameBtn').disabled = !ui.canStartNewGame;
}

function createTileElement(tile, row, col, state, ui) {
  const div = document.createElement('div');
  
  if (!tile) {
    div.className = 'tile empty';
    return div;
  }
  
  const { isSelected } = ui.getTileState(row, col);
  
  // Derive all states for this tile
  const classes = ['tile', tile.type];
  
  if (isSelected) {
    classes.push('selected');
    if (state.matches('playing.game.shaking')) classes.push('shake');
    if (state.matches('playing.game.matching')) classes.push('match-animation');
  }
  
  if (!isSelected && ui.fadedTypes.includes(tile.type)) {
    classes.push('faded');
  }
  
  if (!ui.canInteract) {
    classes.push('disabled');
  }
  
  div.className = classes.join(' ');
  div.textContent = tile.display;
  div.dataset.row = row;
  div.dataset.col = col;
  
  if (ui.canInteract) {
    div.addEventListener('click', () => {
      gameActor.send({ type: 'SELECT_TILE', row, col });
    });
  }
  
  return div;
}
```

### 7. CSS Classes Based on State

```css
/* Base styles */
.tile {
  transition: all 0.3s ease;
}

/* State-based animations */
.tile.shake {
  animation: shake 0.5s ease-in-out;
}

.tile.match-animation {
  animation: disappear 0.6s ease-out forwards;
}

.tile.faded {
  opacity: 0.15;
  filter: grayscale(50%);
}

.tile.hint {
  box-shadow: 0 0 20px gold;
}

.tile.disabled {
  pointer-events: none;
}

/* Container states */
.game-container.error-pulse {
  animation: pulse-red 0.5s ease-in-out;
}

/* Timer states */
.timer-bar.warning .timer-fill {
  background: #ff4444;
  animation: pulse 1s infinite;
}

.timer-fill.bonus-animation {
  animation: bonus-flash 0.3s ease-out;
}
```

### 8. Benefits of This Approach

1. **Single Source of Truth**: All UI state flows from machine state
2. **No Synchronization Issues**: UI automatically reflects current state
3. **Testable Without UI**: Can test all game logic without rendering
4. **Time Travel Debugging**: Can replay states and UI follows
5. **Framework Agnostic**: Same state machine works everywhere
6. **Performance**: Only re-compute/re-render what changes
7. **Maintainable**: Clear separation between logic and presentation

### 9. Common Patterns

```typescript
// Pattern 1: Derive complex UI state
const shouldShowTutorial = state.matches('playing.game.waitingForFirstMove');
const isFirstTimePlayer = state.context.matches === 0 && state.context.level === 1;

// Pattern 2: Compute animations from transitions
const justMatched = state.matches('playing.game.matching') && 
                   !prevState.matches('playing.game.matching');

// Pattern 3: Aggregate multiple states
const isInMenu = state.matches('menu') || state.matches('gameOver');

// Pattern 4: Conditional classes
const containerClasses = [
  'game-container',
  state.hasTag('error') && 'error-pulse',
  state.matches('playing.timer.expired') && 'game-over',
  state.context.timeRemaining <= 5 && 'urgent'
].filter(Boolean).join(' ');
```

This approach ensures that your UI is always a pure function of your state machine's current state, making it predictable, testable, and easy to reason about.