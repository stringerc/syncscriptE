import React from 'react';
import { HeaderZeroAPI } from './HeaderZeroAPI';
import { Sidebar } from './Sidebar';

interface LayoutZeroAPIProps {
  children: React.ReactNode;
}

export function LayoutZeroAPI({ children }: LayoutZeroAPIProps) {
  return (
    <div className="min-h-screen bg-background">
      <HeaderZeroAPI />
      <div className="flex">
        <Sidebar />
        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}
