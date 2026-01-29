# Leveling System - Design System

## Inspired by Solo Leveling

Our design system draws inspiration from the Solo Leveling anime/manhwa aesthetic - dark, sharp, futuristic UI with glowing accents that evoke the "System" interface.

---

## Core Principles

```
1. DARK & DRAMATIC
   - Deep black backgrounds
   - High contrast elements
   - Mysterious, powerful atmosphere

2. SHARP & ANGULAR
   - Minimal rounded corners
   - Clean geometric shapes
   - Precise, intentional edges

3. GLOWING ACCENTS
   - Blue glow for primary actions
   - Purple glow for progression/magic
   - Red glow for warnings/critical

4. TYPOGRAPHY
   - Bold, uppercase for labels
   - Wide letter-spacing (tracking)
   - Clean, readable hierarchy
```

---

## Color Palette

### Primary Colors

```css
--sl-blue: #00A3FF        /* Primary action, System blue */
--sl-blue-dark: #0057B8   /* Secondary blue, hover states */
--sl-purple: #7B2CBF      /* Magic, progression, high importance */
--sl-red: #E63946         /* Critical, warnings, rank titles */
```

### Neutral Colors

```css
--sl-black: #0D0D0D       /* Main background */
--sl-gray: #1a1215        /* Card backgrounds (red-tinted) */
--sl-gray-light: #2a1a1d  /* Elevated surfaces */
--sl-gray-muted: #3a2528  /* Borders, dividers */
```

### Text Colors

```css
--sl-silver: #E0E0E0      /* Primary text */
--sl-silver-muted: #808080 /* Secondary text */
--sl-silver-dark: #606060  /* Disabled/muted text */
```

### Usage Guidelines

| Element | Color |
|---------|-------|
| Background | `sl-black` |
| Cards/Panels | `sl-gray` or `sl-gray-light` |
| Primary buttons | `sl-blue` |
| Text (primary) | `sl-silver` |
| Text (secondary) | `sl-silver-muted` |
| Borders | `sl-gray-muted` or `sl-blue/30` |
| Warnings/Critical | `sl-red` |
| Progress/Magic | `sl-purple` |

---

## Typography

### Font Weights

```
- Regular (400): Body text, descriptions
- Medium (500): Secondary labels
- Bold (700): Headers, important text
- Black (900): Logo, emphasis
```

### Text Styles

```css
/* Headers */
.header-title {
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 0.2em;
  color: var(--sl-blue);
  text-shadow: 0 0 10px rgba(0, 163, 255, 0.8);
}

/* Labels */
.label {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--sl-silver-muted);
}

/* Body */
.body {
  font-size: 14px;
  font-weight: 400;
  color: var(--sl-silver);
}

/* Small/Caption */
.caption {
  font-size: 12px;
  color: var(--sl-silver-muted);
}
```

---

## Spacing & Layout

### Border Radius

```css
--radius: 0.25rem  /* 4px - Sharp, minimal rounding */
```

### Spacing Scale

```
4px   - Tight spacing (gaps between small elements)
8px   - Small spacing (padding, small gaps)
12px  - Medium spacing (card padding)
16px  - Standard spacing (section gaps)
24px  - Large spacing (major sections)
32px  - Extra large (page margins)
```

---

## Glow Effects

### Box Shadows

```css
/* Subtle glow */
.glow-blue-sm {
  box-shadow: 0 0 10px rgba(0, 163, 255, 0.2);
}

/* Standard glow */
.glow-blue {
  box-shadow: 0 0 20px rgba(0, 163, 255, 0.3);
}

/* Intense glow (for focus/active states) */
.glow-blue-intense {
  box-shadow: 0 0 30px rgba(0, 163, 255, 0.5),
              0 0 60px rgba(0, 163, 255, 0.2);
}

/* Purple glow (progression) */
.glow-purple {
  box-shadow: 0 0 20px rgba(123, 44, 191, 0.3);
}

/* Red glow (warnings) */
.glow-red {
  box-shadow: 0 0 20px rgba(230, 57, 70, 0.3);
}
```

### Text Shadows

```css
/* Subtle text glow */
.text-glow-blue {
  text-shadow: 0 0 10px rgba(0, 163, 255, 0.5);
}

/* Intense text glow */
.text-glow-blue-intense {
  text-shadow: 0 0 10px rgba(0, 163, 255, 0.8),
               0 0 20px rgba(0, 163, 255, 0.4);
}
```

---

## Components

### Buttons

```
PRIMARY BUTTON
─────────────────────────────────
Background: sl-blue
Text: sl-black (for contrast)
Font: Bold, uppercase, tracking-wider
Shadow: glow-blue on hover
Border: none

SECONDARY BUTTON
─────────────────────────────────
Background: transparent
Text: sl-silver-muted
Border: 1px solid sl-gray-muted
Hover: border-sl-blue, text-sl-blue

GHOST BUTTON
─────────────────────────────────
Background: transparent
Text: sl-silver-muted
Hover: bg-sl-gray, text-sl-silver
```

