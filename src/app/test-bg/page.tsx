"use client"

export default function TestBgPage() {
    return (
        <div className="relative min-h-screen bg-black overflow-hidden flex items-center justify-center">
            {/* Layer 1: Base image with slow Ken Burns drift */}
            <div
                className="absolute inset-0 animate-drift opacity-70"
                style={{
                    backgroundImage: "url('/premium.png')",
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                }}
            />

            {/* Layer 2: Duplicate with different blend + offset timing */}
            <div
                className="absolute inset-0 animate-drift-reverse opacity-40 mix-blend-screen"
                style={{
                    backgroundImage: "url('/premium.png')",
                    backgroundSize: "110% 110%",
                    backgroundPosition: "center",
                }}
            />

            {/* Layer 3: Breathing glow pulse */}
            <div className="absolute inset-0 animate-glow-pulse bg-gradient-radial from-blue-500/15 via-transparent to-transparent" />

            {/* Layer 4: Slow-moving radial gradient overlay for depth */}
            <div
                className="absolute inset-0 animate-gradient-shift opacity-60"
                style={{
                    background: "radial-gradient(ellipse at 60% 50%, rgba(59, 130, 246, 0.12) 0%, transparent 60%)",
                }}
            />

            {/* Vignette edges */}
            <div
                className="absolute inset-0 pointer-events-none"
                style={{
                    background: "radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.7) 100%)",
                }}
            />

            {/* Content */}
            <div className="relative z-10 text-center px-6 max-w-4xl">
                <p className="text-blue-400/80 text-sm font-medium tracking-[0.3em] uppercase mb-6 animate-fade-in-up">
                    Bokföring för framtiden
                </p>
                <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 tracking-tight animate-fade-in-up animation-delay-100">
                    Scope
                </h1>
                <p className="text-lg md:text-xl text-white/60 max-w-2xl mx-auto mb-10 animate-fade-in-up animation-delay-200">
                    AI-driven bokföring som gör det enkelt att driva företag i Sverige.
                </p>
                <div className="flex items-center justify-center gap-4 animate-fade-in-up animation-delay-300">
                    <button className="px-8 py-3 bg-white text-black font-semibold rounded-lg hover:bg-white/90 transition-all hover:scale-105">
                        Kom igång gratis
                    </button>
                    <button className="px-8 py-3 border border-white/20 text-white font-medium rounded-lg hover:bg-white/10 transition-all">
                        Se demo
                    </button>
                </div>
            </div>

            {/* Custom keyframes */}
            <style jsx>{`
                @keyframes drift {
                    0% {
                        transform: scale(1) translate(0, 0);
                    }
                    25% {
                        transform: scale(1.05) translate(-1%, 0.5%);
                    }
                    50% {
                        transform: scale(1.08) translate(0.5%, -0.5%);
                    }
                    75% {
                        transform: scale(1.03) translate(1%, 0.5%);
                    }
                    100% {
                        transform: scale(1) translate(0, 0);
                    }
                }

                @keyframes drift-reverse {
                    0% {
                        transform: scale(1.1) translate(0, 0) rotate(0deg);
                    }
                    33% {
                        transform: scale(1.15) translate(1%, -0.5%) rotate(0.5deg);
                    }
                    66% {
                        transform: scale(1.05) translate(-1%, 0.5%) rotate(-0.3deg);
                    }
                    100% {
                        transform: scale(1.1) translate(0, 0) rotate(0deg);
                    }
                }

                @keyframes glow-pulse {
                    0%, 100% {
                        opacity: 0.3;
                        transform: scale(1);
                    }
                    50% {
                        opacity: 0.6;
                        transform: scale(1.05);
                    }
                }

                @keyframes gradient-shift {
                    0% {
                        background-position: 60% 50%;
                        transform: scale(1);
                    }
                    33% {
                        background-position: 40% 45%;
                        transform: scale(1.1);
                    }
                    66% {
                        background-position: 55% 55%;
                        transform: scale(1.05);
                    }
                    100% {
                        background-position: 60% 50%;
                        transform: scale(1);
                    }
                }

                @keyframes fade-in-up {
                    0% {
                        opacity: 0;
                        transform: translateY(20px);
                    }
                    100% {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                .animate-drift {
                    animation: drift 25s ease-in-out infinite;
                }

                .animate-drift-reverse {
                    animation: drift-reverse 30s ease-in-out infinite;
                }

                .animate-glow-pulse {
                    animation: glow-pulse 8s ease-in-out infinite;
                }

                .animate-gradient-shift {
                    animation: gradient-shift 20s ease-in-out infinite;
                }

                .animate-fade-in-up {
                    animation: fade-in-up 0.8s ease-out forwards;
                    opacity: 0;
                }

                .animation-delay-100 {
                    animation-delay: 0.1s;
                }

                .animation-delay-200 {
                    animation-delay: 0.2s;
                }

                .animation-delay-300 {
                    animation-delay: 0.3s;
                }

                .bg-gradient-radial {
                    background: radial-gradient(ellipse at center, var(--tw-gradient-from) 0%, var(--tw-gradient-via) 50%, var(--tw-gradient-to) 100%);
                }
            `}</style>
        </div>
    )
}
