# Assets Guide

This directory contains visual assets for the badhope GitHub Profile README.

## Directory Structure

```
assets/
├── banner/
│   └── hero-cyber-banner.svg    # Hero zone banner with cyberpunk frame
├── dividers/
│   ├── starry-glow-divider.svg  # Starry glow horizontal divider (recommended)
│   ├── cyber-divider.svg        # Neon gradient horizontal divider
│   ├── pulse-line.svg          # Pulsing energy line with particles
│   ├── lightning-wave.svg       # Lightning/wave pattern divider
│   ├── holographic-wave.svg     # Holographic wave effect
│   └── neon-pulse.svg           # Neon pulse divider
├── effects/
│   ├── starry-background.svg    # Starry sky background (recommended)
│   ├── shooting-star.svg        # Shooting star animation
│   ├── twinkling-stars.svg      # Twinkling stars decoration
│   ├── glass-card.svg           # Glass morphism card background
│   ├── glowing-orb.svg          # Glowing orb effect
│   ├── particle-grid.svg        # Decorative particle grid background
│   └── data-flow.svg            # Data flow visualization
└── README-assets-guide.md      # This file
```

## Usage

### Recommended Approach: Relative Paths

For best performance and reliability, use relative paths in README.md:

```markdown
<img src="./assets/effects/starry-background.svg" width="100%" alt="星空背景">
<img src="./assets/dividers/starry-glow-divider.svg" width="90%" alt="分隔线">
```

**Why relative paths?**
- ✅ Faster loading (no DNS lookup)
- ✅ Works offline/in preview
- ✅ No rate limiting issues
- ✅ More reliable across regions

### Alternative: Raw GitHub URLs

Only use when necessary (e.g., external references):

```markdown
<img src="https://raw.githubusercontent.com/badhope/badhope/main/assets/effects/starry-background.svg" alt="Background">
```

### Banner

The hero banner can be used as a decorative header element:

```markdown
<img src="./assets/banner/hero-cyber-banner.svg" alt="Cyber Banner" width="100%">
```

### Effects

Particle grid works well as section background decoration:

```markdown
<img src="./assets/effects/particle-grid.svg" alt="Particle Effect" width="100%">
```

## Color Scheme

All SVG assets use these color schemes by default:

| Color | Hex | Usage |
|-------|-----|-------|
| Cream | `#fef3c7` | Primary text, titles |
| Cyan | `#a5f3fc` | Secondary accent, links |
| Purple | `#c4b5fd` | Tertiary accent, highlights |
| Pink | `#f9a8d4` | Special accents |
| Light Blue | `#e0f2fe` | Body text |
| Dark BG | `#0d1117` | Background (transparent in most assets) |

## Performance Tips

1. **Use appropriate widths**: Set `width="90%"` or `width="100%"` for responsive design
2. **Avoid duplicate images**: Don't use the same image multiple times
3. **Prefer local assets**: Minimize external service dependencies
4. **Optimize SVGs**: Keep SVG file sizes under 10KB when possible

## Customization

To modify colors or effects, edit the SVG files directly. Most effects use CSS gradients and filters that can be adjusted.

## Future Enhancements

Planned additions:
- More animated SVG effects
- Seasonal theme variants
- Custom tech stack badges
- Interactive elements (where GitHub supports)
