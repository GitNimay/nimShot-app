# nimShot - Color Palette

## Design Philosophy

This color palette is inspired by **Claude Code's** interface aesthetic, featuring:
- **Warm, approachable tones** (the signature Anthropic terracotta/orange)
- **Deep, sophisticated backgrounds** (charcoal and near-black)
- **High contrast for readability** (warm white text on dark backgrounds)
- **Subtle accent colors** for states and interactions

The palette supports both **dark mode** (default, primary) and **light mode** (secondary). Dark mode aligns with developer tools and reduces eye strain during extended use.

---

## Primary Colors (Dark Mode Default)

### Background Colors

| Name | Hex | RGB | Usage |
|------|-----|-----|-------|
| **Primary Dark** | `#1A1A1A` | 26, 26, 26 | Main app background, capture overlay |
| **Secondary Dark** | `#252525` | 37, 37, 37 | Card backgrounds, widget base |
| **Tertiary Dark** | `#2D2D2D` | 45, 45, 45 | Elevated surfaces, popups, toolbars |
| **Quaternary Dark** | `#3A3A3A` | 58, 58, 58 | Borders, dividers, subtle backgrounds |

### Foreground Colors

| Name | Hex | RGB | Usage |
|------|-----|-----|-------|
| **Primary Text** | `#FAFAFA` | 250, 250, 250 | Headings, primary content |
| **Secondary Text** | `#B4B4B4` | 180, 180, 180 | Body text, descriptions |
| **Tertiary Text** | `#808080` | 128, 128, 128 | Placeholders, disabled text, timestamps |

### Accent Colors (The Anthropic Orange)

| Name | Hex | RGB | Usage |
|------|-----|-----|-------|
| **Accent Primary** | `#DA7756` | 218, 119, 86 | Primary actions, buttons, widget circle, highlights |
| **Accent Hover** | `#E88B6B` | 232, 139, 107 | Button hover states |
| **Accent Active** | `#C66A4D` | 198, 106, 77 | Button pressed states |
| **Accent Muted** | `#B86B52` | 184, 107, 82 | Secondary accents |

### Semantic Colors

| Name | Hex | RGB | Usage |
|------|-----|-----|-------|
| **Success** | `#4ADE80` | 74, 222, 128 | Success states, notifications |
| **Warning** | `#FBBF24` | 251, 191, 36 | Warnings, cautions |
| **Error** | `#F87171` | 248, 113, 113 | Errors, destructive actions |
| **Info** | `#60A5FA` | 96, 165, 250 | Information, tips |

### Overlay & Effects

| Name | Hex | RGB | Usage |
|------|-----|-----|-------|
| **Blur Overlay** | `rgba(0, 0, 0, 0.7)` | - | Capture window background blur |
| **Selection Overlay** | `rgba(218, 119, 86, 0.3)` | - | Region selection highlight |
| **Shadow** | `rgba(0, 0, 0, 0.4)` | - | Popup shadows, elevated cards |
| **Backdrop** | `rgba(26, 26, 26, 0.95)` | - | Modal backdrops |

---

## Secondary Colors (Light Mode)

### Background Colors

| Name | Hex | RGB | Usage |
|------|-----|-----|-------|
| **Primary Light** | `#FFFFFF` | 255, 255, 255 | Main background |
| **Secondary Light** | `#F5F5F5` | 245, 245, 245 | Cards, sections |
| **Tertiary Light** | `#EBEBEB` | 235, 235, 235 | Elevated surfaces |
| **Quaternary Light** | `#E0E0E0` | 224, 224, 224 | Borders, dividers |

### Foreground Colors

| Name | Hex | RGB | Usage |
|------|-----|-----|-------|
| **Primary Text Light** | `#1A1A1A` | 26, 26, 26 | Headings, primary content |
| **Secondary Text Light** | `#525252` | 82, 82, 82 | Body text |
| **Tertiary Text Light** | `#737373` | 115, 115, 115 | Placeholders, muted text |

---

## Component-Specific Colors

### Widget (Floating Circle)

| Element | Color | Notes |
|---------|-------|-------|
| **Circle Background** | `#DA7756` | Accent primary |
| **Circle Hover** | `#E88B6B` | Slightly lighter |
| **Circle Active** | `#C66A4D` | Slightly darker |
| **Inner Icon** | `#FAFAFA` | White camera icon |
| **Glow Effect** | `rgba(218, 119, 86, 0.4)` | Subtle outer glow on hover |

### Capture Overlay

| Element | Color | Notes |
|---------|-------|-------|
| **Background Blur** | `rgba(26, 26, 26, 0.85)` | Dark overlay on screenshot |
| **Toolbar Background** | `#2D2D2D` | Semi-transparent |
| **Toolbar Border** | `#3A3A3A` | Subtle border |
| **Region Border** | `#DA7756` | Selection rectangle |
| **Region Fill** | `rgba(218, 119, 86, 0.15)` | Semi-transparent fill |
| **Dimension Label** | `#1A1A1A` bg, `#FAFAFA` text | Size indicator |

### Popup Panel

| Element | Color | Notes |
|---------|-------|-------|
| **Panel Background** | `#252525` | Slightly lighter than main |
| **Panel Border** | `#3A3A3A` | Subtle border |
| **Thumbnail Border** | `#3A3A3A` | Default state |
| **Thumbnail Hover Border** | `#DA7756` | Accent on hover |
| **Thumbnail Overlay** | `rgba(0, 0, 0, 0.5)` | Darkens thumbnail on hover |
| **Timestamp Text** | `#808080` | Muted gray |

