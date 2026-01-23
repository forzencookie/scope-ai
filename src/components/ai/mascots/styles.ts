// Pixel-perfect rendering styles for crisp animations
export const pixelPerfectStyle = {
    imageRendering: 'pixelated' as const,
    WebkitFontSmoothing: 'none' as const,
    transform: 'translateZ(0)', // GPU acceleration
    willChange: 'transform',
}
