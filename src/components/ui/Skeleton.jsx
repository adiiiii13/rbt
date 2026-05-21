import React from 'react';

export function Skeleton({ className = '' }) {
  return (
    <div className={`animate-pulse bg-slate-800 rounded-md ${className}`} />
  );
}

export function CardSkeleton() {
  return (
    <div className="bg-slate-800/30 rounded-2xl p-4 border border-white/5 animate-pulse">
      <div className="w-full h-40 bg-slate-800 rounded-xl mb-4" />
      <div className="h-6 bg-slate-800 rounded w-3/4 mb-3" />
      <div className="h-4 bg-slate-800 rounded w-1/2 mb-4" />
      <div className="flex justify-between items-center mt-auto">
        <div className="h-4 bg-slate-800 rounded w-1/4" />
        <div className="h-8 bg-slate-800 rounded-lg w-24" />
      </div>
    </div>
  );
}

export function ListSkeleton() {
  return (
    <div className="bg-slate-800/30 rounded-2xl p-4 md:p-5 border border-white/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 animate-pulse">
      <div className="flex-1 space-y-3 w-full">
        <div className="h-5 bg-slate-800 rounded w-3/4" />
        <div className="h-4 bg-slate-800 rounded w-1/2" />
      </div>
      <div className="h-10 bg-slate-800 rounded-xl w-32" />
    </div>
  );
}

export function TableSkeleton({ rows = 5 }) {
  return (
    <div className="animate-pulse">
      <div className="h-12 bg-slate-800/50 rounded-t-xl border-b border-white/5 mb-2" />
      {[...Array(rows)].map((_, i) => (
        <div key={i} className="flex items-center gap-4 py-4 px-6 border-b border-white/5">
          <div className="h-4 bg-slate-800 rounded w-1/4" />
          <div className="h-4 bg-slate-800 rounded w-1/4" />
          <div className="h-4 bg-slate-800 rounded w-1/4" />
          <div className="h-8 bg-slate-800 rounded-lg w-20 ml-auto" />
        </div>
      ))}
    </div>
  );
}

export function GridSkeleton({ count = 6, type = 'card' }) {
  return (
    <div className={type === 'card' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-4"}>
      {[...Array(count)].map((_, i) => (
        <React.Fragment key={i}>
          {type === 'card' ? <CardSkeleton /> : <ListSkeleton />}
        </React.Fragment>
      ))}
    </div>
  );
}
