// Import Mongoose and the Schema class.
// Mongoose provides a structured way to define,
// validate, and interact with MongoDB documents.
import mongoose, { Schema } from 'mongoose';

// Define the schema (structure) for User documents.
const UserSchema = new Schema(
  {
    // User's full name.
    // Required field - every user must have a name.
    name: { type: String, required: true },

    // User's email address.
    // Required field.
    // 'unique: true' prevents duplicate emails.
    // 'index: true' creates an index for faster lookups.
    // Commonly used for login and account identification.
    email: { type: String, required: true, unique: true, index: true },

    // User's password.
    // Required field.
    // In production, passwords should NEVER be stored as plain text.
    // They should be hashed using libraries such as bcrypt.
    password: { type: String, required: true },
  },

  // Schema options.
  // Automatically creates:
  // - createdAt: Date the user account was created
  // - updatedAt: Date the user record was last modified
  { timestamps: true }
);

// Create or retrieve the User model.
//
// mongoose.models.User:
//   Returns the existing model if it has already been created.
//
// mongoose.model('User', UserSchema):
//   Creates a new model if one does not already exist.
//
// This pattern is commonly used in Next.js applications
// to prevent "OverwriteModelError" during hot reloading.
const User = mongoose.models.User || mongoose.model('User', UserSchema);

// Export the User model so it can be used throughout
// the application for database operations such as:
// - Registration
// - Login
// - User lookup
// - Profile management
export default User;