'use client';

// React core + state management
import React, { useState } from 'react';

// Todo type definition (likely MongoDB / API model)
import { ITodo } from '@/types';

// Drag & drop hook from dnd-kit for making cards draggable
import { useDraggable } from '@dnd-kit/core';

// Icons for UI actions and labels
import { Calendar, Tag, Trash2, Edit2, GripVertical } from 'lucide-react';

/**
 * Props for TodoCard component
 * Handles:
 * - Editing todo
 * - Deleting todo
 * - Toggling completion status
 */
interface TodoCardProps {
  todo: ITodo;
  onEdit: (todo: ITodo) => void;
  onDelete: (id: string) => Promise<void>;
  onToggleComplete: (todo: ITodo) => Promise<void>;
}

/**
 * TodoCard Component
 * Represents a single task card with:
 * - drag & drop support
 * - completion toggle
 * - edit/delete actions
 * - priority, category, due date display
 */
export default function TodoCard({
  todo,
  onEdit,
  onDelete,
  onToggleComplete,
}: TodoCardProps) {
  // Loading state for delete action
  const [isDeleting, setIsDeleting] = useState(false);

  // Loading state for toggle completion action
  const [isToggling, setIsToggling] = useState(false);

  /**
   * Make card draggable using dnd-kit
   * - id: unique identifier (todo._id)
   * - data: attached metadata (todo object)
   */
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: todo._id,
      data: { todo },
    });

  /**
   * Apply drag transform styling when dragging
   * Moves card visually + increases z-index
   */
  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        zIndex: 50,
      }
    : undefined;

  /**
   * Check if task is overdue:
   * - must have dueDate
   * - must NOT be completed
   * - must be before current date (excluding today)
   */
  const isOverdue = (() => {
    if (!todo.dueDate || todo.status === 'done') return false;
    return (
      new Date(todo.dueDate) < new Date() &&
      new Date(todo.dueDate).toDateString() !==
        new Date().toDateString()
    );
  })();

  /**
   * Toggle completion handler
   * Prevents event bubbling (important for drag/click conflicts)
   */
  const handleToggle = async (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    setIsToggling(true);

    try {
      await onToggleComplete(todo);
    } finally {
      setIsToggling(false);
    }
  };

  /**
   * Delete handler
   * - stops event bubbling
   * - confirms before deleting
   * - sets loading state while deleting
   */
  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();

    if (confirm('Are you sure you want to delete this task?')) {
      setIsDeleting(true);
      try {
        await onDelete(todo._id);
      } catch (err) {
        setIsDeleting(false);
      }
    }
  };

  /**
   * Priority-based color styles
   * Used for badge styling
   */
  const priorityColors = {
    low: 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20',
    medium: 'bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20',
    high: 'bg-rose-50 text-rose-700 border-rose-100 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20',
  };

  /**
   * Format date into readable string:
   * Example: "Jan 5, 2026"
   */
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';

    return new Date(dateStr).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    // Main card container
    <div
      ref={setNodeRef}
      style={style}
      className={`group relative flex flex-col gap-3 rounded-xl border bg-white p-4 shadow-sm transition-all duration-200 dark:bg-slate-900 ${
        isDragging
          ? 'opacity-50 border-violet-500 shadow-lg scale-[1.02] cursor-grabbing'
          : 'border-slate-200 hover:border-slate-300 dark:border-slate-800 dark:hover:border-slate-700 hover:shadow-md'
      } ${
        isOverdue
          ? 'border-rose-300 dark:border-rose-950 bg-rose-50/20 dark:bg-rose-950/5'
          : ''
      }`}
    >
      {/* Top section: checkbox, title, drag handle */}
      <div className="flex items-start justify-between gap-2">

        {/* LEFT: checkbox + content */}
        <div className="flex items-start gap-2.5 flex-1 min-w-0">

          {/* Completion checkbox */}
          <div className="flex h-5 items-center mt-1">
            <input
              type="checkbox"
              checked={todo.status === 'done'}
              onChange={handleToggle}
              disabled={isToggling}
              className="h-4.5 w-4.5 rounded border-slate-300 text-violet-600 focus:ring-violet-500/20 dark:border-slate-700 dark:bg-slate-800 dark:checked:bg-violet-500 cursor-pointer disabled:opacity-50"
            />
          </div>

          {/* Title + description */}
          <div className="flex-1 min-w-0">

            {/* Todo title */}
            <h4
              className={`text-sm font-semibold leading-relaxed text-slate-800 dark:text-slate-200 break-words ${
                todo.status === 'done'
                  ? 'line-through text-slate-400 dark:text-slate-500'
                  : ''
              }`}
            >
              {todo.title}
            </h4>

            {/* Optional description */}
            {todo.description && (
              <p
                className={`mt-1 text-xs text-slate-500 dark:text-slate-400 line-clamp-2 break-words ${
                  todo.status === 'done'
                    ? 'line-through text-slate-400/80 dark:text-slate-600'
                    : ''
                }`}
              >
                {todo.description}
              </p>
            )}
          </div>
        </div>

        {/* DRAG HANDLE */}
        <div
          {...attributes}
          {...listeners}
          className="flex h-7 w-7 cursor-grab items-center justify-center rounded-lg text-slate-400 opacity-0 transition-opacity hover:bg-slate-100 hover:text-slate-600 group-hover:opacity-100 dark:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-400"
        >
          <GripVertical className="h-4 w-4" />
        </div>
      </div>

      {/* BADGES SECTION (priority, category, due date) */}
      <div className="flex flex-wrap items-center gap-2 mt-1">

        {/* Priority badge */}
        <span
          className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
            priorityColors[todo.priority]
          }`}
        >
          {todo.priority}
        </span>

        {/* Category badge */}
        {todo.category && (
          <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-400">
            <Tag className="h-3 w-3" />
            {todo.category}
          </span>
        )}

        {/* Due date badge */}
        {todo.dueDate && (
          <span
            className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-medium ${
              isOverdue
                ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400'
                : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
            }`}
          >
            <Calendar className="h-3 w-3" />
            {formatDate(todo.dueDate)}

            {/* Overdue label */}
            {isOverdue && (
              <span className="text-[10px] font-bold uppercase tracking-wider ml-0.5">
                (Overdue)
              </span>
            )}
          </span>
        )}
      </div>

      {/* ACTION BUTTONS */}
      <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-3 dark:border-slate-800/60 mt-1">

        {/* Edit button */}
        <button
          onClick={() => onEdit(todo)}
          className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:text-slate-500 dark:hover:bg-slate-800 dark:hover:text-slate-300"
          title="Edit Task"
        >
          <Edit2 className="h-3.5 w-3.5" />
        </button>

        {/* Delete button */}
        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600 dark:text-slate-500 dark:hover:bg-rose-950/20 dark:hover:text-rose-400"
          title="Delete Task"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}