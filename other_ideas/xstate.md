# Matcha3! XState Conversion Plan

## Overview

This document outlines a comprehensive plan to convert the Matcha3! game from its current imperative state management to a declarative state machine using XState v5. The state machine will handle all game logic, animations, timers, and user interactions in a predictable and testable manner.

## Benefits of XState Conversion

1. **Predictable State Transitions**: All state changes are explicit and documented
2. **Impossible States Prevention**: Can't be in conflicting states (e.g., game over while auto-matching)
3. **Visual Debugging**: Can visualize and inspect state machine in XState Inspector
4. **Better Testing**: State machines are highly testable with deterministic behavior
5. **Time Travel Debugging**: Can replay state transitions
6. **Separation of Concerns**: UI rendering separate from business logic

## State Machine Architecture

### Main State Machine: `gameMachine`

The root machine will manage the overall game lifecycle with parallel states for different aspects of the game.

```typescript
import { setup, assign, fromCallback, fromPromise } from 'xstate';

interface GameContext {
  // Game board
  board: (Tile | null)[][];
  kanaPool: KanaFamily[];
  
  // Selection state
  selectedTiles: Position[];
  
  // Game progress
  score: number;
  matches: number;
  totalMatches: number;
  level: number;
  
  // Timer
  timeRemaining: number;
  
  // UI state - these are derived from machine state
  fadedTypes: TileType[];
  neededTypes: TileType[];
  
  // Temporary animation data
  comboPosition?: Position;
  currentMessage?: string;
}

interface Tile {
  kana: KanaFamily;
  kanaIndex: number;
  type: TileType;
  display: string;
}

interface KanaFamily {
  hiragana: string;
  katakana: string;
  romaji: string;
}

interface Position {
  row: number;
  col: number;
}

type TileType = 'hiragana' | 'katakana' | 'romaji';

const gameMachine = setup({
  types: {} as {
    context: GameContext;
    events:
      | { type: 'START_GAME' }
      | { type: 'CLICK_TILE'; row: number; col: number }
      | { type: 'TOUCH_TILE'; row: number; col: number }
      | { type: 'SHOW_HINT' }
      | { type: 'TIMER_TICK' }
      | { type: 'SHAKE_COMPLETE' }
      | { type: 'MATCH_ANIMATION_COMPLETE' }
      | { type: 'AUTO_MATCH_STEP' }
      | { type: 'LEVEL_TRANSITION_COMPLETE' }
      | { type: 'MESSAGE_TIMEOUT' };
  },
  actions: {
    initializeBoard: assign({
      board: ({ context }) => generateBoard(context.level),
      kanaPool: ({ context }) => selectKanaForLevel(context.level),
      selectedTiles: [],
      matches: 0,
      score: 0,
      timeRemaining: 30,
      totalMatches: 12,
      hasStarted: false,
      isGameOver: false,
      isAnimating: false,
      isAutoMatching: false,
      fadedTypes: [],
      shakePositions: [],
      matchAnimationPositions: [],
      errorPulseActive: false,
      newGameButtonDisabled: true
    }),
    
    selectTile: assign({
      selectedTiles: ({ context, event }) => {
        const { row, col } = event as { row: number; col: number };
        return [...context.selectedTiles, { row, col }];
      },
      fadedTypes: ({ context, event }) => {
        const { row, col } = event as { row: number; col: number };
        const tile = context.board[row][col];
        if (!tile) return context.fadedTypes;
        return [...context.fadedTypes, tile.type];
      }
    }),
    
    deselectTile: assign({
      selectedTiles: ({ context, event }) => {
        const { row, col } = event as { row: number; col: number };
        return context.selectedTiles.filter(
          pos => pos.row !== row || pos.col !== col
        );
      },
      fadedTypes: ({ context }) => {
        // Recalculate faded types based on remaining selections
        return context.selectedTiles
          .map(pos => context.board[pos.row][pos.col]?.type)
          .filter(Boolean) as TileType[];
      }
    }),
    
    shakeInvalidMatch: assign({
      shakePositions: ({ context }) => context.selectedTiles,
      errorPulseActive: true
    }),
    
    clearShake: assign({
      shakePositions: [],
      errorPulseActive: false
    }),
    
    enableNewGameButton: assign({
      newGameButtonDisabled: false
    }),
    
    disableNewGameButton: assign({
      newGameButtonDisabled: true
    }),
    
    processMatch: assign({
      score: ({ context }) => context.score + 100,
      matches: ({ context }) => context.matches + 1,
      timeRemaining: ({ context }) => Math.min(context.timeRemaining + 5, 30),
      bonusTimeAnimation: true,
      matchAnimationPositions: ({ context }) => context.selectedTiles,
      comboPosition: ({ context }) => {
        const centerX = context.selectedTiles.reduce((sum, t) => sum + t.col, 0) / 3;
        const centerY = context.selectedTiles.reduce((sum, t) => sum + t.row, 0) / 3;
        return { row: centerY, col: centerX };
      }
    }),
    
    removeTiles: assign({
      board: ({ context }) => {
        const newBoard = context.board.map(row => [...row]);
        context.selectedTiles.forEach(({ row, col }) => {
          newBoard[row][col] = null;
        });
        return newBoard;
      },
      selectedTiles: [],
      fadedTypes: [],
      matchAnimationPositions: [],
      comboPosition: undefined,
      bonusTimeAnimation: false
    }),
    
    decrementTimer: assign({
      timeRemaining: ({ context }) => context.timeRemaining - 1
    }),
    
    updateNeededTypes: assign({
      neededTypes: ({ context }) => {
        if (context.selectedTiles.length === 0) return [];
        
        const selectedTypes = context.selectedTiles
          .map(pos => context.board[pos.row][pos.col]?.type)
          .filter(Boolean) as TileType[];
        
        const allTypes: TileType[] = ['hiragana', 'katakana', 'romaji'];
        return allTypes.filter(type => !selectedTypes.includes(type));
      }
    }),
    
    showMessage: assign({
      currentMessage: (_, event: any) => event.message
    }),
    
    clearMessage: assign({
      currentMessage: undefined
    }),
    
    prepareAutoMatch: assign({
      selectedTiles: ({ context }) => {
        const remainingTiles = getRemainingTiles(context.board);
        return remainingTiles.sort((a, b) => {
          const typeOrder = { hiragana: 0, katakana: 1, romaji: 2 };
          const tileA = context.board[a.row][a.col]!;
          const tileB = context.board[b.row][b.col]!;
          return typeOrder[tileA.type] - typeOrder[tileB.type];
        });
      }
    }),
    
    selectNextAutoMatchTile: assign({
      selectedTiles: ({ context }) => {
        // This is handled by the AUTO_MATCH_NEXT event
        return context.selectedTiles;
      }
    }),
    
    advanceLevel: assign({
      level: ({ context }) => context.level + 1
    }),
    
    resetToLevel1: assign({
      level: 1
    })
  },
  
  guards: {
    isTileSelected: ({ context, event }) => {
      const { row, col } = event as { row: number; col: number };
      return context.selectedTiles.some(
        pos => pos.row === row && pos.col === col
      );
    },
    
    isTileTypeAlreadySelected: ({ context, event }) => {
      const { row, col } = event as { row: number; col: number };
      const tile = context.board[row][col];
      if (!tile) return false;
      
      return context.selectedTiles.some(pos => {
        const selectedTile = context.board[pos.row][pos.col];
        return selectedTile?.type === tile.type;
      });
    },
    
    hasThreeTilesSelected: ({ context }) => {
      return context.selectedTiles.length === 3;
    },
    
    isTwoTilesSelected: ({ context }) => {
      return context.selectedTiles.length === 2;
    },
    
    isValidMatch: ({ context }) => {
      if (context.selectedTiles.length !== 3) return false;
      
      const tiles = context.selectedTiles.map(
        pos => context.board[pos.row][pos.col]
      );
      
      if (tiles.some(t => !t)) return false;
      
      const kanaIndex = tiles[0]!.kanaIndex;
      return tiles.every(t => t!.kanaIndex === kanaIndex);
    },
    
    isEarlyMismatch: ({ context }) => {
      if (context.selectedTiles.length !== 2) return false;
      
      const [tile1, tile2] = context.selectedTiles.map(
        pos => context.board[pos.row][pos.col]
      );
      
      return tile1?.kanaIndex !== tile2?.kanaIndex;
    },
    
    isTimeUp: ({ context }) => {
      return context.timeRemaining <= 0;
    },
    
    hasOnlyThreeTilesLeft: ({ context }) => {
      const remainingCount = context.board
        .flat()
        .filter(tile => tile !== null).length;
      return remainingCount === 3;
    },
    
    isLevelComplete: ({ context }) => {
      return context.matches === context.totalMatches;
    },
    
    
    isAutoMatchComplete: ({ context, event }) => {
      // Used during auto-match sequence
      return context.selectedTiles.length === 3;
    }
  },
  
  delays: {
    shakeAnimation: 500,
    matchAnimation: 600,
    messageDisplay: 2000,
    autoMatchDelay: 300,
    autoMatchStagger: 250,
    levelTransition: 2000
  }
}).createMachine({
  id: 'matcha3',
  initial: 'menu',
  context: {
    board: [],
    kanaPool: [],
    selectedTiles: [],
    score: 0,
    matches: 0,
    totalMatches: 12,
    level: 1,
    timeRemaining: 30,
    hasStarted: false,
    isGameOver: false,
    isAnimating: false,
    isAutoMatching: false,
    fadedTypes: [],
    shakePositions: [],
    matchAnimationPositions: [],
    bonusTimeAnimation: false,
    errorPulseActive: false,
    neededTypes: [],
    newGameButtonDisabled: true
  },
  
  states: {
    menu: {
      on: {
        START_GAME: {
          target: 'playing',
          actions: ['initializeBoard']
        }
      }
    },
    
    playing: {
      type: 'parallel',
      
      states: {
        game: {
          initial: 'waitingForFirstMove',
          
          states: {
            waitingForFirstMove: {
              on: {
                CLICK_TILE: {
                  target: 'active',
                  actions: ['selectTile', 'updateNeededTypes', 'enableNewGameButton']
                },
                TOUCH_TILE: {
                  target: 'active',
                  actions: ['selectTile', 'updateNeededTypes', 'enableNewGameButton']
                }
              }
            },
            
            active: {
              initial: 'selecting',
              
              states: {
                selecting: {
                  always: [
                    {
                      target: 'checkingMatch',
                      guard: 'hasThreeTilesSelected'
                    },
                    {
                      target: 'mismatchShake',
                      guard: 'isEarlyMismatch'
                    }
                  ],
                  
                  on: {
                    CLICK_TILE: [
                      {
                        guard: 'isTileSelected',
                        actions: ['deselectTile', 'updateNeededTypes']
                      },
                      {
                        guard: 'isTileTypeAlreadySelected',
                        // Do nothing - can't select same type twice
                      },
                      {
                        actions: ['selectTile', 'updateNeededTypes']
                      }
                    ],
                    TOUCH_TILE: [
                      {
                        guard: 'isTileSelected',
                        actions: ['deselectTile', 'updateNeededTypes']
                      },
                      {
                        guard: 'isTileTypeAlreadySelected',
                        // Do nothing
                      },
                      {
                        actions: ['selectTile', 'updateNeededTypes']
                      }
                    ],
                    SHOW_HINT: 'showingHint'
                  }
                },
                
                mismatchShake: {
                  entry: ['shakeInvalidMatch'],
                  after: {
                    shakeAnimation: {
                      target: 'selecting',
                      actions: ['clearShake', 'clearSelection', 'updateNeededTypes']
                    }
                  }
                },
                
                checkingMatch: {
                  always: [
                    {
                      target: 'matchAnimation',
                      guard: 'isValidMatch',
                      actions: ['processMatch']
                    },
                    {
                      target: 'mismatchShake',
                      actions: [{ type: 'showMessage', params: { message: 'Not the same sound!' }}]
                    }
                  ]
                },
                
                matchAnimation: {
                  after: {
                    matchAnimation: [
                      {
                        target: 'checkingAutoMatch',
                        actions: ['removeTiles']
                      }
                    ]
                  }
                },
                
                checkingAutoMatch: {
                  always: [
                    {
                      target: 'autoMatching',
                      guard: 'hasOnlyThreeTilesLeft'
                    },
                    {
                      target: 'checkingLevelComplete'
                    }
                  ]
                },
                
                autoMatching: {
                  initial: 'preparing',
                  
                  states: {
                    preparing: {
                      entry: ['prepareAutoMatch'],
                      after: {
                        autoMatchDelay: 'selecting'
                      }
                    },
                    
                    selecting: {
                      entry: ['selectNextAutoMatchTile', 'updateNeededTypes'],
                      after: {
                        autoMatchStagger: [
                          {
                            target: 'selecting',
                            guard: { type: 'not', params: 'isAutoMatchComplete' }
                          },
                          {
                            target: 'processing'
                          }
                        ]
                      }
                    },
                    
                    processing: {
                      after: {
                        400: '#matcha3.playing.game.active.checkingMatch'
                      }
                    }
                  }
                },
                
                checkingLevelComplete: {
                  always: [
                    {
                      target: 'levelComplete',
                      guard: 'isLevelComplete'
                    },
                    {
                      target: 'selecting'
                    }
                  ]
                },
                
                levelComplete: {
                  entry: [{ type: 'showMessage', params: { message: 'Level Complete! 🎉' }}],
                  after: {
                    levelTransition: {
                      target: '#matcha3.playing.game.waitingForFirstMove',
                      actions: ['advanceLevel', 'initializeBoard', 'disableNewGameButton']
                    }
                  }
                },
                
                showingHint: {
                  // Hint logic would highlight valid matches
                  after: {
                    2000: 'selecting'
                  }
                }
              }
            }
          }
        },
        
        timer: {
          initial: 'idle',
          
          states: {
            idle: {
              on: {
                CLICK_TILE: 'running',
                TOUCH_TILE: 'running'
              }
            },
            
            running: {
              invoke: {
                id: 'timer',
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
                    target: '#matcha3.gameOver',
                    guard: 'isTimeUp'
                  },
                  {
                    actions: ['decrementTimer']
                  }
                ]
              },
              
              // Pause timer during auto-match
              on: {
                AUTO_MATCH_START: 'paused'
              }
            },
            
            paused: {
              on: {
                AUTO_MATCH_COMPLETE: 'running'
              }
            }
          }
        }
      }
    },
    
    gameOver: {
      entry: [{ type: 'showMessage', params: { message: "Time's Up! Game Over" }}],
      after: {
        2000: 'menu'
      },
      on: {
        START_GAME: {
          target: 'playing',
          actions: ['resetToLevel1', 'initializeBoard', 'disableNewGameButton']
        }
      }
    }
  }
});
```

