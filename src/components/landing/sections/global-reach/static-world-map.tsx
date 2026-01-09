"use client"

// Static world map component using external SVG file
// Pre-rendered for optimal performance (no D3.js, no network fetch)
export function StaticWorldMap({
    className = "",
    dotColor = "#8b5cf6"
}: {
    className?: string
    dotColor?: string
}) {
    return (
        <div
            className={className}
            style={{
                // Use CSS filter to allow color customization of the SVG
                filter: dotColor !== "#8b5cf6"
                    ? `hue-rotate(${getHueRotation(dotColor)}deg)`
                    : undefined
            }}
        >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
                src="/world-map.svg"
                alt="World map illustration"
                className="w-full h-auto"
                loading="lazy"
            />
        </div>
    )
}

// Helper to calculate hue rotation for color adjustment
// Default purple (#8b5cf6) is baseline
function getHueRotation(hexColor: string): number {
    // For now, just return 0 if it's the default purple
    // In the future, this could calculate actual hue difference
    if (hexColor === "#8b5cf6") return 0
    return 0 // Keep default purple for now
}
