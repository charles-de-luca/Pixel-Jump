# Pixel Jump Assets Directory

## Overview

This directory contains assets for the UPLOOP game. The game uses a **procedural generation** approach for most of its visual and audio content to keep the bundle size small and loading times fast.

## Directory Structure

```
assets/
├── images/          # Static image assets (icons only)
│   ├── icon-192.png
│   └── icon-512.png
└── sounds/          # Audio files (currently empty - see below)
```

## Graphics

The game uses **procedural 8-bit pixel art** generated at runtime using the HTML5 Canvas API. All game sprites (player characters, platforms, particles) are created programmatically in JavaScript.

### Why Procedural Graphics?

- **Small bundle size**: No need to load sprite sheets
- **Fast loading**: Graphics are generated instantly
- **Customizable**: Easy to modify colors and styles
- **Retro aesthetic**: Perfect for 8-bit style games

### Implementation

Graphics are generated using the `Sprite` and `AnimatedSprite` classes in `utils.js`. Each visual element is defined as a pixel array with color values.

## Audio

The game uses **procedural audio** generated at runtime using the Web Audio API. All sound effects are created programmatically.

### Why Procedural Audio?

- **No audio files needed**: Reduces bundle size significantly
- **Instant playback**: No loading or buffering required
- **Customizable**: Easy to adjust pitch, duration, and effects
- **Cross-platform**: Works consistently across all browsers

### Sound Effects

The following sounds are generated procedurally:

- **Jump sound**: Square wave at 300Hz
- **Landing sound**: Sine wave at 200Hz
- **Boost sound**: Rising sawtooth wave (200Hz → 400Hz)
- **Break sound**: Descending square wave (400Hz → 100Hz)
- **Game over sound**: Descending melody sequence

### Implementation

Audio is managed by the `AudioManager` class in `utils.js`. Each sound effect is created using oscillators and gain nodes from the Web Audio API.

## Static Images

The only static images are the app icons used for PWA functionality:

- `icon-192.png`: 192x192px app icon
- `icon-512.png`: 512x512px app icon

These are referenced in `manifest.json` for Progressive Web App installation.

## Adding New Assets

### To Add Static Images

1. Place image files in `assets/images/`
2. Reference them in your code using relative paths
3. Update this README with descriptions

### To Add Audio Files (Optional)

If you want to use pre-recorded audio instead of procedural generation:

1. Place audio files (MP3, OGG, WAV) in `assets/sounds/`
2. Update `AudioManager` in `utils.js` to load and play files
3. Consider browser compatibility and file size

## Notes

> The procedural approach is intentional and recommended for this game. It provides excellent performance and keeps the total bundle size under 200KB (excluding dependencies).