## UI Integration

### React Component Example

```typescript
import { useMachine } from '@xstate/react';
import { gameMachine } from './gameMachine';

function Matcha3Game() {
  const [state, send] = useMachine(gameMachine);
  const { context } = state;
  
  const handleTileClick = (row: number, col: number) => {
    send({ type: 'CLICK_TILE', row, col });
  };
  
  const handleTileTouch = (row: number, col: number, e: TouchEvent) => {
    e.preventDefault();
    send({ type: 'TOUCH_TILE', row, col });
  };
  
  const isGameActive = state.matches('playing');
  const isAutoMatching = state.matches('playing.game.active.autoMatching');
  const canInteract = isGameActive && !isAutoMatching;
  
  return (
    <div className={`game-container ${context.errorPulseActive ? 'error-pulse' : ''}`}>
      <h1>Matcha3! 🍵</h1>
      
      {state.matches('menu') && (
        <button onClick={() => send({ type: 'START_GAME' })}>
          Start Game
        </button>
      )}
      
      {isGameActive && (
        <>
          <div className="stats">
            <div className="stat">Score: <span>{context.score}</span></div>
            <div className="stat">
              Matches: <span>{context.matches}</span> / <span>{context.totalMatches}</span>
            </div>
            <div className="stat timer">
              Time: <span>{context.timeRemaining}</span>s
            </div>
          </div>
          
          <div className="needed-types">
            {context.neededTypes.length > 0 
              ? `Need: ${context.neededTypes.join(', ')}`
              : context.selectedTiles.length > 0 
                ? 'Complete! All 3 types selected'
                : 'Select 3 matching characters (one of each type)'
            }
          </div>
          
          <div className="game-board">
            {context.board.map((row, rowIndex) => 
              row.map((tile, colIndex) => {
                const position = { row: rowIndex, col: colIndex };
                const isSelected = context.selectedTiles.some(
                  p => p.row === rowIndex && p.col === colIndex
                );
                const isFaded = tile && context.fadedTypes.includes(tile.type) && !isSelected;
                const isShaking = context.shakePositions.some(
                  p => p.row === rowIndex && p.col === colIndex
                );
                const isAnimating = context.matchAnimationPositions.some(
                  p => p.row === rowIndex && p.col === colIndex
                );
                
                return (
                  <div
                    key={`${rowIndex}-${colIndex}`}
                    className={`tile ${tile?.type || 'empty'} 
                      ${isSelected ? 'selected' : ''} 
                      ${isFaded ? 'faded' : ''}
                      ${isShaking ? 'shake' : ''}
                      ${isAnimating ? 'match-animation' : ''}`}
                    onClick={() => canInteract && tile && handleTileClick(rowIndex, colIndex)}
                    onTouchStart={(e) => canInteract && tile && handleTileTouch(rowIndex, colIndex, e)}
                  >
                    {tile?.display}
                  </div>
                );
              })
            )}
          </div>
          
          <ProgressBar value={context.matches} max={context.totalMatches} />
          <TimerBar value={context.timeRemaining} max={30} warning={context.timeRemaining <= 10} />
          
          <div>
            <button 
              onClick={() => send({ type: 'START_GAME' })}
              disabled={context.newGameButtonDisabled}
            >
              New Game
            </button>
            <button onClick={() => send({ type: 'SHOW_HINT' })}>Show Hint</button>
          </div>
        </>
      )}
      
      {context.currentMessage && (
        <div className="message show">{context.currentMessage}</div>
      )}
    </div>
  );
}
```

