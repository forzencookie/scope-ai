'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Eye, EyeOff, Loader2, ArrowRight } from 'lucide-react'
import { AlertMessage } from '@/components/ui/alert-message'
import Link from 'next/link'
import { ScopeAILogo } from '@/components/ui/icons/scope-ai-logo'

// Google icon
function GoogleIcon({ className }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
        </svg>
    )
}

// Microsoft icon
function MicrosoftIcon({ className }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 23 23">
            <path fill="#f35325" d="M1 1h10v10H1z" />
            <path fill="#81bc06" d="M12 1h10v10H12z" />
            <path fill="#05a6f0" d="M1 12h10v10H1z" />
            <path fill="#ffba08" d="M12 12h10v10H12z" />
        </svg>
    )
}

function RegisterFallback() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-white">
            <Loader2 className="h-6 w-6 animate-spin text-stone-400" />
        </div>
    )
}

export default function RegisterPage() {
    return (
        <Suspense fallback={<RegisterFallback />}>
            <RegisterContent />
        </Suspense>
    )
}

function RegisterContent() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const { signUp, signInWithOAuth, isAuthenticated, loading: authLoading } = useAuth()

    const [name, setName] = useState('')
    const [companyName, setCompanyName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const oauthError = searchParams.get('error')
    const errorMessage = searchParams.get('message')

    useEffect(() => {
        if (isAuthenticated && !authLoading) {
            router.push('/dashboard/inkorg')
        }
    }, [isAuthenticated, authLoading, router])

    useEffect(() => {
        if (oauthError && errorMessage) {
            setError(decodeURIComponent(errorMessage))
        }
    }, [oauthError, errorMessage])

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        try {
            const { error } = await signUp(email, password)
            if (error) {
                setError(error.message)
            } else {
                // Usually redirect to email confirmation or dashboard
                router.push('/dashboard/inkorg')
            }
        } catch {
            setError('Ett oväntat fel inträffade. Försök igen.')
        }
        setLoading(false)
    }

    const handleOAuthLogin = async (provider: 'google' | 'azure') => {
        setLoading(true)
        setError(null)

        try {
            const { error } = await signInWithOAuth(provider)
            if (error) {
                setError(error.message)
                setLoading(false)
            }
        } catch {
            setError('Ett oväntat fel inträffade. Försök igen.')
            setLoading(false)
        }
    }

    if (authLoading) {
        return <RegisterFallback />
    }

    return (
        <div className="min-h-screen bg-white p-6 flex items-center justify-center">
            <div className="w-full max-w-7xl grid grid-cols-1 lg:grid-cols-11 gap-8">

                {/* Left: Branded Card with Dashboard Decoration (55%) */}
                <div className="hidden lg:flex lg:col-span-6 flex-col relative bg-gradient-to-b from-violet-100/50 to-violet-50/30 rounded-3xl overflow-hidden min-h-[600px]">
                    {/* Subtle grid pattern */}
                    <div className="absolute inset-0 bg-grid-stone opacity-20" />

                    {/* Dither Pattern - Top Fade */}
                    <div className="absolute top-0 inset-x-0 h-[500px] opacity-[0.06] bg-dither-pattern mask-radial-top" />

                    {/* Content - Centered */}
                    <div className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-12">
                        {/* Status Badge */}
                        <div className="relative inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-violet-200 rounded-full mb-8 overflow-hidden">
                            <div className="absolute inset-0 opacity-[0.08] bg-dither-pattern" />
                            <div className="relative flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-pulse" />
                                <span className="text-xs font-mono text-stone-600 uppercase tracking-widest">Systemet är redo</span>
                            </div>
                        </div>

                        {/* Logo & Headline */}
                        <div className="flex items-center gap-3 mb-4">
                            <ScopeAILogo className="w-8 h-8" />
                            <h1 className="text-3xl font-bold text-stone-900 tracking-tight">Scope AI</h1>
                        </div>

                        {/* Subtitle */}
                        <p className="text-stone-600 leading-relaxed max-w-xs mb-10">
                            Skapa konto och kom igång med AI-driven bokföring på nolltid.
                        </p>
                    </div>

                    {/* Dashboard Decoration - Bottom of card */}
                    <div className="relative z-10 px-6 pb-0">
                        <div className="bg-white border-x border-t border-stone-200 rounded-t-2xl shadow-lg shadow-stone-200/50 p-5 grid grid-cols-10 gap-4">
                            {/* Left Card: KVITTO (70% width) */}
                            <div className="col-span-7 bg-stone-50 border border-stone-200 rounded-xl p-4">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        <svg className="w-4 h-4 text-stone-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                        <span className="text-xs font-mono text-stone-600 uppercase">Kvitto</span>
                                    </div>
                                    <span className="text-[10px] font-medium bg-violet-100 text-violet-700 px-2 py-0.5 rounded">Skannad</span>
                                </div>
                                <div className="h-2 w-full bg-stone-200 rounded-full overflow-hidden">
                                    <div className="h-full bg-violet-600 rounded-full" style={{ width: '85%' }} />
                                </div>
                                <div className="flex justify-between text-xs text-stone-500 mt-2">
                                    <span>AI analyserar...</span>
                                    <span>85%</span>
                                </div>
                            </div>

                            {/* Right Card: INKORG (30% width) */}
                            <div className="col-span-3 bg-stone-50 border border-stone-200 rounded-xl p-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <svg className="w-4 h-4 text-stone-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                                    </svg>
                                    <span className="text-xs font-mono text-stone-600 uppercase">Inkorg</span>
                                </div>
                                <div className="text-2xl font-bold text-stone-900">3 nya</div>
                                <div className="text-xs text-stone-500">Väntar på granskning</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right: Register Form (45%, plain background) */}
                <div className="lg:col-span-5 flex flex-col justify-center px-4 lg:px-12">
                    <div className="w-full max-w-sm mx-auto">

                        {/* Header */}
                        <div className="mb-8">
                            <h2 className="text-2xl font-bold text-stone-900 mb-1">Skapa konto</h2>
                            <p className="text-sm text-stone-500">Prova Scope AI gratis i 14 dagar</p>
                        </div>

                        {/* OAuth Buttons */}
                        <div className="space-y-3 mb-6">
                            <Button
                                variant="outline"
                                onClick={() => handleOAuthLogin('google')}
                                disabled={loading}
                                className="w-full h-11 rounded-xl border-stone-200 hover:bg-stone-50 text-stone-700 font-medium"
                            >
                                <GoogleIcon className="h-4 w-4 mr-3" />
                                Regsitrera med Google
                            </Button>
                            {/* Microsoft login - disabled until Azure OAuth is configured
                            <Button
                                variant="outline"
                                onClick={() => handleOAuthLogin('azure')}
                                disabled={loading}
                                className="w-full h-11 rounded-xl border-stone-200 hover:bg-stone-50 text-stone-700 font-medium"
                            >
                                <MicrosoftIcon className="h-4 w-4 mr-3" />
                                Registrera med Microsoft
                            </Button>
                            */}
                        </div>

                        {/* Divider */}
                        <div className="relative flex items-center my-6">
                            <div className="flex-grow border-t border-stone-200" />
                            <span className="px-3 text-xs text-stone-400 uppercase">eller</span>
                            <div className="flex-grow border-t border-stone-200" />
                        </div>

                        {/* Register Form */}
                        <form onSubmit={handleRegister} className="space-y-4">
                            {error && <AlertMessage variant="error">{error}</AlertMessage>}

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <Label htmlFor="name" className="text-xs font-medium text-stone-600">Namn</Label>
                                    <Input
                                        id="name"
                                        type="text"
                                        autoComplete="name"
                                        placeholder="Anna Andersson"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        required
                                        className="h-11 rounded-xl border-stone-200 bg-stone-50"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="company" className="text-xs font-medium text-stone-600">Företag</Label>
                                    <Input
                                        id="company"
                                        type="text"
                                        autoComplete="organization"
                                        placeholder="Företag AB"
                                        value={companyName}
                                        onChange={(e) => setCompanyName(e.target.value)}
                                        required
                                        className="h-11 rounded-xl border-stone-200 bg-stone-50"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="email" className="text-xs font-medium text-stone-600">E-post</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    autoComplete="email"
                                    placeholder="namn@företag.se"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="h-11 rounded-xl border-stone-200 bg-stone-50"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="password" className="text-xs font-medium text-stone-600">Lösenord</Label>
                                <div className="relative">
                                    <Input
                                        id="password"
                                        type={showPassword ? 'text' : 'password'}
                                        autoComplete="new-password"
                                        placeholder="Välj ett starkt lösenord"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        minLength={8}
                                        className="h-11 rounded-xl border-stone-200 bg-stone-50 pr-10"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                                        tabIndex={-1}
                                    >
                                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                            </div>

                            <Button
                                type="submit"
                                disabled={loading}
                                className="w-full h-11 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-medium mt-2"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Skapar konto...
                                    </>
                                ) : (
                                    'Skapa konto'
                                )}
                            </Button>
                        </form>

                        {/* Footer */}
                        <p className="mt-6 text-center text-sm text-stone-500">
                            Har du redan ett konto?{' '}
                            <a href="/login" className="font-medium text-stone-900 hover:underline">
                                Logga in
                            </a>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
