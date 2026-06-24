'use client';

// React core hooks for state, lifecycle, and DOM refs
import React, { useEffect, useState, useRef } from 'react';

// React Hook Form for form state management
import { useForm } from 'react-hook-form';

// Zod resolver connects Zod schema validation with React Hook Form
import { zodResolver } from '@hookform/resolvers/zod';

// Zod for schema-based validation
import { z } from 'zod';

// Types for Todo data structure
import { ITodo, CreateTodoInput } from '@/types';

// Icons for UI
import { X, Loader2 } from 'lucide-react';

/**
 * Validation schema using Zod
 * Ensures all form inputs are valid before submission
 */
const todoFormSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title must not exceed 100 characters'),
  description: z.string().optional(),
  status: z.enum(['todo', 'in-progress', 'done']),
  priority: z.enum(['low', 'medium', 'high']),
  category: z.string().optional(),
  dueDate: z.string().optional().nullable(),
});

// Infer TypeScript type from Zod schema
type TodoFormValues = z.infer<typeof todoFormSchema>;

/**
 * Props for TodoForm component
 * Handles create/edit functionality for todos
 */
interface TodoFormProps {
  isOpen: boolean; // controls modal visibility
  onClose: () => void; // close modal handler
  onSubmit: (data: CreateTodoInput & { _id?: string }) => Promise<void>;
  todo?: ITodo | null; // if present → edit mode
  categories: string[]; // existing categories for suggestions
}

/**
 * TodoForm Component
 * Used for creating and editing tasks inside a modal
 */
