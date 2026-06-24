// Import Mongoose and the Schema class.
// Mongoose is an ODM (Object Data Modeling) library that helps
// interact with MongoDB using JavaScript objects.
import mongoose, { Schema } from 'mongoose';

// Define the structure (schema) of a Todo document in MongoDB.
const TodoSchema = new Schema(
  {
    // Reference to the user who owns this todo.
    // ObjectId links this document to a User document.
    // 'ref: User' enables population (joining related user data).
    // 'required: true' means every todo must belong to a user.
    // 'index: true' creates an index for faster queries by userId.
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },

    // Title of the task.
    // Required field with a maximum length of 100 characters.
    title: { type: String, required: true, maxlength: 100 },

    // Optional detailed description of the task.
    description: { type: String },

    // Current status of the task.
    // Only allows the specified values.
    // Defaults to 'todo' when a new task is created.
    status: {
      type: String,
      enum: ['todo', 'in-progress', 'done'],
      default: 'todo',
      required: true,
    },

    // Priority level of the task.
    // Restricts values to low, medium, or high.
    // Defaults to 'medium' if not specified.
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium',
      required: true,
    },

    // Optional category used to group tasks.
    category: { type: String },

    // Optional deadline for completing the task.
    // Stored as a Date object in MongoDB.
    dueDate: { type: Date },
  },

  // Schema options.
  // Automatically adds:
  // - createdAt: Date when document was created
  // - updatedAt: Date when document was last modified
  { timestamps: true }
);

// Create the Todo model.
//
// mongoose.models.Todo:
//   Checks if the model already exists.
//
// mongoose.model('Todo', TodoSchema):
//   Creates the model if it doesn't exist.
//
// This pattern prevents model overwrite errors,
// especially in Next.js where files can be reloaded
// multiple times during development.
const Todo = mongoose.models.Todo || mongoose.model('Todo', TodoSchema);

// Export the model so it can be used in API routes,
// server actions, and database operations.
export default Todo;