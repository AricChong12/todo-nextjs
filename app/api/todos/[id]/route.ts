import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import Todo from '@/models/Todo';
import { ApiResponse, ITodo } from '@/types';
import { z } from 'zod';

/**
 * Zod schema for validating incoming update requests.
 * All fields are optional because this is a partial update (PATCH/PUT style).
 */
const updateTodoSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title must not exceed 100 characters').optional(),
  description: z.string().optional(),
  status: z.enum(['todo', 'in-progress', 'done']).optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  category: z.string().optional(),
  dueDate: z.string().optional().nullable(),
});

/**
 * Route params type for dynamic route [id]
 */
interface RouteParams {
  params: {
    id: string;
  };
}

/**
 * UPDATE TODO (PUT)
 * Updates a specific todo belonging to the logged-in user.
 */
export async function PUT(req: Request, { params }: RouteParams) {
  try {
    /**
     * Get user session from NextAuth
     * Ensures only authenticated users can access this route
     */
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.id) {
      const resBody: ApiResponse<null> = { success: false, error: 'Unauthorized' };
      return NextResponse.json(resBody, { status: 401 });
    }

    // Extract todo ID from URL (e.g. /api/todos/123)
    const { id } = params;

    // Parse request body JSON
    const body = await req.json();

    /**
     * Validate request body using Zod schema
     * Ensures only allowed fields are updated
     */
    const result = updateTodoSchema.safeParse(body);
    if (!result.success) {
      const resBody: ApiResponse<null> = {
        success: false,
        error: result.error.issues.map((e) => e.message).join(', '),
      };
      return NextResponse.json(resBody, { status: 400 });
    }

    // Connect to MongoDB
    await dbConnect();

    /**
     * Find todo that belongs to this user
     * Prevents users from editing others' todos
     */
    const todo = await Todo.findOne({ _id: id, userId: session.user.id });
    if (!todo) {
      const resBody: ApiResponse<null> = { success: false, error: 'Todo not found' };
      return NextResponse.json(resBody, { status: 404 });
    }

    // Extract validated update fields
    const updates = result.data;

    // Only update fields that were provided in request
    if (updates.title !== undefined) todo.title = updates.title;
    if (updates.description !== undefined) todo.description = updates.description;
    if (updates.status !== undefined) todo.status = updates.status;
    if (updates.priority !== undefined) todo.priority = updates.priority;
    if (updates.category !== undefined) todo.category = updates.category;

    /**
     * Handle dueDate separately:
     * - Convert string to Date object
     * - Allow null/undefined to clear the field
     */
    if (updates.dueDate !== undefined) {
      todo.dueDate = updates.dueDate ? new Date(updates.dueDate) : undefined;
    }

    // Save updated document to MongoDB
    await todo.save();

    /**
     * Format response object
     * Convert MongoDB ObjectId and Date into string format for API response
     */
    const formattedTodo: ITodo = {
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
    };

    // Return success response
    const resBody: ApiResponse<ITodo> = { success: true, data: formattedTodo };
    return NextResponse.json(resBody, { status: 200 });

  } catch (error: any) {
    // Log unexpected errors for debugging
    console.error('PUT /api/todos/[id] error:', error);

    // Generic server error response
    const resBody: ApiResponse<null> = { success: false, error: 'Internal Server Error' };
    return NextResponse.json(resBody, { status: 500 });
  }
}

/**
 * DELETE TODO
 * Deletes a specific todo belonging to the logged-in user.
 */
export async function DELETE(req: Request, { params }: RouteParams) {
  try {
    /**
     * Authenticate user session
     */
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.id) {
      const resBody: ApiResponse<null> = { success: false, error: 'Unauthorized' };
      return NextResponse.json(resBody, { status: 401 });
    }

    // Extract todo ID from route
    const { id } = params;

    // Connect to database
    await dbConnect();

    /**
     * Delete only if todo belongs to the current user
     * Prevents unauthorized deletion
     */
    const result = await Todo.deleteOne({ _id: id, userId: session.user.id });

    // If nothing was deleted, todo doesn't exist or doesn't belong to user
    if (result.deletedCount === 0) {
      const resBody: ApiResponse<null> = { success: false, error: 'Todo not found' };
      return NextResponse.json(resBody, { status: 404 });
    }

    // Return success response
    const resBody: ApiResponse<null> = { success: true };
    return NextResponse.json(resBody, { status: 200 });

  } catch (error: any) {
    // Log error for debugging
    console.error('DELETE /api/todos/[id] error:', error);

    // Generic error response
    const resBody: ApiResponse<null> = { success: false, error: 'Internal Server Error' };
    return NextResponse.json(resBody, { status: 500 });
  }
}