### Cards/Panels

```
STANDARD CARD
─────────────────────────────────
Background: gradient from sl-gray-light to sl-gray
Border: 1px solid sl-gray-muted (or importance color)
Left accent: 2-4px colored bar for categorization

ACTIVE/TODAY CARD
─────────────────────────────────
Background: gradient from sl-gray to sl-black
Border: 1px solid sl-blue/30
Subtle blue glow
```

### Inputs

```
TEXT INPUT
─────────────────────────────────
Background: sl-gray
Border: 1px solid sl-gray-muted
Text: sl-silver
Placeholder: sl-silver-dark
Focus: border-sl-blue, shadow glow-blue-sm
```

### Progress Bars

```
STANDARD PROGRESS
─────────────────────────────────
Track: sl-gray-muted
Fill: gradient from sl-blue to sl-purple
Height: 4-6px
No border-radius (sharp edges)
```

### Badges/Tags

```
RANK BADGE
─────────────────────────────────
Background: transparent
Border: 1px solid sl-red/30
Text: sl-red, uppercase, tracking-wider
Font-size: 10px

STATUS BADGE
─────────────────────────────────
Background: sl-blue/20
Border: 1px solid sl-blue/30
Text: sl-blue
```

---

## Importance/Difficulty Levels

Visual hierarchy for task importance:

```
TRIVIAL     │ sl-silver-muted  │ Subtle, low contrast
LOW         │ sl-blue-dark     │ Cool, understated
MEDIUM      │ sl-blue          │ Standard, visible
HIGH        │ sl-purple        │ Magical, important
CRITICAL    │ sl-red           │ Urgent, glowing
```

### Hover Effects by Importance

```css
TRIVIAL:  border-sl-gray-muted → border-sl-silver-muted
LOW:      border-sl-blue-dark/30 → border-sl-blue-dark
MEDIUM:   border-sl-blue/30 → border-sl-blue + glow
HIGH:     border-sl-purple/50 → border-sl-purple + glow
CRITICAL: border-sl-red/50 → border-sl-red + intense glow
```

---

## Animations

### Transitions

```css
/* Standard transition */
transition: all 0.2s ease;

/* Color/opacity transitions */
transition: color 0.2s, opacity 0.2s;

/* Glow transitions (slightly longer) */
transition: box-shadow 0.3s ease;
```

### Keyframe Animations

```css
/* Pulse glow for "Today" indicator */
@keyframes pulse-glow {
  0%, 100% {
    box-shadow: 0 0 10px rgba(0, 163, 255, 0.3);
  }
  50% {
    box-shadow: 0 0 20px rgba(0, 163, 255, 0.6),
                0 0 30px rgba(0, 163, 255, 0.3);
  }
}
```

---

## Naming Conventions

### Game-Inspired Terminology

| Standard Term | Our Term |
|---------------|----------|
| Task | Quest |
| Create | Accept |
| Importance | Difficulty |
| Complete | Done/Complete |
| Experience Points | EXP |
| User Level | Level |
| User Title | Rank |

---

## Dark Theme Only

This system is designed exclusively for dark mode. The aesthetic depends on:
- Dark backgrounds for glow effects to be visible
- High contrast text for readability
- Colored accents that pop against black

---

## Accessibility Notes

```
- Maintain minimum 4.5:1 contrast ratio for text
- Use glow effects as enhancement, not sole indicator
- Provide text labels alongside color indicators
- Ensure interactive elements have visible focus states
```

---

## File Structure

```
src/
├── index.css          # All CSS variables and utilities
├── components/
│   ├── ui/            # shadcn/ui components (themed)
│   ├── Header.tsx     # App header with user info
│   └── CreateTaskModal.tsx
└── pages/
    └── CalendarPage.tsx
```

---

## Quick Reference

```
BACKGROUNDS
  Page:     bg-sl-black
  Card:     bg-sl-gray or bg-linear-to-b from-sl-gray to-sl-black
  Input:    bg-sl-gray

TEXT
  Primary:  text-sl-silver
  Muted:    text-sl-silver-muted
  Accent:   text-sl-blue (+ text-glow-blue for emphasis)
  Warning:  text-sl-red

BORDERS
  Default:  border-sl-gray-muted
  Focus:    border-sl-blue
  Accent:   border-sl-blue/30

GLOWS
  Buttons:  hover:shadow-[0_0_15px_rgba(0,163,255,0.3)]
  Cards:    hover:shadow-[0_0_10px_rgba(0,163,255,0.2)]
  Text:     text-glow-blue or text-glow-blue-intense
```
