// Interface representing a Todo item.
// Interfaces define the shape (structure) of an object.
export interface ITodo {

  // Unique identifier for the todo item.
  _id: string;

  // ID of the user who owns this todo.
  userId: string;

  // Main title of the task.
  title: string;

  // Optional detailed description of the task.
  // The ? means this field is not required.
  description?: string;

  // Current status of the task.
  // Can only be one of these three values.
  status: 'todo' | 'in-progress' | 'done';

  // Priority level of the task.
  // Restricts values to low, medium, or high.
  priority: 'low' | 'medium' | 'high';

  // Optional category for organizing tasks.
  category?: string;

  // Optional due date for task completion.
  // Stored as a string (typically ISO date format).
  dueDate?: string;

  // Timestamp showing when the task was created.
  createdAt: string;

  // Timestamp showing when the task was last updated.
  updatedAt: string;
}

// Interface representing a user in the application.
export interface IUser {

  // Unique identifier for the user.
  _id: string;

  // User's display name.
  name: string;

  // User's email address.
  email: string;
}

// Type used when creating a new todo.
//
// Omit<T, K> creates a new type by removing specific properties
// from an existing interface.
//
// Since _id, userId, createdAt, and updatedAt are usually
// generated automatically by the backend/database,
// they are excluded from the input type.
export type CreateTodoInput = Omit<
  ITodo,
  '_id' | 'userId' | 'createdAt' | 'updatedAt'
>;

// Generic API response interface.
//
// <T> is a generic type parameter, allowing this interface
// to work with any kind of data returned by the API.
//
// Example:
// ApiResponse<ITodo>
// ApiResponse<IUser>
// ApiResponse<ITodo[]>
export interface ApiResponse<T> {

  // Indicates whether the API request succeeded.
  success: boolean;

  // Returned data when the request is successful.
  // Optional because failed requests may not contain data.
  data?: T;

  // Error message when the request fails.
  // Optional because successful requests usually have no error.
  error?: string;
}