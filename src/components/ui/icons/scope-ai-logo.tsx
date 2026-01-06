import { cn } from "@/lib/utils"

// === GEOMETRIC VARIATIONS ===

// Variation 1: Orbital Cut - diagonal slice with floating inner element
function OrbitalCut({ className }: { className?: string }) {
    return (
        <svg viewBox="0 0 100 100" className={cn("shrink-0", className)}>
            <defs>
                <clipPath id="orbital-clip">
                    <rect x="0" y="0" width="100" height="100" />
                    <rect x="60" y="-20" width="60" height="60" transform="rotate(45 60 -20)" fill="black" />
                </clipPath>
            </defs>
            <circle cx="50" cy="50" r="48" fill="#1c1917" clipPath="url(#orbital-clip)" />
            <circle cx="50" cy="50" r="16" fill="white" />
        </svg>
    )
}

// Variation 2: Geometric Iris - Solid Aperture (High Contrast / Iconic)
function GeometricIris({ className }: { className?: string }) {
    return (
        <svg viewBox="0 0 100 100" className={cn("shrink-0", className)}>
            {/* Background - using currentColor to inherit text color (e.g. violet) */}
            <circle cx="50" cy="50" r="48" fill="currentColor" />

            {/* Solid 12-point star formed by 3 filled squares - with rounded corners */}
            <g>
                <rect x="25" y="25" width="50" height="50" rx="6" fill="white" />
                <rect x="25" y="25" width="50" height="50" rx="6" fill="white"
                    transform="rotate(30 50 50)" />
                <rect x="25" y="25" width="50" height="50" rx="6" fill="white"
                    transform="rotate(60 50 50)" />
            </g>

            {/* Negative Space Iris (Cutting through the solid star mass) */}
            <circle cx="50" cy="50" r="18" fill="currentColor" />

            {/* Center Pupil (Solid white inside the cutout) */}
            <circle cx="50" cy="50" r="6" fill="white" />
        </svg>
    )
}

// Variation 3: Void Core - offset inner void creating tension
function VoidCore({ className }: { className?: string }) {
    return (
        <svg viewBox="0 0 100 100" className={cn("shrink-0", className)}>
            <defs>
                <mask id="void-mask">
                    <rect x="0" y="0" width="100" height="100" fill="white" />
                    <circle cx="55" cy="45" r="20" fill="black" />
                </mask>
            </defs>
            <circle cx="50" cy="50" r="48" fill="#1c1917" mask="url(#void-mask)" />
        </svg>
    )
}

// Original design
function OriginalLogo({ className }: { className?: string }) {
    return (
        <div className={cn("bg-stone-900 rounded-full flex items-center justify-center shrink-0", className)}>
            <div className="w-[40%] h-[40%] bg-white rounded-[25%]" />
        </div>
    )
}

// === BIRD VARIATIONS ===

// Bird 1: Hummingbird - fast, precise, agile (side profile, minimalist)
function Hummingbird({ className }: { className?: string }) {
    return (
        <svg viewBox="0 0 100 100" className={cn("shrink-0", className)}>
            <circle cx="50" cy="50" r="48" fill="#1c1917" />
            {/* Body */}
            <ellipse cx="55" cy="50" rx="18" ry="12" fill="white" />
            {/* Head */}
            <circle cx="70" cy="45" r="10" fill="white" />
            {/* Long beak */}
            <path d="M 80 45 L 95 42 L 80 44 Z" fill="white" />
            {/* Wing up */}
            <path d="M 45 50 Q 30 30 20 35 Q 35 40 45 48 Z" fill="white" />
            {/* Tail feathers */}
            <path d="M 37 50 L 15 55 L 18 50 L 15 45 L 37 50 Z" fill="white" />
        </svg>
    )
}