export default function TodoForm({
  isOpen,
  onClose,
  onSubmit,
  todo,
  categories,
}: TodoFormProps) {

  // Loading state for form submission
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Controls visibility of category suggestion dropdown
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Reference to detect outside clicks for suggestions dropdown
  const suggestionsRef = useRef<HTMLDivElement>(null);

  /**
   * React Hook Form setup
   * - register: binds inputs
   * - handleSubmit: handles form submission
   * - reset: resets form values
   * - setValue: programmatically set field value
   * - watch: observe field changes
   */
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<TodoFormValues>({
    resolver: zodResolver(todoFormSchema),
    defaultValues: {
      title: '',
      description: '',
      status: 'todo',
      priority: 'medium',
      category: '',
      dueDate: '',
    },
  });

  // Watch category field for live filtering suggestions
  const categoryValue = watch('category') || '';

  /**
   * Effect: Populate form when editing a todo OR reset when closed
   */
  useEffect(() => {
    if (todo) {
      // Convert ISO date → YYYY-MM-DD format for input[type="date"]
      const formattedDate = todo.dueDate
        ? new Date(todo.dueDate).toISOString().split('T')[0]
        : '';

      reset({
        title: todo.title,
        description: todo.description || '',
        status: todo.status,
        priority: todo.priority,
        category: todo.category || '',
        dueDate: formattedDate,
      });
    } else {
      // Reset to default values when creating new todo
      reset({
        title: '',
        description: '',
        status: 'todo',
        priority: 'medium',
        category: '',
        dueDate: '',
      });
    }
  }, [todo, reset, isOpen]);

  /**
   * Effect: Close category suggestions when clicking outside
   */
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Prevent rendering modal when closed
  if (!isOpen) return null;

  /**
   * Handle form submission
   * - sends data to parent handler
   * - closes modal on success
   */
  const onFormSubmit = async (values: TodoFormValues) => {
    setIsSubmitting(true);

    try {
      await onSubmit({
        ...values,
        _id: todo?._id, // include id when editing
        category: values.category?.trim() || undefined,
        dueDate: values.dueDate || undefined,
      });

      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Filter category suggestions based on user input
   */
  const filteredSuggestions = categories.filter(
    (cat) =>
      cat.toLowerCase().includes(categoryValue.toLowerCase()) &&
      cat.toLowerCase() !== categoryValue.toLowerCase()
  );

  return (
    // Modal overlay background
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm transition-opacity">

      {/* Modal container */}
      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl transition-all dark:border-slate-800 dark:bg-slate-900">

        {/* ================= HEADER ================= */}
        <div className="flex items-center justify-between border-b border-slate-100 p-5 dark:border-slate-800">
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
            {todo ? 'Edit Task' : 'Add New Task'}
          </h3>

          {/* Close modal button */}
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-300"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* ================= FORM ================= */}
        <form onSubmit={handleSubmit(onFormSubmit)} className="p-6 space-y-4">

          {/* TITLE FIELD */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
              Title <span className="text-rose-500">*</span>
            </label>

            <input
              type="text"
              {...register('title')}
              placeholder="e.g. Design Landing Page"
              className={`h-10 w-full rounded-xl border px-3 text-sm text-slate-900 outline-none transition-all dark:bg-slate-950 dark:text-slate-100 ${
                errors.title
                  ? 'border-rose-500 focus:ring-2 focus:ring-rose-500/20'
                  : 'border-slate-200 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 dark:border-slate-800 dark:focus:border-violet-400'
              }`}
            />

            {/* Validation error */}
            {errors.title && (
              <p className="mt-1 text-xs font-medium text-rose-500">
                {errors.title.message}
              </p>
            )}
          </div>

          {/* DESCRIPTION FIELD */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
              Description
            </label>

            <textarea
              {...register('description')}
              placeholder="Add details about this task..."
              rows={3}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none transition-all focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-violet-400"
            />
          </div>

          {/* STATUS + PRIORITY */}
          <div className="grid grid-cols-2 gap-4">

            {/* STATUS */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                Status
              </label>

              <select
                {...register('status')}
                className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm font-medium text-slate-700 outline-none transition-all focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300 dark:focus:border-violet-400"
              >
                <option value="todo">Todo</option>
                <option value="in-progress">In Progress</option>
                <option value="done">Done</option>
              </select>
            </div>

            {/* PRIORITY */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                Priority
              </label>

              <select
                {...register('priority')}
                className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm font-medium text-slate-700 outline-none transition-all focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300 dark:focus:border-violet-400"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>

          {/* CATEGORY + DUE DATE */}
          <div className="grid grid-cols-2 gap-4">

            {/* CATEGORY with suggestions */}
            <div className="relative" ref={suggestionsRef}>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                Category
              </label>

              <input
                type="text"
                {...register('category')}
                placeholder="e.g. Work"
                onFocus={() => setShowSuggestions(true)}
                autoComplete="off"
                className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm text-slate-900 outline-none transition-all focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-violet-400"
              />

              {/* Suggestion dropdown */}
              {showSuggestions && filteredSuggestions.length > 0 && (
                <div className="absolute z-50 mt-1 max-h-32 w-full overflow-y-auto rounded-xl border border-slate-100 bg-white py-1.5 shadow-lg dark:border-slate-800 dark:bg-slate-950">
                  {filteredSuggestions.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => {
                        setValue('category', cat);
                        setShowSuggestions(false);
                      }}
                      className="w-full px-3 py-1.5 text-left text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-slate-200"
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* DUE DATE */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                Due Date
              </label>

              <input
                type="date"
                {...register('dueDate')}
                className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm text-slate-900 outline-none transition-all focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-violet-400"
              />
            </div>
          </div>

          {/* FOOTER ACTIONS */}
          <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-5 dark:border-slate-800/80 mt-4">

            {/* Cancel */}
            <button
              type="button"
              onClick={onClose}
              className="h-10 rounded-xl border border-slate-200 px-4 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-800"
            >
              Cancel
            </button>

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 text-sm font-medium text-white shadow-md shadow-violet-500/10 transition-colors hover:bg-violet-700 disabled:opacity-50 dark:bg-violet-500 dark:hover:bg-violet-600"
            >
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {todo ? 'Save Changes' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}