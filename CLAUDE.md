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
- **Time Pressure**: 30-second countdown timer with 5-second bonus per match

### Visual Design

- **Hiragana**: Pink background (#FFB6C1) with darker pink border (#FF69B4)
- **Katakana**: Blue background (#87CEEB) with darker blue border (#4682B4)
- **Romaji**: Green background (#90EE90) with darker green border (#32CD32)
- **Typography**: Noto Sans JP font for proper Japanese character rendering

### Key Features

1. **Smart Selection System**: Prevents selecting multiple tiles of the same type
2. **Visual Guidance**: Faded tiles (15% opacity + grayscale) indicate which types cannot be selected
3. **Progress Tracking**: Dual progress bars showing level completion and time remaining
4. **Hint System**: Highlights a valid match set when clicked
5. **Dynamic Instructions**: Text updates to show which tile types are still needed
6. **Early Mismatch Detection**: Tiles shake when second selection doesn't match the first
7. **Auto-Match**: Final 3 tiles automatically match with visual sequence
8. **Timer System**:
   - 30-second countdown starts on first tile selection
   - 5-second bonus for each successful match (capped at 30 seconds)
   - Visual warning when under 10 seconds
   - Timer resets to 30 seconds when advancing to new level

## Technical Implementation

### State Management

- `board`: 6x6 array storing tile objects
- `selectedTiles`: Array of currently selected tile positions
- `score`: Points earned (100 per match)
- `matches`: Number of successful matches
- `level`: Current level (advances after 12 matches)
- `timeRemaining`: Current time left (starts at 30 seconds)
- `hasStarted`: Boolean tracking if timer has started
- `isGameOver`: Boolean for game over state
- `isAnimating`: Prevents interactions during animations

### Tile Object Structure

```javascript
{
    kana: { hiragana: 'あ', katakana: 'ア', romaji: 'a' },
    kanaIndex: 0,  // Index in the kana pool
    type: 'hiragana',  // 'hiragana', 'katakana', or 'romaji'
    display: 'あ'  // The character to display
}
```

### Key Functions

- `handleTileClick()`: Manages tile selection, type checking, and starts timer on first click
- `updateFadedTiles()`: Applies fade effect to same-type tiles
- `checkMatch()`: Validates if selected tiles form a valid match
- `processMatch()`: Handles match animation, tile removal, and time bonus
- `handleMismatch()`: Shows shake animation for incorrect matches
- `checkAutoMatch()`: Detects and processes final 3 tiles automatically
- `updateTimer()`: Updates timer display and progress bar
- `addBonusTime()`: Adds time bonus with visual feedback
- `gameOver()`: Handles game over state when timer expires

## Educational Design

### Learning Objectives

1. **Character Recognition**: Learn to identify hiragana and katakana characters
2. **Sound Association**: Connect characters to their phonetic sounds
3. **Script Differentiation**: Understand the relationship between writing systems
4. **Active Learning**: Reinforcement through repetitive matching

### Progression System

- Starts with 12 kana families per level
- Each level introduces new characters
- Total of 20 basic kana implemented
- Level 2 uses remaining 8 kana plus 4 from beginning to fill grid
- After completing all kana, game cycles back to level 1
- Timer resets to 30 seconds when advancing levels

## Future Enhancements

### Suggested Improvements

1. **Audio Integration**: Add pronunciation audio for each character
2. **Practice Mode**: Show all three forms together for study
3. **Statistics Tracking**: Record accuracy and learning progress
4. **Mobile Optimization**: Touch-friendly interface for tablets
5. **Expanded Character Set**: Include dakuten/handakuten variations

### Potential Features

- Time-based challenges
- Multiplayer competition
- Spaced repetition algorithm
- Custom character sets
- Achievement system

## Recent Updates

### New Features Added

1. **Early Mismatch Detection**: Second tile selection triggers immediate validation with shake animation
2. **Enhanced Fade Effect**: Unavailable tiles now fade to 15% opacity with grayscale filter
3. **Auto-Match System**: Final 3 tiles automatically match with staggered selection animation
4. **Timer System**:
   - 30-second countdown with visual progress bar
   - Timer starts on first tile selection
   - 5-second bonus per match (max 30 seconds)
   - Warning animation when under 10 seconds
5. **Dual Progress Bars**:
   - Gold bar shows level completion progress
   - Green/red bar shows time remaining
6. **Level Progression Fix**: Properly handles level 2 with only 8 new kana

### Visual Enhancements

- Shake animation for incorrect matches
- Timer bar changes to red when time is low
- Smooth transitions for time bonuses
- Both progress bars match game grid width

## Development Notes

### Browser Compatibility

- Modern browsers with ES6 support required
- CSS Grid and Flexbox for layout
- No external dependencies (pure vanilla JavaScript)

### Performance Considerations

- Animations use CSS transforms for GPU acceleration
- Event delegation could improve click handling with many tiles
- Consider requestAnimationFrame for smoother animations

### Accessibility

- High contrast colors for visibility
- Large, readable fonts
- Clear visual feedback for all actions
- Could add keyboard navigation support

## File Structure

Single HTML file containing:

- Embedded CSS styles
- Inline JavaScript
- No external dependencies
- Self-contained and portable

This design creates an engaging educational experience that makes learning Japanese characters intuitive and enjoyable through game mechanics.
