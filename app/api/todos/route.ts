import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import Todo from '@/models/Todo';
import { ApiResponse, ITodo } from '@/types';
import { z } from 'zod';

/**
 * Zod schema for creating a new Todo
 * - Ensures required fields are valid
 * - Sets default values for optional fields
 */
const createTodoSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title must not exceed 100 characters'),
  description: z.string().optional(),
  status: z.enum(['todo', 'in-progress', 'done']).default('todo'),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
  category: z.string().optional(),
  dueDate: z.string().optional().nullable(),
});

/**
 * GET /api/todos
 * Fetch all todos for the logged-in user
 */
export async function GET() {
  try {
    /**
     * Get authenticated user session
     * Prevents unauthorized access
     */
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.id) {
      const resBody: ApiResponse<null> = { success: false, error: 'Unauthorized' };
      return NextResponse.json(resBody, { status: 401 });
    }

    // Connect to MongoDB
    await dbConnect();

    /**
     * Fetch todos belonging only to this user
     * Sort by newest first (createdAt descending)
     */
    const todos = await Todo.find({ userId: session.user.id }).sort({ createdAt: -1 });

    /**
     * Convert MongoDB documents into API-safe format
     * (convert ObjectId + Date into string)
     */
    const formattedTodos: ITodo[] = todos.map((todo) => ({
      _id: todo._id.toString(),
      userId: todo.userId.toString(),
      title: todo.title,
      description: todo.description,
      status: todo.status,
      priority: todo.priority,
      category: todo.category,
      dueDate: todo.dueDate ? todo.dueDate.toISOString() : undefined,
      createdAt: todo.createdAt.toISOString(),
      updatedAt: todo.updatedAt.toISOString(),
    }));

    // Send successful response with todos
    const resBody: ApiResponse<ITodo[]> = { success: true, data: formattedTodos };
    return NextResponse.json(resBody, { status: 200 });

  } catch (error: any) {
    // Log unexpected errors for debugging
    console.error('GET /api/todos error:', error);

    // Generic error response
    const resBody: ApiResponse<null> = { success: false, error: 'Internal Server Error' };
    return NextResponse.json(resBody, { status: 500 });
  }
}

/**
 * POST /api/todos
 * Create a new todo for the logged-in user
 */
export async function POST(req: Request) {
  try {
    /**
     * Authenticate user session
     */
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.id) {
      const resBody: ApiResponse<null> = { success: false, error: 'Unauthorized' };
      return NextResponse.json(resBody, { status: 401 });
    }

    // Parse request body JSON
    const body = await req.json();

    /**
     * Validate request body using Zod schema
     * Ensures only valid data is inserted into DB
     */
    const result = createTodoSchema.safeParse(body);
    if (!result.success) {
      const resBody: ApiResponse<null> = {
        success: false,
        error: result.error.issues.map((e) => e.message).join(', '),
      };
      return NextResponse.json(resBody, { status: 400 });
    }

    // Connect to MongoDB
    await dbConnect();

    // Extract validated fields
    const { title, description, status, priority, category, dueDate } = result.data;

    /**
     * Create new todo in database
     * Automatically assigns userId from session
     */
    const newTodo = await Todo.create({
      userId: session.user.id,
      title,
      description,
      status,
      priority,
      category,
      dueDate: dueDate ? new Date(dueDate) : undefined,
    });

    /**
     * Format response to match API interface
     * Convert MongoDB types into string-safe JSON values
     */
    const formattedTodo: ITodo = {
      _id: newTodo._id.toString(),
      userId: newTodo.userId.toString(),
      title: newTodo.title,
      description: newTodo.description,
      status: newTodo.status,
      priority: newTodo.priority,
      category: newTodo.category,
      dueDate: newTodo.dueDate ? newTodo.dueDate.toISOString() : undefined,
      createdAt: newTodo.createdAt.toISOString(),
      updatedAt: newTodo.updatedAt.toISOString(),
    };

    // Return created todo response
    const resBody: ApiResponse<ITodo> = { success: true, data: formattedTodo };
    return NextResponse.json(resBody, { status: 201 });

  } catch (error: any) {
    // Log server error
    console.error('POST /api/todos error:', error);

    // Generic fallback error response
    const resBody: ApiResponse<null> = { success: false, error: 'Internal Server Error' };
    return NextResponse.json(resBody, { status: 500 });
  }
}