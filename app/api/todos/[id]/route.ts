import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import Todo from '@/models/Todo';
import { ApiResponse, ITodo } from '@/types';
import { z } from 'zod';

const updateTodoSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title must not exceed 100 characters').optional(),
  description: z.string().optional(),
  status: z.enum(['todo', 'in-progress', 'done']).optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  category: z.string().optional(),
  dueDate: z.string().optional().nullable(),
});

interface RouteParams {
  params: {
    id: string;
  };
}

export async function PUT(req: Request, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.id) {
      const resBody: ApiResponse<null> = { success: false, error: 'Unauthorized' };
      return NextResponse.json(resBody, { status: 401 });
    }

    const { id } = params;
    const body = await req.json();

    const result = updateTodoSchema.safeParse(body);
    if (!result.success) {
      const resBody: ApiResponse<null> = {
        success: false,
        error: result.error.issues.map((e) => e.message).join(', '),
      };
      return NextResponse.json(resBody, { status: 400 });
    }

    await dbConnect();

    // Ensure the todo belongs to the current user
    const todo = await Todo.findOne({ _id: id, userId: session.user.id });
    if (!todo) {
      const resBody: ApiResponse<null> = { success: false, error: 'Todo not found' };
      return NextResponse.json(resBody, { status: 404 });
    }

    const updates = result.data;
    if (updates.title !== undefined) todo.title = updates.title;
    if (updates.description !== undefined) todo.description = updates.description;
    if (updates.status !== undefined) todo.status = updates.status;
    if (updates.priority !== undefined) todo.priority = updates.priority;
    if (updates.category !== undefined) todo.category = updates.category;
    if (updates.dueDate !== undefined) {
      todo.dueDate = updates.dueDate ? new Date(updates.dueDate) : undefined;
    }

    await todo.save();

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

    const resBody: ApiResponse<ITodo> = { success: true, data: formattedTodo };
    return NextResponse.json(resBody, { status: 200 });
  } catch (error: any) {
    console.error('PUT /api/todos/[id] error:', error);
    const resBody: ApiResponse<null> = { success: false, error: 'Internal Server Error' };
    return NextResponse.json(resBody, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.id) {
      const resBody: ApiResponse<null> = { success: false, error: 'Unauthorized' };
      return NextResponse.json(resBody, { status: 401 });
    }

    const { id } = params;
    await dbConnect();

    const result = await Todo.deleteOne({ _id: id, userId: session.user.id });
    if (result.deletedCount === 0) {
      const resBody: ApiResponse<null> = { success: false, error: 'Todo not found' };
      return NextResponse.json(resBody, { status: 404 });
    }

    const resBody: ApiResponse<null> = { success: true };
    return NextResponse.json(resBody, { status: 200 });
  } catch (error: any) {
    console.error('DELETE /api/todos/[id] error:', error);
    const resBody: ApiResponse<null> = { success: false, error: 'Internal Server Error' };
    return NextResponse.json(resBody, { status: 500 });
  }
}
