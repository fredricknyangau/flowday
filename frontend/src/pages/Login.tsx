import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/lib/auth-context'
import { Sparkles, Mail, Lock, Eye, EyeOff, ArrowRight, AlertCircle, Loader2 } from 'lucide-react'

export function Login() {
  const navigate = useNavigate()
  const { login } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)

    try {
      await login({ email, password })
      navigate('/', { replace: true })
    } catch (err: any) {
      const msg =
        err?.response?.data?.detail || err?.response?.data?.message || 'Invalid email or password.'
      setError(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 transition-colors">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Brand Logo & Tagline */}
        <div className="flex flex-col items-center text-center">
          <div className="w-14 h-14 bg-emerald-50 dark:bg-emerald-950/60 rounded-2xl border border-emerald-200/80 dark:border-emerald-800/80 flex items-center justify-center shadow-xs mb-3 group transition-all hover:scale-105">
            <Sparkles className="w-7 h-7 text-emerald-600 dark:text-emerald-400 transition-transform group-hover:rotate-12" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">Flowday</h1>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 max-w-xs font-medium">
            Multi-tenant day planning system with real-time deadline & burnout defense
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-gray-900 py-8 px-6 shadow-sm border border-gray-100 dark:border-gray-800 rounded-2xl sm:px-10 relative overflow-hidden transition-colors">
          {/* Subtle Top Accent bar */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-400" />

          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Sign in to your workspace</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Enter your credentials to access your dashboard</p>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="mb-5 rounded-xl border border-rose-200 dark:border-rose-900 bg-rose-50/80 dark:bg-rose-950/40 p-3.5 flex items-start gap-2.5 text-xs text-rose-700 dark:text-rose-300 animate-in fade-in slide-in-from-top-1 duration-200">
              <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              <div className="flex-1 font-medium">{error}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Email Address
              </label>
              <div className="relative rounded-xl shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                </div>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="alex@example.com"
                  className="block w-full pl-9 pr-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors bg-gray-50/30 dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Password
              </label>
              <div className="relative rounded-xl shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full pl-9 pr-10 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors bg-gray-50/30 dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex justify-center items-center gap-2 py-2.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-hidden focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-all disabled:opacity-50 active:scale-[0.99] cursor-pointer mt-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Credentials Help */}
          <div className="mt-6 pt-5 border-t border-gray-100 dark:border-gray-800">
            <div className="bg-emerald-50/60 dark:bg-emerald-950/40 rounded-xl p-3 text-[11px] text-emerald-800 dark:text-emerald-300 border border-emerald-100 dark:border-emerald-900/60 flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-emerald-900 dark:text-emerald-200">Default Demo Credentials:</span>
                <button
                  type="button"
                  onClick={() => {
                    setEmail('dev@flowday.app')
                    setPassword('password123')
                  }}
                  className="px-2 py-0.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[10px] font-semibold transition-colors cursor-pointer"
                >
                  Quick Fill
                </button>
              </div>
              <div className="flex justify-between font-mono text-[10px] mt-1">
                <span>Email: dev@flowday.app</span>
                <span>Pass: password123</span>
              </div>
            </div>
          </div>

          <div className="mt-5 text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Need a new workspace?{' '}
              <Link to="/register" className="font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 underline">
                Create a workspace
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
