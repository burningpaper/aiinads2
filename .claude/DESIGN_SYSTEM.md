# Design System - AI in Advertising Conference

Inspired by Letter's modern fintech aesthetic. Premium, confident, minimal.

## Color Palette

```css
:root {
  /* Primary - Dark Teal Gradient */
  --color-primary-900: #0a1a1a;
  --color-primary-800: #0f2626;
  --color-primary-700: #153535;
  --color-primary-600: #1a4545;
  --color-primary-500: #206060;

  /* Accent - For CTAs and highlights */
  --color-accent: #1a4545;
  --color-accent-hover: #206060;

  /* Neutrals */
  --color-white: #ffffff;
  --color-gray-50: #f9fafb;
  --color-gray-100: #f3f4f6;
  --color-gray-200: #e5e7eb;
  --color-gray-400: #9ca3af;
  --color-gray-600: #4b5563;
  --color-gray-900: #111827;

  /* Semantic */
  --color-success: #10b981;
  --color-error: #ef4444;
  --color-vote-a: #1a4545;
  --color-vote-b: #7c3aed;
}
```

## Typography

```css
/* Headings - Serif (Playfair Display or Fraunces) */
font-family: 'Playfair Display', Georgia, serif;

/* Body - Sans-serif (Inter) */
font-family: 'Inter', -apple-system, sans-serif;
```

### Scale
| Element | Mobile | Desktop | Weight |
|---------|--------|---------|--------|
| Hero heading | 36px | 64px | 500 |
| Section heading | 28px | 48px | 500 |
| Card heading | 20px | 24px | 600 |
| Body large | 18px | 20px | 400 |
| Body | 16px | 16px | 400 |
| Caption | 14px | 14px | 400 |

## Layout Patterns

### Hero Section (Dark Gradient)
```html
<section class="bg-gradient-to-br from-primary-900 via-primary-800 to-primary-700 text-white">
  <div class="max-w-7xl mx-auto px-6 py-24">
    <h1 class="font-serif text-5xl md:text-7xl">Heading</h1>
    <p class="text-gray-300 text-xl mt-6">Subheading</p>
  </div>
</section>
```

### Content Card
```html
<div class="bg-white rounded-2xl p-8 shadow-sm">
  <h3 class="font-serif text-2xl text-gray-900">Card Title</h3>
  <p class="text-gray-600 mt-4">Card content...</p>
</div>
```

### Two-Column Asymmetric (Desktop)
```html
<div class="grid md:grid-cols-2 gap-16 items-center">
  <div class="space-y-6">
    <h2 class="font-serif text-4xl">Heading</h2>
    <p class="text-gray-600 text-lg">Description...</p>
  </div>
  <div class="relative">
    <!-- Image/Visual -->
  </div>
</div>
```

## Components

### Primary Button
```html
<button class="bg-primary-700 hover:bg-primary-600 text-white
               px-8 py-4 rounded-full font-medium text-lg
               transition-colors duration-200">
  Vote Option A
</button>
```

### Secondary Button (Outline)
```html
<button class="border-2 border-primary-700 text-primary-700
               hover:bg-primary-700 hover:text-white
               px-8 py-4 rounded-full font-medium text-lg
               transition-colors duration-200">
  Learn More
</button>
```

### Vote Button (Large Touch Target)
```html
<button class="w-full bg-primary-700 hover:bg-primary-600 text-white
               py-6 rounded-2xl font-medium text-xl
               active:scale-98 transition-all duration-200
               min-h-[72px]">
  Option A: Broad Reach
</button>
```

### Vote Result Bar
```html
<div class="space-y-3">
  <div class="flex justify-between text-lg">
    <span class="font-medium">Option A</span>
    <span class="font-semibold">62%</span>
  </div>
  <div class="h-4 bg-gray-200 rounded-full overflow-hidden">
    <div class="h-full bg-gradient-to-r from-primary-700 to-primary-500
                rounded-full transition-all duration-500"
         style="width: 62%">
    </div>
  </div>
</div>
```

## Interface-Specific Patterns

### Audience (Mobile - 375px)
- Full-width cards with 16px horizontal padding
- Large touch targets (min 48px height)
- Bottom-anchored comment input
- Sticky header with segment indicator
- Single column, vertical scroll

```html
<div class="min-h-screen bg-gray-50">
  <!-- Sticky Header -->
  <header class="sticky top-0 bg-primary-900 text-white px-4 py-4 z-10">
    <p class="text-sm text-gray-300">Segment 2 of 5</p>
    <h1 class="font-serif text-xl">Target Audience</h1>
  </header>

  <!-- Content -->
  <main class="px-4 py-6 space-y-6">
    <!-- Content cards -->
  </main>

  <!-- Fixed Comment Input -->
  <div class="fixed bottom-0 left-0 right-0 bg-white border-t p-4">
    <input class="w-full border rounded-full px-4 py-3"
           placeholder="Share your thoughts..." />
  </div>
</div>
```

### Admin (Desktop)
- Sidebar navigation (240px)
- Main content area with cards
- White background, subtle shadows
- Split panels for content + live feed

```html
<div class="flex min-h-screen">
  <!-- Sidebar -->
  <aside class="w-60 bg-primary-900 text-white p-6">
    <nav class="space-y-2">...</nav>
  </aside>

  <!-- Main -->
  <main class="flex-1 bg-gray-50 p-8">
    <div class="grid lg:grid-cols-3 gap-8">
      <div class="lg:col-span-2"><!-- Content Manager --></div>
      <div><!-- Comments Feed --></div>
    </div>
  </main>
</div>
```

### Presentation (1920x1080)
- Dark background for projector visibility
- Massive typography (readable from 10m)
- Animated vote bars
- Centered, focused layouts
- No interactive elements

```html
<div class="min-h-screen bg-gradient-to-br from-primary-900 to-primary-800
            text-white flex items-center justify-center p-16">
  <div class="text-center max-w-5xl">
    <h1 class="font-serif text-8xl mb-8">The Audience Chose</h1>
    <div class="text-6xl font-medium text-primary-300">
      Option A: Broad Reach
    </div>
    <div class="mt-16 text-3xl text-gray-400">
      62% vs 38%
    </div>
  </div>
</div>
```

## Animation Guidelines

```css
/* Subtle hover transitions */
transition: all 0.2s ease;

/* Vote bar fill */
transition: width 0.5s cubic-bezier(0.4, 0, 0.2, 1);

/* Card entrance */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
animation: fadeInUp 0.4s ease-out;

/* Live pulse for active elements */
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}
animation: pulse 2s infinite;
```

## Tailwind Config Extensions

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: {
          900: '#0a1a1a',
          800: '#0f2626',
          700: '#153535',
          600: '#1a4545',
          500: '#206060',
        },
      },
      fontFamily: {
        serif: ['Playfair Display', 'Georgia', 'serif'],
        sans: ['Inter', '-apple-system', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
    },
  },
}
```

## Visual Assets Needed

1. **3D Objects** (optional, for polish)
   - Abstract glass/crystal shapes for hero backgrounds
   - Can use CSS gradients as fallback

2. **Icons**
   - Heroicons or Lucide (outline style)
   - Keep minimal, only where needed

3. **Logo**
   - Conference branding (provided by client)
