'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function Navbar() {
  const pathname = usePathname();
  
  return (
    <header className="bg-blue-600 shadow-md fixed top-0 left-0 right-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <h1 className="text-white font-bold text-xl">구글 광고 관리</h1>
          </div>
          <div className="flex items-center space-x-4">
            <Link 
              href="/" 
              className={`text-white px-3 py-2 rounded-md text-sm font-medium ${
                pathname === '/' ? 'bg-blue-700' : 'hover:bg-blue-500'
              }`}
            >
              리포트
            </Link>
            <Link 
              href="/keyword-chatbot" 
              className={`text-white px-3 py-2 rounded-md text-sm font-medium ${
                pathname === '/keyword-chatbot' ? 'bg-blue-700' : 'hover:bg-blue-500'
              }`}
            >
              키워드관리 챗봇
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
} 