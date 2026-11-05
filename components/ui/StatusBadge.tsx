import React from 'react';

interface StatusBadgeProps {
  status: string | null | undefined;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  if (!status) return null;

  let colorClasses = 'bg-slate-100 text-slate-700 border-slate-200';

  switch (status) {
    case 'Open':
    case 'Active':
    case 'Selected':
    case 'Highly Matched':
      colorClasses = 'bg-emerald-50 text-emerald-700 border-emerald-200';
      break;
    case 'Shortlisted':
    case 'Matched':
    case 'In Progress':
      colorClasses = 'bg-blue-50 text-blue-700 border-blue-200';
      break;
    case 'Applied':
    case 'Partially Matched':
      colorClasses = 'bg-amber-50 text-amber-700 border-amber-200';
      break;
    case 'Rejected':
    case 'Closed':
    case 'Removed':
    case 'Not Matched':
      colorClasses = 'bg-rose-50 text-rose-700 border-rose-200';
      break;
    case 'Withdrawn':
    case 'Inactive':
    case 'Cancelled':
      colorClasses = 'bg-slate-100 text-slate-600 border-slate-300';
      break;
    case 'Completed':
      colorClasses = 'bg-purple-50 text-purple-700 border-purple-200';
      break;
    case 'Expert':
    case 'High':
      colorClasses = 'bg-indigo-50 text-indigo-700 border-indigo-200';
      break;
    case 'Advanced':
    case 'Medium':
      colorClasses = 'bg-sky-50 text-sky-700 border-sky-200';
      break;
    case 'Intermediate':
    case 'Low':
      colorClasses = 'bg-teal-50 text-teal-700 border-teal-200';
      break;
    case 'Beginner':
      colorClasses = 'bg-slate-100 text-slate-600 border-slate-200';
      break;
  }

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${colorClasses}`}
    >
      {status}
    </span>
  );
}

