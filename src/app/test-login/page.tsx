"use client"

import Link from "next/link"
import { TestNavbar } from "@/components/landing/layout/test-navbar"

export default function TestLoginPage() {
    return (
        <div
            className="relative min-h-screen text-white font-sans selection:bg-white/30 flex flex-col"
            style={{
                backgroundColor: '#050505',
                backgroundImage: "url('/premiumbg-clean.png')",
                backgroundSize: 'cover',
                backgroundPosition: '85% center',
                backgroundAttachment: 'fixed',
                backgroundRepeat: 'no-repeat',
            }}
        >
            <TestNavbar />

            {/* Main Content - Centered Card */}
            <main className="flex-grow flex items-center justify-center px-4 pt-24 pb-20">
                <div className="w-full max-w-[440px] bg-[#111111]/80 backdrop-blur-2xl rounded-[2rem] p-8 md:p-10 border border-white/5 shadow-2xl flex flex-col min-h-[380px] md:min-h-[420px] relative overflow-hidden">
                    <h1 className="text-2xl md:text-[28px] font-medium text-white mb-auto tracking-tight">
                        Skapa konto eller logga in
                    </h1>

                    <div className="mt-auto w-full">
                        <button className="w-full bg-white text-black font-medium text-[15px] rounded-2xl py-4 flex items-center justify-center gap-3 hover:bg-white/90 transition-colors">
                            <svg className="w-5 h-5" viewBox="0 0 24 24">
                                <path
                                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                    fill="#4285F4"
                                />
                                <path
                                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.1v2.84C3.92 20.5 7.64 23 12 23z"
                                    fill="#34A853"
                                />
                                <path
                                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.1C1.41 8.44 1 10.16 1 12s.41 3.56 1.1 4.93l3.74-2.84z"
                                    fill="#FBBC05"
                                />
                                <path
                                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.64 1 3.92 3.5 2.1 7.07l3.74 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                    fill="#EA4335"
                                />
                            </svg>
                            fortsätt med Google
                        </button>
                    </div>
                </div>
            </main>

            {/* Footer Section */}
            <footer className="w-full px-6 md:px-8 pb-6 text-[13px] text-white/50 flex flex-col gap-2 relative z-10">
                <div className="font-bold text-[#8bd1e8] tracking-widest text-[11px]">
                    BETA
                </div>
                <div>
                    Copyright © 2026 scope ai. Alla rättigheter förbehållna.
                </div>
                <div className="flex items-center gap-4 mt-1">
                    <Link href="/cookies" className="hover:text-white transition-colors">Cookies Policy</Link>
                    <Link href="/integritetspolicy" className="hover:text-white transition-colors">Privacy Notice</Link>
                    <Link href="/villkor" className="hover:text-white transition-colors">Terms and Conditions</Link>
                </div>
            </footer>
        </div>
    )
}