### Vanilla JavaScript Integration

```javascript
import { createActor } from 'xstate';
import { gameMachine } from './gameMachine';

// Create the state machine actor
const gameActor = createActor(gameMachine);

// Subscribe to state changes
gameActor.subscribe((state) => {
  renderGame(state);
});

// Start the actor
gameActor.start();

// Send events
document.getElementById('gameBoard').addEventListener('click', (e) => {
  if (e.target.classList.contains('tile')) {
    const row = parseInt(e.target.dataset.row);
    const col = parseInt(e.target.dataset.col);
    gameActor.send({ type: 'CLICK_TILE', row, col });
  }
});

function renderGame(state) {
  const { context } = state;
  
  // Update score display
  document.getElementById('score').textContent = context.score;
  document.getElementById('matches').textContent = context.matches;
  document.getElementById('timer').textContent = context.timeRemaining;
  
  // Update board
  const gameBoard = document.getElementById('gameBoard');
  gameBoard.innerHTML = '';
  
  context.board.forEach((row, rowIndex) => {
    row.forEach((tile, colIndex) => {
      const tileElement = document.createElement('div');
      
      if (!tile) {
        tileElement.className = 'tile empty';
      } else {
        const isSelected = context.selectedTiles.some(
          p => p.row === rowIndex && p.col === colIndex
        );
        const isFaded = context.fadedTypes.includes(tile.type) && !isSelected;
        
        tileElement.className = `tile ${tile.type}`;
        if (isSelected) tileElement.classList.add('selected');
        if (isFaded) tileElement.classList.add('faded');
        
        tileElement.dataset.row = rowIndex;
        tileElement.dataset.col = colIndex;
        tileElement.textContent = tile.display;
      }
      
      gameBoard.appendChild(tileElement);
    });
  });
  
  // Update UI based on state
  if (state.matches('menu')) {
    // Show menu UI
  } else if (state.matches('playing')) {
    // Show game UI
  } else if (state.matches('gameOver')) {
    // Show game over UI
  }
}
```

