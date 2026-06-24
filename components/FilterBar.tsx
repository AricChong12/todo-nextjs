'use client';

// Importing icons from lucide-react for UI decoration
import { Search, SlidersHorizontal, ArrowUpDown } from 'lucide-react';

/**
 * Props definition for FilterBar component
 * This defines all state values and setter functions
 * coming from a parent component (likely using useState)
 */
interface FilterBarProps {
  search: string;
  setSearch: (val: string) => void;

  priorityFilter: string;
  setPriorityFilter: (val: string) => void;

  categoryFilter: string;
  setCategoryFilter: (val: string) => void;

  sortBy: string;
  setSortBy: (val: string) => void;

  // Sorting order can only be ascending or descending
  sortOrder: 'asc' | 'desc';
  setSortOrder: (val: 'asc' | 'desc') => void;

  // List of available categories for dropdown
  categories: string[];
}

/**
 * FilterBar Component
 * Handles:
 * - Searching tasks
 * - Filtering by priority
 * - Filtering by category
 * - Sorting tasks
 */
export default function FilterBar({
  search,
  setSearch,
  priorityFilter,
  setPriorityFilter,
  categoryFilter,
  setCategoryFilter,
  sortBy,
  setSortBy,
  sortOrder,
  setSortOrder,
  categories,
}: FilterBarProps) {
  return (
    // Main container: responsive flex layout with styling
    <div className="flex flex-col gap-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800/80 dark:bg-slate-900 sm:flex-row sm:items-center">

      {/* SEARCH SECTION */}
      <div className="relative flex-1">
        {/* Search icon positioned inside input */}
        <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />

        {/* Search input field */}
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)} // updates search state
          placeholder="Search tasks..."
          className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-4 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-violet-500 focus:bg-white focus:ring-2 focus:ring-violet-500/20 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-600 dark:focus:border-violet-400 dark:focus:bg-slate-950"
        />
      </div>

      {/* FILTER + SORT CONTROLS SECTION */}
      <div className="flex flex-wrap items-center gap-3">

        {/* PRIORITY FILTER */}
        <div className="flex items-center gap-2">
          {/* Filter icon */}
          <SlidersHorizontal className="h-4 w-4 text-slate-400 dark:text-slate-500" />

          {/* Dropdown to select task priority filter */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 outline-none transition-all focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:focus:border-violet-400"
          >
            <option value="all">All Priorities</option>
            <option value="low">Low Priority</option>
            <option value="medium">Medium Priority</option>
            <option value="high">High Priority</option>
          </select>
        </div>

        {/* CATEGORY FILTER */}
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 outline-none transition-all focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:focus:border-violet-400"
        >
          <option value="all">All Categories</option>

          {/* Dynamically render category options from props */}
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>

        {/* SORT BY DROPDOWN */}
        <div className="flex items-center gap-2">
          {/* Sort icon */}
          <ArrowUpDown className="h-4 w-4 text-slate-400 dark:text-slate-500" />

          {/* Choose sorting field */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 outline-none transition-all focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:focus:border-violet-400"
          >
            <option value="createdAt">Date Created</option>
            <option value="dueDate">Due Date</option>
            <option value="priority">Priority</option>
          </select>
        </div>

        {/* SORT ORDER TOGGLE BUTTON */}
        <button
          onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition-all hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800"
          title={sortOrder === 'asc' ? 'Sort Ascending' : 'Sort Descending'}
        >
          {/* Visual indicator of sort direction */}
          <span className="text-base font-bold">
            {sortOrder === 'asc' ? '↑' : '↓'}
          </span>
        </button>
      </div>
    </div>
  );
}