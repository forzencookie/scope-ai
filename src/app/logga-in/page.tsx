"use client"

import { useState, useEffect, useRef, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import Link from "next/link"
import { Navbar } from "@/components/landing/layout/navbar"
import { ArrowRight, Loader2, Eye, EyeOff } from "lucide-react"
import { nullToUndefined } from "@/lib/utils"

function LoginFallback() {
    return (
        <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#050505' }}>
            <Loader2 className="h-6 w-6 animate-spin text-white/40" />
        </div>
    )
}

export default function LoggaInPage() {
    return (
        <Suspense fallback={<LoginFallback />}>
            <LoggaInContent />
        </Suspense>
    )
}

function LoggaInContent() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const { signIn, signUp, signInWithOAuth, resetPassword, isAuthenticated, loading: authLoading } = useAuth()

    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [showPasswordField, setShowPasswordField] = useState(false)
    const [isSignUp, setIsSignUp] = useState(false)
    const [isForgotPassword, setIsForgotPassword] = useState(false)
    const [resetSent, setResetSent] = useState(false)
    const [loading, setLoading] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const passwordRef = useRef<HTMLInputElement>(null)

    const togglePasswordVisibility = () => {
        // Sync browser autofill value into React state before toggling
        if (passwordRef.current && passwordRef.current.value !== password) {
            setPassword(passwordRef.current.value)
        }
        setShowPassword(!showPassword)
    }

    const oauthError = searchParams.get("error")
    const errorMessage = searchParams.get("message")
    const plan = searchParams.get("plan")
    const signupParam = searchParams.get("signup")

    useEffect(() => {
        if (signupParam === "true") {
            setIsSignUp(true)
            setShowPasswordField(true)
        }
    }, [signupParam])

    useEffect(() => {
        if (isAuthenticated && !authLoading) {
            if (plan && ["pro", "max"].includes(plan)) {
                redirectToCheckout(plan)
            } else {
                router.push("/ny")
            }
        }
    }, [isAuthenticated, authLoading, router, plan])

    useEffect(() => {
        if (oauthError && errorMessage) {
            setTimeout(() => setError(decodeURIComponent(errorMessage)), 0)
        }
    }, [oauthError, errorMessage])

    const redirectToCheckout = async (tier: string) => {
        try {
            const response = await fetch("/api/stripe/checkout", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ tier }),
            })
            const data = await response.json()
            if (data.url) {
                window.location.href = data.url
            } else {
                router.push("/ny")
            }
        } catch {
            router.push("/ny")
        }
    }

    const handleEmailSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!showPasswordField) {
            setShowPasswordField(true)
            return
        }

        setLoading(true)
        setError(null)

        try {
            if (isSignUp) {
                const { error } = await signUp(email, password)
                if (error) {
                    setError(error.message)
                } else {
                    if (plan && ["pro", "max"].includes(plan)) {
                        await redirectToCheckout(plan)
                    } else {
                        router.push("/ny")
                    }
                }
            } else {
                const { error } = await signIn(email, password)
                if (error) {
                    // If login fails, suggest signup
                    if (error.message.includes("Invalid login")) {
                        setError("Inget konto hittades. Vill du skapa ett?")
                        setIsSignUp(true)
                    } else {
                        setError(error.message)
                    }
                } else {
                    router.push("/ny")
                }
            }
        } catch {
            setError("Ett oväntat fel inträffade. Försök igen.")
        }
        setLoading(false)
    }

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        try {
            const { error } = await resetPassword(email)
            if (error) {
                setError(error.message)
            } else {
                setResetSent(true)
            }
        } catch {
            setError("Ett oväntat fel inträffade. Försök igen.")
        }
        setLoading(false)
    }

    const handleOAuthLogin = async (provider: "google" | "azure") => {
        setLoading(true)
        setError(null)

        try {
            const { error } = await signInWithOAuth(provider, nullToUndefined(plan))
            if (error) {
                setError(error.message)
                setLoading(false)
            }
        } catch {
            setError("Ett oväntat fel inträffade. Försök igen.")
            setLoading(false)
        }
    }

    if (authLoading) {
        return <LoginFallback />
    }

    return (
        <div className="relative min-h-screen text-white font-sans selection:bg-white/30 flex flex-col landing-bg">
            <Navbar />

            {/* Main Content - Centered Card */}
            <main className="relative z-10 flex-grow flex items-center justify-center px-4 pt-24 pb-20">
                <div className="w-full max-w-[calc(100%-3rem)] sm:max-w-[400px] md:max-w-[640px] bg-black/30 backdrop-blur-2xl rounded-[2rem] p-8 md:p-10 flex flex-col min-h-[380px] md:min-h-[420px] relative overflow-hidden">
                    <h1 className="text-4xl md:text-5xl font-medium tracking-tight text-white mb-4">
                        Välkommen
                    </h1>

                    <div className="flex flex-col gap-2 mt-auto mb-8">
                        <h2 className="text-xl md:text-2xl font-medium text-white/80 tracking-tight">
                            {isSignUp ? "Skapa konto" : "Skapa konto eller logga in"}
                        </h2>
                    </div>

                    {/* Error message */}
                    {error && (
                        <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-sm">
                            {error}
                        </div>
                    )}

                    {isForgotPassword ? (
                        /* Forgot password inline flow */
                        <div className="mt-auto w-full flex flex-col gap-4">
                            {resetSent ? (
                                <div className="animate-in fade-in duration-300">
                                    <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20 text-green-300 text-sm">
                                        Återställningslänk skickad till <span className="font-medium text-white">{email}</span>. Kolla din inkorg.
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setIsForgotPassword(false)
                                            setResetSent(false)
                                            setError(null)
                                        }}
                                        className="mt-4 text-sm text-white/40 hover:text-white/70 transition-colors"
                                    >
                                        ← Tillbaka till inloggning
                                    </button>
                                </div>
                            ) : (
                                <form onSubmit={handleResetPassword} className="flex flex-col gap-4 animate-in fade-in duration-200">
                                    <p className="text-sm text-white/60">
                                        Ange din e-postadress så skickar vi en återställningslänk.
                                    </p>
                                    <div className="w-full relative">
                                        <input
                                            type="email"
                                            placeholder="E-postadress"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            required
                                            autoFocus
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-5 pr-14 text-white placeholder:text-white/40 outline-none transition-all focus:bg-white/10 focus:border-white/20 text-[15px]"
                                        />
                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className="absolute right-2 top-1/2 -translate-y-1/2 p-2.5 rounded-xl hover:bg-white/10 text-white transition-colors flex items-center justify-center group"
                                        >
                                            {loading ? (
                                                <Loader2 className="w-5 h-5 animate-spin" />
                                            ) : (
                                                <ArrowRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
                                            )}
                                        </button>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setIsForgotPassword(false)
                                            setError(null)
                                        }}
                                        className="text-sm text-white/40 hover:text-white/70 transition-colors text-left"
                                    >
                                        ← Tillbaka till inloggning
                                    </button>
                                </form>
                            )}
                        </div>
                    ) : (
                        /* Normal login/signup form */
                        <form onSubmit={handleEmailSubmit} className="mt-auto w-full flex flex-col gap-4">
                            {/* Email input */}
                            <div className="w-full relative">
                                <input
                                    type="email"
                                    placeholder="E-postadress"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-5 pr-14 text-white placeholder:text-white/40 outline-none transition-all focus:bg-white/10 focus:border-white/20 text-[15px]"
                                />
                                {!showPasswordField && (
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2.5 rounded-xl hover:bg-white/10 text-white transition-colors flex items-center justify-center group"
                                    >
                                        <ArrowRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
                                    </button>
                                )}
                            </div>

                            {/* Password field - shown after email */}
                            {showPasswordField && (
                                <div className="w-full relative animate-in slide-in-from-top-2 duration-200">
                                    <input
                                        ref={passwordRef}
                                        type={showPassword ? "text" : "password"}
                                        placeholder={isSignUp ? "Välj ett lösenord (minst 8 tecken)" : "Lösenord"}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        minLength={isSignUp ? 8 : undefined}
                                        autoFocus
                                        autoComplete={isSignUp ? "new-password" : "current-password"}
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-5 pr-24 text-white placeholder:text-white/40 outline-none transition-all focus:bg-white/10 focus:border-white/20 text-[15px]"
                                    />
                                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
                                        <button
                                            type="button"
                                            onClick={togglePasswordVisibility}
                                            className="p-2.5 rounded-xl hover:bg-white/10 text-white/40 hover:text-white/70 transition-colors"
                                            tabIndex={-1}
                                        >
                                            {showPassword ? (
                                                <EyeOff className="w-4 h-4" />
                                            ) : (
                                                <Eye className="w-4 h-4" />
                                            )}
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className="p-2.5 rounded-xl hover:bg-white/10 text-white transition-colors flex items-center justify-center group"
                                        >
                                            {loading ? (
                                                <Loader2 className="w-5 h-5 animate-spin" />
                                            ) : (
                                                <ArrowRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
                                            )}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Toggle login/signup + forgot password */}
                            {showPasswordField && (
                                <div className="flex items-center justify-between">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setIsSignUp(!isSignUp)
                                            setError(null)
                                        }}
                                        className="text-sm text-white/40 hover:text-white/70 transition-colors"
                                    >
                                        {isSignUp ? "Har redan ett konto? Logga in" : "Har inget konto? Skapa ett"}
                                    </button>
                                    {!isSignUp && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setIsForgotPassword(true)
                                                setShowPasswordField(false)
                                                setPassword("")
                                                setError(null)
                                            }}
                                            className="text-sm text-white/40 hover:text-white/70 transition-colors"
                                        >
                                            Glömt lösenord?
                                        </button>
                                    )}
                                </div>
                            )}

                            {/* Divider */}
                            <div className="flex items-center gap-4 w-full py-2">
                                <div className="h-[1px] bg-white/10 flex-1"></div>
                                <span className="text-white/40 text-[13px] font-medium">eller</span>
                                <div className="h-[1px] bg-white/10 flex-1"></div>
                            </div>

                            {/* Google OAuth */}
                            <button
                                type="button"
                                onClick={() => handleOAuthLogin("google")}
                                disabled={loading}
                                className="w-full bg-white text-black font-medium text-[15px] rounded-2xl py-4 flex items-center justify-center gap-3 hover:bg-white/90 transition-colors disabled:opacity-50"
                            >
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
                                Fortsätt med Google
                            </button>
                        </form>
                    )}
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
                    <Link href="/cookies" className="hover:text-white transition-colors">Cookiepolicy</Link>
                    <Link href="/integritetspolicy" className="hover:text-white transition-colors">Integritetspolicy</Link>
                    <Link href="/villkor" className="hover:text-white transition-colors">Allmänna villkor</Link>
                </div>
            </footer>
        </div>
    )
}
