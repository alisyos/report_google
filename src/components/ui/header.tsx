'use client';

import { ReactNode } from 'react';

interface HeaderProps {
  children?: ReactNode;
}

export function Header({ children }: HeaderProps) {
  return (
    <header className="bg-blue-600 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <h1 className="text-white font-bold text-xl">구글 광고 관리</h1>
          </div>
          <div className="flex items-center">
            {children}
          </div>
        </div>
      </div>
    </header>
  );
} 