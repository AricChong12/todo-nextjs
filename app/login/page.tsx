'use client';

// React hooks for state management in a client component
import React, { useState } from 'react';

// NextAuth function for authentication (login via credentials provider)
import { signIn } from 'next-auth/react';

// Icons used for UI decoration (from Lucide icon library)
import { Mail, Lock, User, CheckSquare, Loader2, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  // Mode controls whether user is logging in or registering
  const [mode, setMode] = useState<'login' | 'register'>('login');

  // Form state fields
  const [name, setName] = useState('');        // used only for registration
  const [email, setEmail] = useState('');      // shared for login/register
  const [password, setPassword] = useState(''); // shared for login/register

  // UI state for loading and error handling
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Handles both login and register form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); // prevent page refresh
    setError(null);     // clear previous errors
    setLoading(true);   // show loading state

    try {
      // ===================== LOGIN FLOW =====================
      if (mode === 'login') {

        // Attempt login using NextAuth credentials provider
        const result = await signIn('credentials', {
          email: email.toLowerCase(), // normalize email
          password,
          redirect: false, // manual redirect handling
        });

        // If authentication fails, show error message
        if (result?.error) {
          setError(result.error);
        } else {
          // Successful login → redirect user to dashboard
          window.location.href = '/dashboard';
        }

      // ===================== REGISTER FLOW =====================
      } else {

        // Send user data to backend registration API
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name,
            email: email.toLowerCase(),
            password
          }),
        });

        const json = await res.json();

        // If registration fails, show error message
        if (!res.ok || !json.success) {
          setError(json.error || 'Registration failed');
        } else {

          // Auto-login after successful registration
          const result = await signIn('credentials', {
            email: email.toLowerCase(),
            password,
            redirect: false,
          });

          // If auto-login fails, fallback to login mode
          if (result?.error) {
            setError('Account created! Please sign in.');
            setMode('login');
          } else {
            // Redirect to dashboard after success
            window.location.href = '/dashboard';
          }
        }
      }

    } catch {
      // Catch unexpected runtime/network errors
      setError('An unexpected error occurred. Please try again.');
    } finally {
      // Always stop loading state
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-900 px-4 py-12">

      {/* Background decorative blur blobs for aesthetic UI */}
      <div className="absolute top-1/4 left-1/4 h-[350px] w-[350px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-violet-600/20 blur-[80px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 h-[400px] w-[400px] translate-x-1/2 translate-y-1/2 rounded-full bg-indigo-600/20 blur-[100px] pointer-events-none" />

      {/* Main authentication card container */}
      <div className="relative w-full max-w-md rounded-2xl border border-slate-800 bg-slate-950/60 p-8 shadow-2xl backdrop-blur-xl sm:p-10">

        {/* Logo + Title section */}
        <div className="flex flex-col items-center text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-white shadow-lg shadow-indigo-500/30">
            <CheckSquare className="h-7 w-7" />
          </div>

          <h1 className="mt-4 text-2xl font-extrabold tracking-tight text-white">
            TaskFlow
          </h1>

          <p className="mt-1 text-sm text-slate-400">
            {mode === 'login'
              ? 'Sign in to your workspace'
              : 'Create a free account'}
          </p>
        </div>

        {/* Toggle between login and register modes */}
        <div className="mt-8 flex rounded-lg bg-slate-900/80 p-1">
          <button
            type="button"
            onClick={() => { setMode('login'); setError(null); }}
            className={`flex-1 rounded-md py-2 text-xs font-semibold uppercase tracking-wider transition-all ${
              mode === 'login'
                ? 'bg-slate-800 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Sign In
          </button>

          <button
            type="button"
            onClick={() => { setMode('register'); setError(null); }}
            className={`flex-1 rounded-md py-2 text-xs font-semibold uppercase tracking-wider transition-all ${
              mode === 'register'
                ? 'bg-slate-800 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Register
          </button>
        </div>

        {/* Error message display */}
        {error && (
          <div className="mt-4 rounded-xl border border-rose-900/50 bg-rose-950/20 p-3.5 text-center text-sm font-medium text-rose-400">
            {error}
          </div>
        )}

        {/* Authentication form */}
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">

          {/* Name field only shown during registration */}
          {mode === 'register' && (
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Full Name
              </label>

              <div className="relative">
                <User className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />

                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Jane Doe"
                  className="h-11 w-full rounded-xl border border-slate-800 bg-slate-900/40 pl-10 pr-4 text-sm text-white outline-none transition-all placeholder:text-slate-600 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
                />
              </div>
            </div>
          )}

          {/* Email input field */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              Email Address
            </label>

            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />

              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="h-11 w-full rounded-xl border border-slate-800 bg-slate-900/40 pl-10 pr-4 text-sm text-white outline-none transition-all placeholder:text-slate-600 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
              />
            </div>
          </div>

          {/* Password input field */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              Password {mode === 'register' && (
                <span className="normal-case font-normal text-slate-500">
                  (min. 6 characters)
                </span>
              )}
            </label>

            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />

              <input
                type="password"
                required
                minLength={mode === 'register' ? 6 : undefined}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="h-11 w-full rounded-xl border border-slate-800 bg-slate-900/40 pl-10 pr-4 text-sm text-white outline-none transition-all placeholder:text-slate-600 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
              />
            </div>
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={loading}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-violet-600 text-sm font-semibold text-white shadow-lg shadow-violet-500/10 transition-colors hover:bg-violet-700 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                {mode === 'login' ? 'Sign In' : 'Create Account'}
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}