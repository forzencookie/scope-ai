'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  Loader2, 
  Building2,
  CheckCircle,
  ArrowRight,
  User,
} from 'lucide-react'
import { AlertMessage } from '@/components/ui/alert-message'

// Google icon component
function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  )
}

// GitHub icon component
function GitHubIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
    </svg>
  )
}

export default function RegisterPage() {
  const router = useRouter()
  const { signUp, signInWithOAuth, isAuthenticated, loading: authLoading } = useAuth()
  
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      router.push('/dashboard/inbox')
    }
  }, [isAuthenticated, authLoading, router])

  // Password validation
  const passwordRequirements = [
    { label: 'Minst 8 tecken', met: password.length >= 8 },
    { label: 'En stor bokstav', met: /[A-Z]/.test(password) },
    { label: 'En siffra', met: /[0-9]/.test(password) },
  ]
  const isPasswordValid = passwordRequirements.every(r => r.met)
  const passwordsMatch = password === confirmPassword && confirmPassword.length > 0

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!isPasswordValid) {
      setError('Lösenordet uppfyller inte kraven')
      return
    }
    
    if (!passwordsMatch) {
      setError('Lösenorden matchar inte')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const { error } = await signUp(email, password)
      
      if (error) {
        setError(error.message)
      } else {
        setSuccess(true)
      }
    } catch (err) {
      setError('Ett oväntat fel inträffade. Försök igen.')
    }
    
    setLoading(false)
  }

  const handleOAuthSignUp = async (provider: 'google' | 'github') => {
    setLoading(true)
    setError(null)
    
    try {
      const { error } = await signInWithOAuth(provider)
      
      if (error) {
        setError(error.message)
        setLoading(false)
      }
    } catch (err) {
      setError('Ett oväntat fel inträffade. Försök igen.')
      setLoading(false)
    }
  }

  // Show loading state while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  // Success state
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 p-4">
        <Card className="w-full max-w-md shadow-xl border-0">
          <CardContent className="pt-8 pb-8 text-center space-y-4">
            <div className="h-16 w-16 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center mx-auto">
              <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <h2 className="text-2xl font-bold">Bekräfta din e-post</h2>
            <p className="text-muted-foreground">
              Vi har skickat en bekräftelselänk till<br />
              <span className="font-medium text-foreground">{email}</span>
            </p>
            <p className="text-sm text-muted-foreground">
              Klicka på länken i e-postmeddelandet för att aktivera ditt konto.
            </p>
            <Button asChild variant="outline" className="mt-4">
              <Link href="/login">Tillbaka till inloggning</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary p-12 flex-col justify-between relative overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10">
          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <defs>
              <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                <path d="M 10 0 L 0 0 0 10" fill="none" stroke="white" strokeWidth="0.5"/>
              </pattern>
            </defs>
            <rect width="100" height="100" fill="url(#grid)" />
          </svg>
        </div>

        {/* Logo */}
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-white/20 flex items-center justify-center">
              <Building2 className="h-6 w-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-white">Bokföra</span>
          </div>
        </div>

        {/* Main content */}
        <div className="relative z-10 space-y-6">
          <h1 className="text-4xl font-bold text-white leading-tight">
            Kom igång<br />
            på några minuter.
          </h1>
          <p className="text-lg text-white/80 max-w-md">
            Skapa ditt konto och börja bokföra direkt. 
            Ingen kreditkortsuppgift krävs.
          </p>
          
          {/* Benefits list */}
          <ul className="space-y-3 text-white/90">
            <li className="flex items-center gap-2">
              <div className="h-5 w-5 rounded-full bg-white/20 flex items-center justify-center">
                <CheckCircle className="h-3 w-3" />
              </div>
              14 dagars gratis provperiod
            </li>
            <li className="flex items-center gap-2">
              <div className="h-5 w-5 rounded-full bg-white/20 flex items-center justify-center">
                <CheckCircle className="h-3 w-3" />
              </div>
              Alla funktioner inkluderade
            </li>
            <li className="flex items-center gap-2">
              <div className="h-5 w-5 rounded-full bg-white/20 flex items-center justify-center">
                <CheckCircle className="h-3 w-3" />
              </div>
              Svensk support
            </li>
          </ul>
        </div>

        {/* Footer */}
        <div className="relative z-10 text-white/60 text-sm">
          © 2025 Bokföra. Alla rättigheter förbehållna.
        </div>
      </div>

      {/* Right side - Register form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <Card className="w-full max-w-md shadow-xl border-0">
          <CardHeader className="space-y-1 text-center">
            {/* Mobile logo */}
            <div className="lg:hidden flex justify-center mb-4">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                  <Building2 className="h-5 w-5 text-white" />
                </div>
                <span className="text-xl font-bold">Bokföra</span>
              </div>
            </div>
            
            <CardTitle className="text-2xl font-bold">Skapa konto</CardTitle>
            <CardDescription>
              Fyll i dina uppgifter för att komma igång
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Error message */}
            {error && <AlertMessage variant="error">{error}</AlertMessage>}

            {/* OAuth buttons */}
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                onClick={() => handleOAuthSignUp('google')}
                disabled={loading}
                className="h-11"
              >
                <GoogleIcon className="h-5 w-5 mr-2" />
                Google
              </Button>
              <Button
                variant="outline"
                onClick={() => handleOAuthSignUp('github')}
                disabled={loading}
                className="h-11"
              >
                <GitHubIcon className="h-5 w-5 mr-2" />
                GitHub
              </Button>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">
                  eller registrera med e-post
                </span>
              </div>
            </div>

            {/* Registration form */}
            <form onSubmit={handleSignUp} className="space-y-4" autoComplete="on">
              <div className="space-y-2">
                <Label htmlFor="fullName">Namn</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <Input
                    id="fullName"
                    name="name"
                    type="text"
                    autoComplete="name"
                    placeholder="Ditt namn"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="pl-10 h-11"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">E-postadress</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    autoCapitalize="off"
                    autoCorrect="off"
                    spellCheck="false"
                    placeholder="namn@foretag.se"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="pl-10 h-11"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Lösenord</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    autoCapitalize="off"
                    autoCorrect="off"
                    spellCheck={false}
                    data-lpignore="false"
                    data-1p-ignore="false"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="pl-10 pr-10 h-11"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    aria-label={showPassword ? "Dölj lösenord" : "Visa lösenord"}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                
                {/* Password requirements */}
                {password.length > 0 && (
                  <ul className="space-y-1 mt-2">
                    {passwordRequirements.map((req, index) => (
                      <li 
                        key={index}
                        className={`text-xs flex items-center gap-1.5 ${
                          req.met ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'
                        }`}
                      >
                        {req.met ? (
                          <CheckCircle className="h-3 w-3" />
                        ) : (
                          <div className="h-3 w-3 rounded-full border border-current" />
                        )}
                        {req.label}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Bekräfta lösenord</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    autoCapitalize="off"
                    autoCorrect="off"
                    spellCheck={false}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="pl-10 h-11"
                  />
                </div>
                {confirmPassword.length > 0 && !passwordsMatch && (
                  <p className="text-xs text-red-500">Lösenorden matchar inte</p>
                )}
              </div>

              <Button 
                type="submit" 
                className="w-full h-11" 
                disabled={loading || !isPasswordValid || !passwordsMatch}
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

            <p className="text-xs text-center text-muted-foreground">
              Genom att skapa ett konto godkänner du våra{' '}
              <Link href="/terms" className="text-primary hover:underline">
                användarvillkor
              </Link>{' '}
              och{' '}
              <Link href="/privacy" className="text-primary hover:underline">
                integritetspolicy
              </Link>
              .
            </p>
          </CardContent>

          <CardFooter className="flex flex-col space-y-4">
            <div className="text-center text-sm text-muted-foreground">
              Har du redan ett konto?{' '}
              <Link href="/login" className="text-primary font-medium hover:underline">
                Logga in
              </Link>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
