import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import Todo from '@/models/Todo';
import { ApiResponse, ITodo } from '@/types';
import { z } from 'zod';

const createTodoSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title must not exceed 100 characters'),
  description: z.string().optional(),
  status: z.enum(['todo', 'in-progress', 'done']).default('todo'),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
  category: z.string().optional(),
  dueDate: z.string().optional().nullable(),
});

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.id) {
      const resBody: ApiResponse<null> = { success: false, error: 'Unauthorized' };
      return NextResponse.json(resBody, { status: 401 });
    }

    await dbConnect();

    const todos = await Todo.find({ userId: session.user.id }).sort({ createdAt: -1 });

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

    const resBody: ApiResponse<ITodo[]> = { success: true, data: formattedTodos };
    return NextResponse.json(resBody, { status: 200 });
  } catch (error: any) {
    console.error('GET /api/todos error:', error);
    const resBody: ApiResponse<null> = { success: false, error: 'Internal Server Error' };
    return NextResponse.json(resBody, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.id) {
      const resBody: ApiResponse<null> = { success: false, error: 'Unauthorized' };
      return NextResponse.json(resBody, { status: 401 });
    }

    const body = await req.json();
    const result = createTodoSchema.safeParse(body);
    if (!result.success) {
      const resBody: ApiResponse<null> = {
        success: false,
        error: result.error.issues.map((e) => e.message).join(', '),
      };
      return NextResponse.json(resBody, { status: 400 });
    }

    await dbConnect();

    const { title, description, status, priority, category, dueDate } = result.data;

    const newTodo = await Todo.create({
      userId: session.user.id,
      title,
      description,
      status,
      priority,
      category,
      dueDate: dueDate ? new Date(dueDate) : undefined,
    });

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

    const resBody: ApiResponse<ITodo> = { success: true, data: formattedTodo };
    return NextResponse.json(resBody, { status: 201 });
  } catch (error: any) {
    console.error('POST /api/todos error:', error);
    const resBody: ApiResponse<null> = { success: false, error: 'Internal Server Error' };
    return NextResponse.json(resBody, { status: 500 });
  }
}