## Helper Functions

```typescript
// Complete kana map with all 46 basic characters
const kanaMap: KanaFamily[] = [
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

function generateBoard(level: number): (Tile | null)[][] {
  // Select random kana for this level
  const allIndices = Array.from({length: kanaMap.length}, (_, i) => i);
  
  // Shuffle all indices
  for (let i = allIndices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [allIndices[i], allIndices[j]] = [allIndices[j], allIndices[i]];
  }
  
  // Take 12 random kana
  const kanaPool = allIndices.slice(0, 12).map(i => kanaMap[i]);
  
  // Create tiles
  const tiles: Tile[] = [];
  kanaPool.forEach((kana, index) => {
    const originalIndex = kanaMap.findIndex(k => k.hiragana === kana.hiragana);
    
    tiles.push({
      kana,
      kanaIndex: originalIndex,
      type: 'hiragana',
      display: kana.hiragana
    });
    tiles.push({
      kana,
      kanaIndex: originalIndex,
      type: 'katakana',
      display: kana.katakana
    });
    tiles.push({
      kana,
      kanaIndex: originalIndex,
      type: 'romaji',
      display: kana.romaji
    });
  });
  
  // Shuffle tiles
  for (let i = tiles.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [tiles[i], tiles[j]] = [tiles[j], tiles[i]];
  }
  
  // Fill board
  const board: (Tile | null)[][] = [];
  let tileIndex = 0;
  
  for (let row = 0; row < 6; row++) {
    board[row] = [];
    for (let col = 0; col < 6; col++) {
      board[row][col] = tiles[tileIndex++];
    }
  }
  
  return board;
}

function selectKanaForLevel(level: number): KanaFamily[] {
  // Always return 12 random kana
  const allIndices = Array.from({length: kanaMap.length}, (_, i) => i);
  
  // Shuffle all indices
  for (let i = allIndices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [allIndices[i], allIndices[j]] = [allIndices[j], allIndices[i]];
  }
  
  // Take 12 random kana
  return allIndices.slice(0, 12).map(i => kanaMap[i]);
}

function getRemainingTiles(board: (Tile | null)[][]): Position[] {
  const positions: Position[] = [];
  
  board.forEach((row, rowIndex) => {
    row.forEach((tile, colIndex) => {
      if (tile) {
        positions.push({ row: rowIndex, col: colIndex });
      }
    });
  });
  
  return positions;
}
```

