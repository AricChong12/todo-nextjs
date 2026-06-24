// Import the redirect function from Next.js navigation module
// This function allows you to programmatically redirect the user to another route
import { redirect } from 'next/navigation';

// Default export of the Home page component
export default function Home() {

  // Immediately redirect the user to the /dashboard route
  // This means when someone visits the root URL (/), they will not see this page
  // Instead, they are automatically sent to /dashboard
  redirect('/dashboard');
}