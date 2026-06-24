// Import NextAuth types used to configure authentication.
// NextAuthOptions defines the structure of the auth configuration.
// DefaultSession provides the default session user properties.
import { NextAuthOptions, DefaultSession } from 'next-auth';

// Import the Credentials Provider.
// This provider allows users to log in using an email and password
// instead of OAuth providers like Google or GitHub.
import CredentialsProvider from 'next-auth/providers/credentials';

// Import the MongoDB connection helper.
import dbConnect from './mongodb';

// Import the User model used to query user data.
import User from '@/models/User';

// Import bcrypt for password verification.
// bcrypt.compare() compares a plain-text password
// against a hashed password stored in the database.
import bcrypt from 'bcryptjs';


// Extend NextAuth's Session type.
//
// By default, session.user contains:
// {
//   name?: string;
//   email?: string;
//   image?: string;
// }
//
// This adds a custom "id" property so we can access:
// session.user.id
declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
    } & DefaultSession['user'];
  }
}


// Main NextAuth configuration object.
export const authOptions: NextAuthOptions = {

  // Authentication providers.
  providers: [

    // Configure the Credentials Provider.
    CredentialsProvider({

      // Display name shown on authentication pages.
      name: 'Credentials',

      // Define the login form fields.
      credentials: {

        // Email input field.
        email: { label: 'Email', type: 'email' },

        // Password input field.
        password: { label: 'Password', type: 'password' },
      },

      // Runs when a user attempts to log in.
      async authorize(credentials) {

        // Ensure both email and password are provided.
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Please enter both email and password');
        }

        // Connect to MongoDB.
        await dbConnect();

        // Find the user by email.
        // Convert email to lowercase for consistency.
        const user = await User.findOne({
          email: credentials.email.toLowerCase(),
        });

        // If no user exists with that email.
        if (!user) {
          throw new Error('No user found with this email');
        }

        // Compare entered password with hashed password.
        const isValid = await bcrypt.compare(
          credentials.password,
          user.password
        );

        // Password does not match.
        if (!isValid) {
          throw new Error('Incorrect password');
        }

        // Return user information.
        // Returning an object means authentication succeeded.
        return {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
        };
      },
    }),
  ],

  // Callback functions executed during authentication.
  callbacks: {

    // JWT callback.
    // Runs whenever a JWT token is created or updated.
    async jwt({ token, user }) {

      // During login, copy user ID into the token.
      if (user) {
        token.id = user.id;
      }

      return token;
    },

    // Session callback.
    // Runs whenever a session is accessed.
    async session({ session, token }) {

      // Copy user ID from token into session.
      if (session.user && token.id) {
        session.user.id = token.id as string;
      }

      return session;
    },
  },

  // Custom authentication pages.
  pages: {

    // Redirect users here when login is required.
    signIn: '/login',
  },

  // Session configuration.
  session: {

    // Store session data inside JWT tokens.
    // No database session table is required.
    strategy: 'jwt',
  },

  // Secret key used to sign and verify JWT tokens.
  // Stored securely in environment variables.
  secret: process.env.NEXTAUTH_SECRET,
};