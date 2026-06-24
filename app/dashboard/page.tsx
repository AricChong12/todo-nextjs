// Enable client-side rendering (required for hooks like useState, useEffect, etc.)
'use client';

import React, { useEffect, useState } from 'react';

// Get current logged-in user session from NextAuth
import { useSession } from 'next-auth/react';

// Icons used in UI
import { Plus, ClipboardList } from 'lucide-react';

// Drag and Drop context + types from dnd-kit
import { DndContext, DragEndEvent } from '@dnd-kit/core';
import { useDroppable } from '@dnd-kit/core';

// UI components
import Header from '@/components/Header';
import FilterBar from '@/components/FilterBar';
import TodoCard from '@/components/TodoCard';
import TodoForm from '@/components/TodoForm';

// Type definitions for todos
import { ITodo, CreateTodoInput } from '@/types';

/* =========================================================
   KANBAN COLUMN COMPONENT (DROPPABLE AREA)
   Each column represents a status: todo / in-progress / done
========================================================= */
function KanbanColumn({
  id,
  title,
  count,
  children,
}: {
  id: 'todo' | 'in-progress' | 'done';
  title: string;
  count: number;
  children: React.ReactNode;
}) {
  // Makes this column droppable for drag-and-drop
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col rounded-2xl border p-4 transition-all duration-200 ${
        isOver
          ? 'border-violet-400 bg-violet-50/10 dark:border-violet-500/20 dark:bg-violet-950/5'
          : 'border-slate-200/80 bg-slate-50/40 dark:border-slate-800/80 dark:bg-slate-900/20'
      }`}
    >
      {/* Column Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">

          {/* Colored status dot */}
          <span
            className={`h-2.5 w-2.5 rounded-full ${
              id === 'todo'
                ? 'bg-slate-400 dark:bg-slate-500'
                : id === 'in-progress'
                ? 'bg-amber-500'
                : 'bg-emerald-500'
            }`}
          />

          {/* Column title */}
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            {title}
          </h3>
        </div>

        {/* Task count badge */}
        <span className="flex h-5.5 w-5.5 items-center justify-center rounded-full bg-slate-200/60 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-400">
          {count}
        </span>
      </div>

      {/* Column content (tasks go here) */}
      <div className="flex flex-col gap-3 min-h-[450px]">
        {children}
      </div>
    </div>
  );
}

/* =========================================================
   LOADING SKELETON UI (shown while fetching todos)
========================================================= */
function LoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
      {['Todo', 'In Progress', 'Done'].map((col) => (
        <div
          key={col}
          className="rounded-2xl border border-slate-200/80 bg-slate-50/40 p-4 dark:border-slate-800/80 dark:bg-slate-900/20"
        >
          {/* Column header skeleton */}
          <div className="h-6 w-24 rounded bg-slate-200 dark:bg-slate-800 animate-pulse mb-4" />

          {/* Card skeletons */}
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="h-28 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 animate-pulse"
              >
                <div className="h-4 w-3/4 rounded bg-slate-200 dark:bg-slate-800 mb-3" />
                <div className="h-3 w-1/2 rounded bg-slate-200 dark:bg-slate-800 mb-4" />
                <div className="flex gap-2">
                  <div className="h-5 w-12 rounded bg-slate-200 dark:bg-slate-800" />
                  <div className="h-5 w-16 rounded bg-slate-200 dark:bg-slate-800" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/* =========================================================
   MAIN DASHBOARD COMPONENT
========================================================= */
export default function Dashboard() {

  // User session (name, email, etc.)
  const { data: session } = useSession();

  // Main todos state
  const [todos, setTodos] = useState<ITodo[]>([]);

  // Loading & error states for API fetching
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /* ---------------- FILTER STATES ---------------- */
  const [search, setSearch] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  /* ---------------- FORM MODAL STATES ---------------- */
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTodo, setEditingTodo] = useState<ITodo | null>(null);

  /* =========================================================
     FETCH TODOS ON COMPONENT MOUNT
  ========================================================= */
  useEffect(() => {
    async function fetchTodos() {
      try {
        const res = await fetch('/api/todos');
        if (!res.ok) throw new Error('Failed to fetch tasks');

        const json = await res.json();

        if (json.success) {
          setTodos(json.data);
        } else {
          throw new Error(json.error || 'Failed to fetch tasks');
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchTodos();
  }, []);

  /* =========================================================
     EXTRACT UNIQUE CATEGORIES FROM TODOS
  ========================================================= */
  const categories = Array.from(
    new Set(todos.map((t) => t.category).filter(Boolean))
  ) as string[];

  /* =========================================================
     DRAG AND DROP HANDLER (MOVE TASK BETWEEN COLUMNS)
  ========================================================= */
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const todoId = active.id as string;
    const newStatus = over.id as 'todo' | 'in-progress' | 'done';

    const currentTodo = todos.find((t) => t._id === todoId);
    if (!currentTodo || currentTodo.status === newStatus) return;

    // Optimistic UI update (instant UI change)
    setTodos((prev) =>
      prev.map((t) =>
        t._id === todoId ? { ...t, status: newStatus } : t
      )
    );

    try {
      // Persist update to backend
      const res = await fetch(`/api/todos/${todoId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      const json = await res.json();

      if (!json.success) {
        throw new Error(json.error || 'Failed to update status');
      }
    } catch (err) {
      console.error(err);

      // Revert UI if API fails
      setTodos((prev) =>
        prev.map((t) =>
          t._id === todoId
            ? { ...t, status: currentTodo.status }
            : t
        )
      );
    }
  };

  /* =========================================================
     TOGGLE COMPLETE / INCOMPLETE
  ========================================================= */
  const handleToggleComplete = async (todo: ITodo) => {
    const newStatus = todo.status === 'done' ? 'todo' : 'done';

    setTodos((prev) =>
      prev.map((t) =>
        t._id === todo._id ? { ...t, status: newStatus } : t
      )
    );

    try {
      const res = await fetch(`/api/todos/${todo._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      const json = await res.json();

      if (!json.success) {
        throw new Error(json.error || 'Failed to toggle completeness');
      }
    } catch (err) {
      console.error(err);

      // revert if failed
      setTodos((prev) =>
        prev.map((t) =>
          t._id === todo._id ? { ...t, status: todo.status } : t
        )
      );
    }
  };

  /* =========================================================
     DELETE TODO
  ========================================================= */
  const handleDeleteTodo = async (id: string) => {
    try {
      const res = await fetch(`/api/todos/${id}`, {
        method: 'DELETE',
      });

      const json = await res.json();

      if (json.success) {
        setTodos((prev) => prev.filter((t) => t._id !== id));
      } else {
        throw new Error(json.error || 'Failed to delete task');
      }
    } catch (err) {
      console.error(err);
      alert('Could not delete task. Please try again.');
    }
  };

  /* =========================================================
     CREATE / UPDATE TODO SUBMISSION
  ========================================================= */
  const handleFormSubmit = async (
    inputData: CreateTodoInput & { _id?: string }
  ) => {
    const isEdit = !!inputData._id;
    const url = isEdit ? `/api/todos/${inputData._id}` : '/api/todos';
    const method = isEdit ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(inputData),
      });

      const json = await res.json();

      if (json.success) {
        if (isEdit) {
          setTodos((prev) =>
            prev.map((t) => (t._id === json.data._id ? json.data : t))
          );
        } else {
          setTodos((prev) => [json.data, ...prev]);
        }
      } else {
        throw new Error(json.error || 'Failed to save task');
      }
    } catch (err) {
      console.error(err);
      alert('Could not save task. Please check validation rules.');
      throw err;
    }
  };

  /* ---------------- UI HELPERS ---------------- */

  const handleAddTaskClick = () => {
    setEditingTodo(null);
    setIsFormOpen(true);
  };

  const handleEditClick = (todo: ITodo) => {
    setEditingTodo(todo);
    setIsFormOpen(true);
  };

  /* =========================================================
     FILTER + SORT LOGIC (SEARCH, PRIORITY, CATEGORY)
  ========================================================= */
  const filteredTodos = todos
    .filter((todo) => {
      const matchesSearch =
        todo.title.toLowerCase().includes(search.toLowerCase()) ||
        todo.description?.toLowerCase().includes(search.toLowerCase());

      const matchesPriority =
        priorityFilter === 'all' || todo.priority === priorityFilter;

      const matchesCategory =
        categoryFilter === 'all' || todo.category === categoryFilter;

      return matchesSearch && matchesPriority && matchesCategory;
    })
    .sort((a, b) => {
      let comparison = 0;

      if (sortBy === 'createdAt') {
        comparison =
          new Date(a.createdAt).getTime() -
          new Date(b.createdAt).getTime();
      } else if (sortBy === 'dueDate') {
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        comparison =
          new Date(a.dueDate).getTime() -
          new Date(b.dueDate).getTime();
      } else if (sortBy === 'priority') {
        const priorityWeight = { low: 1, medium: 2, high: 3 };
        comparison =
          priorityWeight[a.priority] - priorityWeight[b.priority];
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

  /* ---------------- GROUP INTO KANBAN COLUMNS ---------------- */
  const columnData = {
    todo: filteredTodos.filter((t) => t.status === 'todo'),
    'in-progress': filteredTodos.filter((t) => t.status === 'in-progress'),
    done: filteredTodos.filter((t) => t.status === 'done'),
  };

  /* =========================================================
     RENDER UI
  ========================================================= */
  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 text-slate-900 dark:text-slate-50 flex flex-col">

      {/* Top navigation/header */}
      <Header />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

        {/* Welcome section */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Welcome back,{' '}
              <span className="bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent dark:from-violet-400 dark:to-indigo-400">
                {session?.user?.name || 'Guest'}
              </span>
            </h1>

            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Manage your tasks and boost your productivity flow today.
            </p>
          </div>

          {/* Add task button */}
          <button
            onClick={handleAddTaskClick}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-violet-600 px-5 text-sm font-semibold text-white shadow-lg shadow-violet-500/20 transition-all hover:bg-violet-700 hover:shadow-violet-500/10"
          >
            <Plus className="h-4 w-4" />
            Add New Task
          </button>
        </div>

        {/* Filter bar */}
        <FilterBar
          search={search}
          setSearch={setSearch}
          priorityFilter={priorityFilter}
          setPriorityFilter={setPriorityFilter}
          categoryFilter={categoryFilter}
          setCategoryFilter={setCategoryFilter}
          sortBy={sortBy}
          setSortBy={setSortBy}
          sortOrder={sortOrder}
          setSortOrder={setSortOrder}
          categories={categories}
        />

        {/* Error display */}
        {error && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm font-medium text-rose-700 dark:border-rose-950/30 dark:bg-rose-950/10 dark:text-rose-400">
            {error}
          </div>
        )}

        {/* MAIN CONTENT */}
        {loading ? (
          <LoadingSkeleton />
        ) : todos.length === 0 ? (
          // Empty state UI
          <div className="flex flex-col items-center justify-center border border-dashed border-slate-200 rounded-3xl bg-white/40 p-12 text-center dark:border-slate-800 dark:bg-slate-900/10 min-h-[400px]">
            <ClipboardList className="h-8 w-8 mb-5 text-slate-400" />
            <h3 className="text-lg font-bold">No tasks created yet</h3>
            <p className="text-sm text-slate-500 mt-1 mb-6">
              Create your very first task to organize your flow.
            </p>

            <button
              onClick={handleAddTaskClick}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 text-sm font-semibold text-white"
            >
              <Plus className="h-4 w-4" />
              Create First Task
            </button>
          </div>
        ) : (
          // Kanban board with drag & drop
          <DndContext onDragEnd={handleDragEnd}>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">

              <KanbanColumn id="todo" title="Todo" count={columnData.todo.length}>
                {columnData.todo.map((todo) => (
                  <TodoCard
                    key={todo._id}
                    todo={todo}
                    onEdit={handleEditClick}
                    onDelete={handleDeleteTodo}
                    onToggleComplete={handleToggleComplete}
                  />
                ))}
              </KanbanColumn>

              <KanbanColumn id="in-progress" title="In Progress" count={columnData['in-progress'].length}>
                {columnData['in-progress'].map((todo) => (
                  <TodoCard
                    key={todo._id}
                    todo={todo}
                    onEdit={handleEditClick}
                    onDelete={handleDeleteTodo}
                    onToggleComplete={handleToggleComplete}
                  />
                ))}
              </KanbanColumn>

              <KanbanColumn id="done" title="Done" count={columnData.done.length}>
                {columnData.done.map((todo) => (
                  <TodoCard
                    key={todo._id}
                    todo={todo}
                    onEdit={handleEditClick}
                    onDelete={handleDeleteTodo}
                    onToggleComplete={handleToggleComplete}
                  />
                ))}
              </KanbanColumn>

            </div>
          </DndContext>
        )}
      </main>

      {/* Task modal form */}
      <TodoForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleFormSubmit}
        todo={editingTodo}
        categories={categories}
      />
    </div>
  );
}