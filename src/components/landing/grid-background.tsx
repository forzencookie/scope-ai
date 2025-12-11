export function GridBackground() {
  return (
    <div className="fixed inset-0 z-[-1] pointer-events-none">
      <div className="absolute inset-0 bg-white" />
      {/* Dithered gradient background - positioned at actual top */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] opacity-[0.12] bg-dither-pattern mask-radial-tr" />
      {/* Bottom left dither accent */}
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] opacity-[0.08] bg-dither-pattern mask-radial-bl" />
      {/* Subtle noise texture */}
      <div className="absolute inset-0 opacity-[0.03] bg-noise-texture" />
      <div className="absolute inset-0 bg-grid-stone mask-radial-top opacity-40" />
    </div>
  )
}
