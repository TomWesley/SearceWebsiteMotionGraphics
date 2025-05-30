# P5.js Services Animation - Edit Guide

## 📁 Project Structure
```
project/
├── index.html          # Main HTML structure and CSS styles
├── sketch.js           # P5.js animation logic and interactions
└── images/
    ├── card1.svg       # Service card images (card1.svg through card8.svg)
    ├── card2.svg
    └── ...
```

## 🎯 Quick Edits

### Changing Service Content
**Location:** `sketch.js` - top of file in the `services` array

```javascript
const services = [
    {
        title: "Your Service Title",
        description: "Your service description here...",
        features: [
            "Feature 1",
            "Feature 2", 
            "Feature 3",
            "Feature 4"
        ]
    },
    // Add/edit more services here...
];
```

**Important:** Always maintain exactly 8 services for proper animation behavior.

### Adding/Changing Card Images
1. Place your SVG images in the `/images/` folder
2. Name them `card1.svg`, `card2.svg`, etc. (must match service order)
3. **No code changes needed** - images load automatically

### Modifying Colors & Styling
**Location:** `index.html` - `<style>` section

**Key color variables:**
- Background: `#001630` (dark blue)
- Accent: `#667eea` (purple-blue)
- Text: `#ffffff` (white)

**Card styling:**
- Card backgrounds, shadows, and hover effects are in the CSS
- Animation colors are in `sketch.js`

## ⚙️ Animation Settings

### Scroll Sensitivity
**Location:** `sketch.js` - line ~25
```javascript
let scrollSensitivity = 0.005; // Increase for faster scrolling
```

### Animation Speed
**Location:** `sketch.js` - line ~23
```javascript
let animationSpeed = 0.02; // Increase for faster transitions
```

### Card Sizes
**Location:** `sketch.js` - lines ~27-28
```javascript
let baseCardSize = 240;    // Grid view card size
let baseTargetSize = 480;  // Stacked view card size
```

### Text Spacing
**Location:** `sketch.js` - `updateTextPosition()` function
```javascript
const serviceSpacing = canvasHeight * 0.6; // Adjust text scroll spacing
```

## 🎨 Visual Customization

### Card Grid Layout
**Location:** `sketch.js` - `setupCardGrid()` function
```javascript
const cardSpacing = 350 * scaleFactor; // Space between cards in grid
```

### Glow Effects
**Location:** `sketch.js` - Card class `draw()` method
- Modify glow colors in the `drawingContext.shadowColor` lines
- Adjust glow intensity in the animation functions

### Background Gradients
**Location:** `sketch.js` - `drawPremiumBackground()` function
- Change gradient colors and intensities

## 📱 Responsive Behavior

### Breakpoints
**Location:** `index.html` - CSS media queries
```css
@media (max-width: 768px) {
    /* Mobile styles here */
}
```

### Scale Limits
**Location:** `sketch.js` - `calculateScaleFactor()` function
```javascript
let sizeLimit = 1.2;  // Maximum scale factor
let scaleFactor = Math.max(0.6, Math.min(sizeLimit, rawScale)); // Min/max scale
```

## 🔧 Common Modifications

### Adding More Services
1. Add new service object to `services` array
2. Add corresponding `cardN.svg` image
3. Update the hardcoded `8` references throughout the code to your new count

### Changing Animation Timing
- **Card stagger delay:** Modify `baseDelay` calculations in `animateToStack()` and `animateToGrid()`
- **Text transition speed:** Adjust `textTransitionSpeed` in `updateTextPosition()`

### Disabling Features
- **Particles:** Comment out `drawAmbientParticles()` call in `draw()`
- **Glow effects:** Set `glowIntensity` to 0 in animation functions
- **Shadows:** Comment out shadow drawing code in Card class

## 🚨 Important Notes

- **Always test on different screen sizes** after making changes
- **Keep exactly 8 services** unless you modify all hardcoded references
- **SVG images** work best for crisp scaling
- **Performance:** Reducing `animationSpeed` and glow effects helps on slower devices

## 🔄 File Loading
Make sure to serve files from a local server (not just opening index.html) due to browser security restrictions with loading images.