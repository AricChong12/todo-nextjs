'use client';

// NextAuth hooks for authentication state + logout function
import { useSession, signOut } from 'next-auth/react';

// Icons from lucide-react
import { LogOut, CheckSquare } from 'lucide-react';

/**
 * Header component
 * Displays:
 * - App logo (TaskFlow)
 * - Logged-in user info
 * - Sign out button
 */
export default function Header() {
  // Get current session data (user info if logged in)
  const { data: session } = useSession();

  return (
    // Sticky top navigation bar with blur + border styling
    <header className="sticky top-0 z-50 w-full border-b border-slate-200/80 bg-white/80 backdrop-blur-md dark:border-slate-800/80 dark:bg-slate-950/80">

      {/* Container for layout alignment */}
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">

        {/* ================= LOGO SECTION ================= */}
        <div className="flex items-center gap-2">

          {/* Icon container with gradient background */}
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-white shadow-lg shadow-indigo-500/20">
            <CheckSquare className="h-6 w-6" />
          </div>

          {/* App name with gradient text styling */}
          <span className="bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-xl font-bold tracking-tight text-transparent dark:from-violet-400 dark:to-indigo-400">
            TaskFlow
          </span>
        </div>

        {/* ================= USER ACTIONS SECTION ================= */}

        {/* Only show user section if session exists (user is logged in) */}
        {session?.user && (
          <div className="flex items-center gap-4">

            {/* User avatar + name */}
            <div className="flex items-center gap-3">

              {/* Avatar circle showing first letter of user's name */}
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-tr from-violet-500 to-indigo-500 text-sm font-semibold text-white shadow-sm">
                {session.user.name
                  ? session.user.name.charAt(0).toUpperCase()
                  : 'U' /* fallback if name is missing */}
              </div>

              {/* User name (hidden on very small screens) */}
              <span className="hidden text-sm font-medium text-slate-700 dark:text-slate-300 sm:block">
                {session.user.name}
              </span>
            </div>

            {/* SIGN OUT BUTTON */}
            <button
              onClick={() => signOut({ callbackUrl: '/login' })} // redirects to login after logout
              className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-200 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-slate-100"
            >
              {/* Logout icon */}
              <LogOut className="h-4 w-4" />

              {/* Text hidden on small screens */}
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
}