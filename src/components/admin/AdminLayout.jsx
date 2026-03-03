import React from 'react';
import AdminNav from './AdminNav';

export default function AdminLayout({ children, currentPage }) {
  return (
    <div className="dark min-h-screen bg-zinc-950 flex">
      <AdminNav currentPage={currentPage} />
      <main className="flex-1 lg:ml-56 min-h-screen overflow-y-auto">
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  );
}