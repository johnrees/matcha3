# Matcha3! - Project Documentation

## Overview

Matcha3! is an educational match-3 puzzle game designed to teach Japanese hiragana and katakana characters alongside their romaji (romanized) equivalents. The game requires players to match sets of three characters representing the same sound across different writing systems.

## Game Mechanics

### Core Gameplay

- **Grid**: 6x6 board containing hiragana, katakana, and romaji characters
- **Matching Rule**: Players must select exactly 3 tiles that:
  - Represent the same sound (e.g., あ, ア, a)
  - Are from different writing systems (one hiragana, one katakana, one romaji)
- **Visual Feedback**: When a tile is selected, all other tiles of the same type fade to 15% opacity with grayscale effect
- **Completion**: Matched tiles disappear with animation, leaving empty spaces on the board
- **Timing System**: Stopwatch counts up from 0 seconds with 3-second penalty for incorrect matches

### Visual Design

- **Hiragana**: Pink background (#FFB6C1) with darker pink border (#FF69B4)
- **Katakana**: Blue background (#87CEEB) with darker blue border (#4682B4)
- **Romaji**: Green background (#90EE90) with darker green border (#32CD32)
- **Typography**: Noto Sans JP font for proper Japanese character rendering

### Key Features

1. **Smart Selection System**: Prevents selecting multiple tiles of the same type
2. **Visual Guidance**: Faded tiles (15% opacity + grayscale) indicate which types cannot be selected
3. **Progress Tracking**: Progress bar showing level completion
4. **Hint System**: Highlights a valid match set when clicked
5. **Dynamic Instructions**: Text updates to show which tile types are still needed
6. **Smart Mismatch Handling**: 
   - When second tile doesn't match first: only second tile shakes and is deselected, first remains selected
   - When third tile doesn't match first two: only third tile shakes and is deselected, first two remain selected and connected
7. **Auto-Match**: Final 3 tiles automatically match with visual sequence
   - User input disabled during auto-match
8. **Timer System**:
   - Stopwatch starts on first tile selection
   - 3-second penalty added for incorrect matches
   - Visual feedback shows "+3" in red when penalty applied
   - Timer continues through level completion
9. **Game Controls**:
   - New Game button disabled until first tile selection
   - Prevents accidental restarts before gameplay begins

## Technical Implementation

### State Management

- `board`: 6x6 array storing tile objects
- `selectedTiles`: Array of currently selected tile positions
- `score`: Points earned (100 per match)
- `matches`: Number of successful matches
- `level`: Current level (advances after 12 matches)
- `timeElapsed`: Current elapsed time in seconds
- `currentMatchStartTime`: Timestamp when current match attempt started
- `characterStats`: Object tracking performance data per character
- `hasStarted`: Boolean tracking if timer has started
- `isGameOver`: Boolean for game over state
- `isAnimating`: Prevents interactions during animations
- `isAutoMatching`: Prevents interactions during auto-match sequence

### Tile Object Structure

```javascript
{
    kana: { hiragana: 'あ', katakana: 'ア', romaji: 'a' },
    kanaIndex: 0,  // Index in the kanaMap array
    type: 'hiragana',  // 'hiragana', 'katakana', or 'romaji'
    display: 'あ'  // The character to display
}
```

### Kana Character Set

The game includes all 46 basic kana:
- **Vowels**: あいうえお (a, i, u, e, o)
- **K-row**: かきくけこ (ka, ki, ku, ke, ko)
- **S-row**: さしすせそ (sa, shi, su, se, so)
- **T-row**: たちつてと (ta, chi, tsu, te, to)
- **N-row**: なにぬねの (na, ni, nu, ne, no)
- **H-row**: はひふへほ (ha, hi, fu, he, ho)
- **M-row**: まみむめも (ma, mi, mu, me, mo)
- **Y-row**: やゆよ (ya, yu, yo)
- **R-row**: らりるれろ (ra, ri, ru, re, ro)
- **W-row**: わを (wa, wo)
- **N**: ん (n)

### Key Functions

- `handleTileClick()`: Manages tile selection, type checking, and starts timer on first click
- `updateFadedTiles()`: Applies fade effect to same-type tiles
- `checkMatch()`: Validates if selected tiles form a valid match
- `processMatch()`: Handles match animation, tile removal, and character stats tracking
- `handleMismatch(keepTiles)`: Shows shake animation for incorrect matches, keeping specified number of tiles selected
- `checkAutoMatch()`: Detects and processes final 3 tiles automatically
- `updateTimer()`: Updates timer display
- `addPenalty()`: Adds penalty time with visual feedback
- `gameOver()`: Shows level completion and character performance statistics
- `showCharacterStats()`: Displays detailed character performance data

## Educational Design

### Learning Objectives

1. **Character Recognition**: Learn to identify hiragana and katakana characters
2. **Sound Association**: Connect characters to their phonetic sounds
3. **Script Differentiation**: Understand the relationship between writing systems
4. **Active Learning**: Reinforcement through repetitive matching

### Progression System

- Each level presents 12 randomly selected kana from the full set
- Total of 46 basic kana implemented (complete hiragana/katakana chart)
- Random selection ensures different characters each game
- Infinite progression - game continues with new random selections
- Timer continues counting through levels for total session time
- Tiles are shuffled using Fisher-Yates algorithm for random board layouts
- No memorizable patterns - true character recognition required

## Future Enhancements

### Suggested Improvements

1. **Audio Integration**: Add pronunciation audio for each character
2. **Practice Mode**: Show all three forms together for study
3. **Statistics Tracking**: Record accuracy and learning progress
4. **Expanded Character Set**: Include dakuten/handakuten variations
5. **Difficulty Levels**: Adjustable timer and grid sizes

### Potential Features

- Time-based challenges
- Multiplayer competition
- Spaced repetition algorithm
- Custom character sets
- Achievement system

## Recent Updates

### New Features Added

1. **Smart Mismatch Handling**: 
   - Second tile selection triggers immediate validation
   - Incorrect second tile: shakes and deselects only the second tile, keeping first selected
   - Incorrect third tile: shakes and deselects only the third tile, keeping first two selected
   - Red background pulse on any mismatch
2. **Enhanced Fade Effect**: Unavailable tiles now fade to 15% opacity with grayscale filter
3. **Auto-Match System**: Final 3 tiles automatically match with staggered selection animation
   - Timer pauses during animation to prevent unfair game over
   - All user input blocked during auto-match sequence
4. **Timer System**:
   - Stopwatch counting up from 0 seconds
   - Timer starts on first tile selection
   - 3-second penalty for incorrect matches
   - Red pulse animation and "+3" display for penalties
5. **Progress Bar**:
   - Gold bar shows level completion progress
6. **Character Performance Tracking**:
   - Tracks response time for each character match
   - Records incorrect attempts per character
   - Calculates average response time
   - Shows top 5 most challenging characters at level completion
   - Press 'd' during gameplay to toggle debug stats view
7. **Full Mobile Optimization**:
   - Responsive design fits all phone sizes
   - No zooming or scrolling allowed
   - Touch-optimized with larger buttons
   - Prevents pull-to-refresh and double-tap zoom
   - Fixed gradient background issue on iOS
8. **Game Control Improvements**:
   - New Game button disabled until first tile selection
   - Prevents accidental game restarts before starting
   - Button automatically enables after first interaction
9. **Complete Kana Set**:
   - Added all 46 basic hiragana/katakana characters
   - Includes all vowels, consonants, and special characters (ん, を)
   - Excludes dakuten and combination kana for simplicity
10. **Random Level Generation**:
   - Each level randomly selects 12 kana from the full set
   - No sequential progression - every game is unique
   - Better learning through unpredictable character selection

### Visual Enhancements

- Shake animation for incorrect matches with red background pulse
- No text message for mismatches - visual feedback only
- Timer text pulses red during penalty animation
- Progress bar matches game grid width
- Mobile-specific sizing for all UI elements
- Gradient background properly displays on all devices

## Development Notes

### Browser Compatibility

- Modern browsers with ES6 support required
- CSS Grid and Flexbox for layout
- No external dependencies (pure vanilla JavaScript)
- Touch events supported for mobile devices
- Viewport meta tags for proper mobile rendering

### Mobile Optimization Details

- **Viewport Settings**: `width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no`
- **Touch Handling**: Both click and touchstart events with preventDefault
- **Layout Adjustments**:
  - Game board: `calc(100vw - 20px)` with max 420px
  - Reduced body padding to 5px for more screen space
  - Larger buttons: 14px 30px padding on mobile
  - Responsive font sizes throughout
- **Prevented Behaviors**:
  - No pull-to-refresh
  - No double-tap zoom
  - No scrolling or overscroll
  - Fixed positioning to lock viewport

### Performance Considerations

- Animations use CSS transforms for GPU acceleration
- Event delegation could improve click handling with many tiles
- Consider requestAnimationFrame for smoother animations
- Touch events use passive: false for immediate response

### Accessibility

- High contrast colors for visibility
- Large, readable fonts
- Clear visual feedback for all actions
- Touch targets meet minimum size requirements
- Could add keyboard navigation support

## File Structure

Single HTML file containing:

- Embedded CSS styles
- Inline JavaScript
- No external dependencies
- Self-contained and portable

### Character Statistics Structure

```javascript
characterStats[kanaIndex] = {
    attempts: number,      // Total match attempts
    incorrect: number,     // Failed match attempts
    totalTime: number,     // Total response time in milliseconds
    avgTime: number        // Average response time
}
```

This data will be used for implementing a spaced repetition system (SRS) in the future, where characters with slower response times or more errors will appear more frequently.

## Other Ideas

- you can ignore everything in other_ideas unless otherwise instructed