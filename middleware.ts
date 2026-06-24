// Import the withAuth middleware helper from NextAuth.
// This middleware protects routes by checking whether
// a user is authenticated before allowing access.
import { withAuth } from 'next-auth/middleware';
// Export the authentication middleware as the default middleware.
//
// When a user tries to access a protected route,
// NextAuth will check if they are logged in.
//
// If they are authenticated:
//    ✅ Allow access
//
// If they are not authenticated:
//    ❌ Redirect them to the sign-in page specified below.
export default withAuth({
  pages: {
    // Custom login page.
    // Unauthenticated users attempting to access
    // protected routes will be redirected here.
    signIn: '/login',
  },
});
// Configure which routes should use this middleware.
export const config = {
  // Protect all routes under /dashboard
    //
    // Examples:
    //   /dashboard
    //   /dashboard/profile
    //   /dashboard/settings
    //   /dashboard/projects/123
    //
    // The ':path*' wildcard means:
    // "match any nested path after /dashboard"
  matcher: ['/dashboard/:path*'],
};
