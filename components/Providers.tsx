'use client';

// React is imported for type support (ReactNode) and JSX usage
import React from 'react';

// NextAuth provider that enables authentication session across the app
import { SessionProvider } from 'next-auth/react';

/**
 * Providers component
 * Wraps the entire app so that authentication session
 * is available globally using NextAuth's SessionProvider
 */
export default function Providers({
  children,
}: {
  // ReactNode allows any valid React child elements (pages, components, layouts)
  children: React.ReactNode;
}) {
  return (
    // SessionProvider makes session data accessible via useSession() anywhere in the app
    <SessionProvider>
      {children}
    </SessionProvider>
  );
}