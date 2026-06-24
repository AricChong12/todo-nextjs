import NextAuth from 'next-auth';

// Authentication configuration (providers, callbacks, session strategy, etc.)
import { authOptions } from '@/lib/auth';

/* =========================================================
   NEXTAUTH API ROUTE HANDLER
   This file enables authentication in Next.js App Router
   It handles both:
   - GET requests (session retrieval, callbacks)
   - POST requests (sign-in, sign-out, etc.)
========================================================= */

// Create NextAuth handler using your custom auth configuration
const handler = NextAuth(authOptions);

// Export handler for both GET and POST methods
// This is required for App Router API routes in Next.js 13+
export { handler as GET, handler as POST };