// Bird 2: Owl - wisdom, insight, seeing in the dark (Predator style - sharp & sleek)
function Owl({ className }: { className?: string }) {
    return (
        <svg viewBox="0 0 100 100" className={cn("shrink-0", className)}>
            {/* Face/Head Background (Squircle) */}
            <rect x="2" y="2" width="96" height="96" rx="28" fill="#1c1917" />

            {/* Eyes - Hawk/Predator style (Steeper Angle, Sleeker Height) */}
            {/* Left Eye */}
            <path
                d="M 12 45
                   L 48 55
                   Q 40 38 12 25
                   Q 25 45 12 45 Z"
                fill="white"
            />
            {/* Right Eye */}
            <path
                d="M 88 45
                   L 52 55
                   Q 60 38 88 25
                   Q 75 45 88 45 Z"
                fill="white"
            />

            {/* Pupils removed for cleaner abstract look */}

            {/* Beak - Minimalist 'V' Shape - Fine, Wide & Low */}
            <path
                d="M 45 68 L 50 78 L 55 68"
                fill="none"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    )
}

// Bird 3: Phoenix - rising, abstract, fiery curves
function Phoenix({ className }: { className?: string }) {
    return (
        <svg viewBox="0 0 100 100" className={cn("shrink-0", className)}>
            <circle cx="50" cy="50" r="48" fill="#1c1917" />
            {/* Rising bird - abstract flowing shape */}
            <path
                d="M 50 80 
                   Q 40 60 35 50 
                   Q 30 35 40 25 
                   Q 50 15 55 25 
                   L 50 35
                   Q 55 30 60 25
                   Q 70 20 75 30
                   Q 70 35 60 45
                   Q 65 40 70 38
                   Q 80 35 82 45
                   Q 75 50 65 55
                   Q 60 60 55 70
                   Q 52 75 50 80 Z"
                fill="white"
            />
            {/* Eye */}
            <circle cx="48" cy="32" r="3" fill="#1c1917" />
        </svg>
    )
}

// Bird 4: Crane - elegant, balanced, Japanese style
function Crane({ className }: { className?: string }) {
    return (
        <svg viewBox="0 0 100 100" className={cn("shrink-0", className)}>
            <circle cx="50" cy="50" r="48" fill="#1c1917" />
            {/* Long neck */}
            <path
                d="M 55 75 Q 50 60 45 45 Q 42 35 50 28"
                fill="none"
                stroke="white"
                strokeWidth="6"
                strokeLinecap="round"
            />
            {/* Head */}
            <circle cx="50" cy="25" r="8" fill="white" />
            {/* Beak */}
            <path d="M 58 24 L 75 20 L 58 26 Z" fill="white" />
            {/* Body */}
            <ellipse cx="55" cy="78" rx="20" ry="10" fill="white" />
            {/* Wing */}
            <path
                d="M 45 75 Q 25 70 15 80 Q 30 78 45 82 Z"
                fill="white"
            />
            {/* Legs */}
            <path d="M 60 88 L 65 98" fill="none" stroke="white" strokeWidth="2" />
            <path d="M 50 88 L 48 98" fill="none" stroke="white" strokeWidth="2" />
        </svg>
    )
}

// === CHANGE THIS TO SWITCH LOGO ===
// Geometric: "original" | "orbital" | "lens" | "void"
// Birds: "hummingbird" | "owl" | "phoenix" | "crane"
const ACTIVE_LOGO = "lens"

export function ScopeAILogo({ className }: { className?: string }) {
    switch (ACTIVE_LOGO) {
        case "orbital":
            return <OrbitalCut className={className} />
        case "lens":
            return <GeometricIris className={className} />
        case "void":
            return <VoidCore className={className} />
        case "hummingbird":
            return <Hummingbird className={className} />
        case "owl":
            return <Owl className={className} />
        case "phoenix":
            return <Phoenix className={className} />
        case "crane":
            return <Crane className={className} />
        default:
            return <OriginalLogo className={className} />
    }
}
