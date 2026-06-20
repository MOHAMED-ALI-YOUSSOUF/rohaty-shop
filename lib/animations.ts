// lib/animations.ts — Rohaty Shop
// Framer Motion reusable animation variants (see UI.md)

export const fadeUp = {
  hidden:  { opacity: 0, y: 32 },
  visible: {
    opacity: 1, y: 0,
    transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] as const }
  }
}

export const fadeIn = {
  hidden:  { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.4 } }
}

export const zoomIn = {
  hidden:  { opacity: 0, scale: 0.94 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.45, ease: 'easeOut' as const } }
}

export const stagger = {
  hidden:  {},
  visible: { transition: { staggerChildren: 0.1, delayChildren: 0.05 } }
}

export const cardHover = {
  rest:  { y: 0,  boxShadow: '0 0 0px rgba(37,99,235,0)' },
  hover: {
    y: -6,
    boxShadow: '0 16px 48px rgba(37,99,235,0.22)',
    transition: { duration: 0.25 }
  }
}
