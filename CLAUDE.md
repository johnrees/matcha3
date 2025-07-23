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
- **Completion**: Matched tiles disappear with animation, new tiles are added dynamically
- **Timing System**: Stopwatch counts up from 0 seconds (displays as XmYs format after 60s)
- **Dynamic Character Addition**: All 46 kana appear throughout a single game session

### Visual Design

- **Hiragana**: Pink background (#FFB6C1) with darker pink border (#FF69B4)
- **Katakana**: Blue background (#87CEEB) with darker blue border (#4682B4)
- **Romaji**: Green background (#90EE90) with darker green border (#32CD32)
- **Unavailable**: Grey background (#808080) with darker grey border (#606060) - for incomplete character sets
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
   - Incorrect tiles show educational feedback with floating spirit animation
7. **Auto-Match**: Final 3 tiles automatically match with visual sequence
   - User input disabled during auto-match
8. **Timer System**:
   - Stopwatch starts on first tile selection
   - Timer continues through entire game session
   - Formats as "Xs" under 60 seconds, "XmYs" after
9. **Dynamic Tile System**:
   - New tiles added to empty spaces after matches
   - Partial character sets (1-2 tiles) added strategically
   - Characters become matchable when all 3 types are present
   - Each kana appears exactly once per game
10. **Game Controls**:
   - New Game button disabled until first tile selection
   - Prevents accidental restarts before gameplay begins
   - Unavailable tiles cannot be clicked

## Technical Implementation

### State Management

- `board`: 6x6 array storing tile objects
- `selectedTiles`: Array of currently selected tile positions
- `score`: Points earned (100 per match)
- `matches`: Number of successful matches (out of 46 total)
- `level`: Current level (single continuous session)
- `timeElapsed`: Current elapsed time in seconds
- `currentMatchStartTime`: Timestamp when current match attempt started
- `characterStats`: Object tracking performance data per character
- `usedKanaIndices`: Set of kana indices already added to the game
- `remainingKanaIndices`: Array of kana indices not yet added
- `boardCharacterCounts`: Tracks which character types are on board
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
- `showOtherWritingSystems()`: Creates floating spirit animations showing alternative character forms
- `checkAutoMatch()`: Detects and processes final 3 tiles automatically
- `updateTimer()`: Updates timer display with minute formatting
- `canCharacterMatch()`: Checks if a character has all 3 types on board
- `updateBoardCharacterCounts()`: Tracks character availability
- `addNewTiles()`: Adds new tiles after matches, prevents duplicates
- `gameOver()`: Shows level completion and character performance statistics
- `showCharacterStats()`: Displays detailed character performance data

## Educational Design

### Learning Objectives

1. **Character Recognition**: Learn to identify hiragana and katakana characters
2. **Sound Association**: Connect characters to their phonetic sounds
3. **Script Differentiation**: Understand the relationship between writing systems
4. **Active Learning**: Reinforcement through repetitive matching

### Progression System

- Single game session includes all 46 basic kana characters
- Initial board starts with 12 complete character sets
- New characters added dynamically as matches are made
- Partial sets (1-2 tiles) create strategic gameplay
- Characters become matchable once all 3 types are present
- Game completes when all 46 kana have been matched
- No duplicate characters - each kana appears exactly once
- Empty spaces remain when no new characters available

## Future Enhancements

### Suggested Improvements

1. **Audio Integration**: Add pronunciation audio for each character
2. **Practice Mode**: Show all three forms together for study
3. **Statistics Tracking**: Record accuracy and learning progress
4. **Expanded Character Set**: Include dakuten/handakuten variations
5. **Difficulty Levels**: Adjustable timer and grid sizes

### Potential Features

- Audio pronunciation for each character
- Spaced repetition algorithm using collected stats
- Speed run modes and leaderboards
- Practice mode with specific character sets
- Achievement system for learning milestones

## Recent Updates

### New Features Added

1. **Smart Mismatch Handling**: 
   - Second tile selection triggers immediate validation
   - Incorrect second tile: shakes and deselects only the second tile, keeping first selected
   - Incorrect third tile: shakes and deselects only the third tile, keeping first two selected
   - Red background pulse on any mismatch
   - Educational feedback: other writing systems float out like spirits
2. **Enhanced Fade Effect**: Unavailable tiles now fade to 15% opacity with grayscale filter
3. **Auto-Match System**: Final 3 tiles automatically match with staggered selection animation
   - Timer pauses during animation to prevent unfair game over
   - All user input blocked during auto-match sequence
4. **Timer System**:
   - Stopwatch counting up from 0 seconds
   - Timer starts on first tile selection
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
- Spirit animation: other writing systems float up/down from incorrect tiles
- No text message for mismatches - visual feedback only
- Progress bar matches game grid width
- Unavailable tiles shown in grey with reduced opacity
- Timer displays in "Xs" or "XmYs" format
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
- Educational animations help with character learning
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

### Visual Feedback System

#### Spirit Animation for Incorrect Matches
When a player selects an incorrect tile, the game provides educational feedback by showing the other two writing systems:

1. **Animation Details**:
   - Two spirit-like text elements emerge from the incorrect tile
   - One floats upward, the other downward
   - Each shows one of the other writing systems for that character
   - Duration: 1.5 seconds with fade-out effect

2. **Styling**:
   - Each floating text maintains its script's color scheme
   - Includes borders and shadows for visibility
   - Non-interactive (pointer-events: none)

3. **Educational Value**:
   - Immediately shows all three forms of the character
   - Helps players understand why their selection was wrong
   - Reinforces character relationships through visual association

## Other Ideas

- you can ignore everything in other_ideas unless otherwise instructed

## Latest Updates (Most Recent)

### Major Gameplay Changes

1. **Single Session Gameplay**: Removed level-based progression in favor of one continuous game featuring all 46 characters
2. **Dynamic Tile Addition**: New tiles are added to empty spaces after matches, introducing characters progressively
3. **Partial Character Sets**: Characters may appear as incomplete sets (1-2 tiles), becoming matchable only when all 3 types are present
4. **No Duplicates**: Each kana character appears exactly once throughout the entire game session
5. **Improved Selection UX**: When making incorrect matches, correctly selected tiles remain selected
6. **Timer Format**: Time display now formats as "XmYs" after 60 seconds (e.g., "1m23s")
7. **Removed Penalties**: No more 3-second penalties for incorrect matches - pure performance tracking
8. **Educational Spirit Animation**: When making incorrect matches, the other two writing systems float out from the tile:
   - One floats upward, one floats downward
   - Each maintains its proper color coding (pink/blue/green)
   - Smooth fade-out animation over 1.5 seconds
   - Helps players learn character relationships visually