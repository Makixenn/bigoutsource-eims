import React from 'react';
import { Monitor, AlertCircle } from 'lucide-react';

export function MobileBlocker() {
  return (
    <div className="fixed inset-0 z-[9999] hidden max-[720px]:flex flex-col items-center justify-center bg-white p-6 text-center">
      <div className="flex max-w-sm flex-col items-center space-y-6">
        <div className="relative">
          <div className="absolute -inset-4 animate-pulse rounded-full bg-blue-50 opacity-50"></div>
          <div className="relative flex h-24 w-24 items-center justify-center rounded-2xl bg-blue-600 shadow-xl shadow-blue-600/20">
            <Monitor className="h-10 w-10 text-white" strokeWidth={2.5} />
          </div>
          <div className="absolute -bottom-2 -right-2 flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-red-500 shadow-sm">
            <AlertCircle className="h-4 w-4 text-white" strokeWidth={3} />
          </div>
        </div>

        <div className="space-y-3">
          <h2 className="text-2xl font-black tracking-tight text-[#111827]">
            Desktop Use Only
          </h2>
          <p className="text-sm font-bold leading-relaxed text-[#6B7280]">
            Big Outsource EIMS is strictly optimized for desktop usage to ensure proper display of complex tables and data management tools.
          </p>
        </div>

        <div className="w-full rounded-2xl border border-blue-100 bg-blue-50 p-4">
          <p className="text-xs font-black uppercase tracking-widest text-blue-600">
            Please switch to a computer or expand your browser window to continue using the application.
          </p>
        </div>
      </div>
    </div>
  );
}