### Gallery Card

| Element | Color | Notes |
|---------|-------|-------|
| **Card Background** | `#252525` | Card surface |
| **Card Hover** | `#2D2D2D` | Elevated on hover |
| **Card Border** | `#3A3A3A` | Default border |
| **Card Selected** | `rgba(218, 119, 86, 0.2)` border | Accent border when selected |
| **Action Buttons** | `#3A3A3A` bg, `#B4B4B4` icon | Delete, open, copy icons |

### Buttons

| Type | Background | Text | Border |
|------|------------|------|--------|
| **Primary** | `#DA7756` | `#FAFAFA` | none |
| **Primary Hover** | `#E88B6B` | `#FAFAFA` | none |
| **Secondary** | `#2D2D2D` | `#FAFAFA` | `#3A3A3A` |
| **Secondary Hover** | `#3A3A3A` | `#FAFAFA` | `#4A4A4A` |
| **Ghost** | transparent | `#B4B4B4` | none |
| **Ghost Hover** | `rgba(255,255,255,0.1)` | `#FAFAFA` | none |
| **Danger** | `#F87171` | `#1A1A1A` | none |
| **Danger Hover** | `#FCA5A5` | `#1A1A1A` | none |

### Input Fields

| Element | Color | Notes |
|---------|-------|-------|
| **Input Background** | `#252525` | Dark input field |
| **Input Border** | `#3A3A3A` | Default border |
| **Input Border Focus** | `#DA7756` | Accent border on focus |
| **Input Placeholder** | `#808080` | Muted text |
| **Input Text** | `#FAFAFA` | User input text |

---

## Gradient Definitions

### Widget Gradient
```css
background: linear-gradient(145deg, #DA7756 0%, #C66A4D 100%);
```

### Capture Overlay Gradient
```css
background: radial-gradient(circle at center, rgba(26,26,26,0.9) 0%, rgba(26,26,26,0.95) 100%);
```

### Popup Shadow
```css
box-shadow: 0 10px 40px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255,255,255,0.05);
```

### Accent Glow
```css
box-shadow: 0 0 20px rgba(218, 119, 86, 0.3);
```

---

## Tailwind Configuration

Add to `tailwind.config.js`:

```javascript
module.exports = {
  theme: {
    extend: {
      colors: {
        // Primary backgrounds
        'dark-primary': '#1A1A1A',
        'dark-secondary': '#252525',
        'dark-tertiary': '#2D2D2D',
        'dark-quaternary': '#3A3A3A',
        
        // Text colors
        'text-primary': '#FAFAFA',
        'text-secondary': '#B4B4B4',
        'text-tertiary': '#808080',
        
        // Accent (Claude Orange)
        'accent': {
          DEFAULT: '#DA7756',
          hover: '#E88B6B',
          active: '#C66A4D',
          muted: '#B86B52',
        },
        
        // Semantic
        'success': '#4ADE80',
        'warning': '#FBBF24',
        'error': '#F87171',
        'info': '#60A5FA',
        
        // Light mode
        'light-primary': '#FFFFFF',
        'light-secondary': '#F5F5F5',
        'light-tertiary': '#EBEBEB',
        'light-quaternary': '#E0E0E0',
      },
      boxShadow: {
        'popup': '0 10px 40px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255,255,255,0.05)',
        'accent-glow': '0 0 20px rgba(218, 119, 86, 0.3)',
      },
      backgroundImage: {
        'widget-gradient': 'linear-gradient(145deg, #DA7756 0%, #C66A4D 100%)',
      }
    },
  },
}
```

---

## Usage Guidelines

### Do's
- Use **Accent Primary (#DA7756)** sparingly for key actions and the widget
- Maintain **WCAG AA contrast** (4.5:1) for all text
- Use **layers** of dark backgrounds to create depth
- Apply **subtle borders** (#3A3A3A) to define elements

### Don'ts
- Don't use pure black (#000000) - too harsh
- Don't use pure white (#FFFFFF) for large text areas - causes eye strain
- Don't overuse the accent color - it loses impact
- Don't use light mode for the capture overlay (shows screenshot poorly)

### Accessibility
- All interactive elements have visible focus states (2px accent border)
- Color is not the only indicator (use icons + color)
- Sufficient contrast ratios maintained throughout

---

## CSS Variables

For runtime theme switching, use CSS variables:

```css
:root {
  /* Dark mode (default) */
  --bg-primary: #1A1A1A;
  --bg-secondary: #252525;
  --bg-tertiary: #2D2D2D;
  --bg-quaternary: #3A3A3A;
  
  --text-primary: #FAFAFA;
  --text-secondary: #B4B4B4;
  --text-tertiary: #808080;
  
  --accent: #DA7756;
  --accent-hover: #E88B6B;
  --accent-active: #C66A4D;
}

[data-theme="light"] {
  --bg-primary: #FFFFFF;
  --bg-secondary: #F5F5F5;
  --bg-tertiary: #EBEBEB;
  --bg-quaternary: #E0E0E0;
  
  --text-primary: #1A1A1A;
  --text-secondary: #525252;
  --text-tertiary: #737373;
}
```

---

## Resources

- [Claude Code Interface](https://code.claude.com/) - Reference for the color usage
- [Anthropic Brand](https://www.anthropic.com/) - Company brand colors
- [WCAG Contrast Checker](https://webaim.org/resources/contrastchecker/) - Validate accessibility