## Testing Strategy

```typescript
import { createActor } from 'xstate';
import { gameMachine } from './gameMachine';

describe('Matcha3 Game Machine', () => {
  it('should start in menu state', () => {
    const actor = createActor(gameMachine);
    actor.start();
    
    expect(actor.getSnapshot().matches('menu')).toBe(true);
  });
  
  it('should transition to playing when START_GAME is sent', () => {
    const actor = createActor(gameMachine);
    actor.start();
    
    actor.send({ type: 'START_GAME' });
    
    expect(actor.getSnapshot().matches('playing')).toBe(true);
    expect(actor.getSnapshot().context.board.length).toBe(6);
    expect(actor.getSnapshot().context.timeRemaining).toBe(30);
  });
  
  it('should start timer on first tile click', () => {
    const actor = createActor(gameMachine);
    actor.start();
    actor.send({ type: 'START_GAME' });
    
    expect(actor.getSnapshot().matches('playing.timer.idle')).toBe(true);
    
    actor.send({ type: 'CLICK_TILE', row: 0, col: 0 });
    
    expect(actor.getSnapshot().matches('playing.timer.running')).toBe(true);
  });
  
  it('should detect early mismatch', () => {
    const actor = createActor(gameMachine);
    actor.start();
    actor.send({ type: 'START_GAME' });
    
    // Select first tile
    actor.send({ type: 'CLICK_TILE', row: 0, col: 0 });
    
    // Select mismatching second tile
    // This would need to be set up with known board state
    actor.send({ type: 'CLICK_TILE', row: 0, col: 1 });
    
    expect(actor.getSnapshot().matches('playing.game.active.mismatchShake')).toBe(true);
  });
  
  it('should pause timer during auto-match', () => {
    const actor = createActor(gameMachine);
    actor.start();
    actor.send({ type: 'START_GAME' });
    
    // Set up state with only 3 tiles remaining
    // This would require custom context
    
    expect(actor.getSnapshot().matches('playing.timer.paused')).toBe(true);
  });
});
```

