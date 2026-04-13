# UPLOOP Technical Architecture

## Project Overview
UPLOOP is a Doodle Jump clone designed as a Telegram Mini App. The game features infinite vertical jumping mechanics with various platform types, physics-based movement, and touch/accelerometer controls.

## Tech Stack
- **Platform**: Telegram Web App
- **Rendering**: HTML5 Canvas
- **Language**: Vanilla JavaScript (No heavy frameworks like Phaser for MVP)
- **Core Mechanics**: Physics engine (gravity, velocity), accelerometer/touch controls

## File Structure
```
/uploop
├── index.html
├── styles.css
├── main.js
├── gameLoop.js
├── player.js
├── platforms.js
├── physics.js
├── input.js
├── telegram.js
└── assets/
    ├── sprites/
    ├── sounds/
    └── fonts/
```

## Module Responsibilities

### Player Module (`player.js`)
- **State Management**: Position (x, y), velocity (vx, vy), direction, animation state
- **Rendering**: Draw player sprite with current animation/frame
- **Jump Logic**: Handle jump mechanics, collision response with platforms
- **Screen Wrapping**: Horizontal wrapping when going off-screen edges
- **Game State Updates**: Update position based on physics calculations

### Platforms Module (`platforms.js`)
- **Platform Types**: Normal, Moving, Breakable, Fake, Boost platforms
- **Object Pooling**: Reuse platform objects to optimize performance
- **Generation Algorithm**: Generate platforms as player moves upward
- **Cleanup Logic**: Remove platforms that are far below the player
- **Collision Detection**: Check collisions between player and platforms

### Physics Module (`physics.js`)
- **Gravity Simulation**: Apply constant downward acceleration
- **Velocity Calculations**: Update position based on velocity
- **Collision Detection**: Axis-Aligned Bounding Box (AABB) collision system
- **Boundary Checks**: Screen boundaries and world limits
- **Movement Calculations**: Handle all physical interactions

### Input Module (`input.js`)
- **Touch Controls**: Left/right swipe detection for horizontal movement
- **Accelerometer Support**: Device orientation API for tilt-based control
- **Calibration**: Initial device orientation calibration
- **Input Mapping**: Map raw input to game actions (left/right movement)

### Telegram Module (`telegram.js`)
- **SDK Initialization**: Initialize Telegram Web App SDK
- **Theme Handling**: Apply theme parameters (light/dark mode)
- **Haptic Feedback**: Trigger haptic pulses for game events
- **Cloud Storage**: Save/load high scores using Telegram's cloud storage
- **Main Button**: Handle Main Button functionality for game controls

### Game Loop Module (`gameLoop.js`)
- **Animation Frame**: Utilize requestAnimationFrame for smooth rendering
- **Delta Time Calculation**: Calculate time between frames for consistent physics
- **State Machine**: Manage game states (Menu, Playing, GameOver, Pause)
- **Update Cycle**: Coordinate updates between all game systems
- **Render Cycle**: Handle canvas clearing and object rendering

## Data Flow Architecture

### Input Processing Flow
1. **Input Detection**: `input.js` captures touch/accelerometer events
2. **Input Processing**: Raw input converted to directional commands
3. **Player Control**: Directional commands affect player velocity
4. **Physics Update**: Physics module applies movement based on velocity

### Physics Update Flow
1. **Gravity Application**: Constant gravity force applied to player
2. **Velocity Update**: Player velocity adjusted based on forces
3. **Position Update**: Player position calculated from velocity
4. **Collision Check**: Physics module checks for collisions with platforms
5. **Response Handling**: Collision responses trigger jump mechanics

### Platform Management Flow
1. **Camera Tracking**: Monitor player's vertical position
2. **Generation Trigger**: When player moves up, generate new platforms
3. **Pool Management**: Reuse platform objects from pool
4. **Type Selection**: Randomly select platform types based on game progression
5. **Cleanup**: Remove platforms that are too far below the player

### Rendering Flow
1. **Clear Canvas**: Prepare canvas for new frame
2. **Background Render**: Draw scrolling background
3. **Platform Render**: Draw all visible platforms
4. **Player Render**: Draw player at current position
5. **UI Render**: Draw score, high score, and other UI elements

## Telegram Integration Details

### Main Button Usage
- **Menu State**: Show "Start Game" button
- **Playing State**: Hide button or show "Pause" button
- **Game Over State**: Show "Play Again" button
- **Functionality**: Trigger game state transitions

### Haptic Feedback Events
- **Platform Landing**: Light impact when landing on platform
- **Boost Platform**: Medium impact when hitting boost platform
- **Game Over**: Heavy impact when falling
- **New High Score**: Success vibration pattern

### Cloud Storage Implementation
- **High Score Storage**: Save highest vertical distance achieved
- **Local Cache**: Maintain local copy for quick access
- **Sync Mechanism**: Periodically sync with cloud storage
- **Fallback Strategy**: Use local storage if cloud sync fails

## Performance Considerations

### Optimization Strategies
- **Object Pooling**: Reuse platform objects to minimize garbage collection
- **Canvas Optimization**: Use efficient drawing techniques and sprite batching
- **Event Delegation**: Consolidate input event handlers
- **Frame Rate Management**: Cap at 60 FPS for consistent gameplay

### Memory Management
- **Asset Loading**: Preload essential assets at game start
- **Sprite Sheets**: Use sprite sheets to reduce draw calls
- **Resource Cleanup**: Remove unused objects and references
- **Canvas Memory**: Clear canvas efficiently to prevent memory leaks

## Game States

### Menu State
- Display title and instructions
- Show high score
- Enable start button via Telegram Main Button

### Playing State
- Active game loop running
- Player movement and platform generation
- Score tracking and display

### Game Over State
- Final score display
- High score comparison
- Play again option via Telegram Main Button

## Platform Types Specification

### Normal Platform
- Standard solid platform
- Enables player jump
- Static position

### Moving Platform
- Moves horizontally in a pattern
- Enables player jump
- Changes position over time

### Breakable Platform
- Disappears after first use
- Enables player jump on first contact
- Removed after collision

### Fake Platform
- Appears solid but passes through
- Does not enable jumping
- Visual deception

### Boost Platform
- Propels player higher than normal jump
- Enables extra high jump
- Special visual effect

## Security Considerations

### Client-Side Validation
- Validate high scores locally before sending to cloud
- Prevent obvious cheating attempts
- Maintain game integrity

### Data Privacy
- Only store essential game data
- Follow Telegram's privacy guidelines
- No personal user data collection

## Error Handling

### Network Failures
- Graceful degradation when cloud storage unavailable
- Fallback to local storage
- Retry mechanisms for synchronization

### Performance Issues
- Dynamic quality adjustment
- Frame rate monitoring
- Resource management under stress

## Future Enhancements

### Potential Additions
- Power-ups and collectibles
- Character customization
- Daily challenges
- Social leaderboards
- Sound effects and music