## Migration Steps

1. **Install XState v5**
   ```bash
   npm install xstate@latest @xstate/react@latest
   ```

2. **Create State Machine File**
   - Create `gameMachine.ts` with the machine definition
   - Export the machine and types

3. **Create Helper Functions**
   - Move board generation logic to pure functions
   - Create utility functions for game logic

4. **Update UI Layer**
   - Replace imperative state management with machine actor
   - Update event handlers to send machine events
   - Subscribe to state changes for rendering

5. **Add Development Tools**
   ```typescript
   import { inspect } from '@xstate/inspect';
   
   inspect({
     url: 'https://stately.ai/viz?inspect',
     iframe: false
   });
   ```

6. **Migrate Features Incrementally**
   - Start with basic game flow
   - Add timer functionality
   - Add animations and effects
   - Add auto-match logic
   - Add hint system

7. **Testing**
   - Write unit tests for state transitions
   - Test guard conditions
   - Test timer behavior
   - Test animation timing

## Benefits of This Architecture

1. **Clear State Visualization**: Can see all possible states and transitions
2. **Impossible State Prevention**: Can't be selecting while animating, etc.
3. **Testable Logic**: Pure functions and deterministic state transitions
4. **Debugging**: Time-travel debugging and state inspection
5. **Maintainability**: Adding new features is explicit and controlled
6. **Performance**: Only re-render when state actually changes
7. **Type Safety**: Full TypeScript support with inferred types

## Future Enhancements

With XState, adding new features becomes more structured:

1. **Save/Load Game State**
   ```typescript
   const savedState = actor.getSnapshot();
   const restoredActor = createActor(gameMachine, { snapshot: savedState });
   ```

2. **Multiplayer Support**
   - Sync state machines across clients
   - Use XState's actor model for communication

3. **AI Opponent**
   - Create separate state machine for AI behavior
   - Communicate through events

4. **Achievements System**
   - Track game events in parallel state
   - Persist achievement progress

5. **Analytics**
   - Log all state transitions
   - Track player behavior patterns

This architecture provides a solid foundation for maintaining and extending the game while keeping the codebase clean and predictable.