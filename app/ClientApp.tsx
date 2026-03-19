'use client';

import dynamic from 'next/dynamic';

const ReactApp = dynamic(() => import('../src/App'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      <div className="text-center">
        <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-white border-t-transparent" />
        <p className="text-sm text-white/55">Loading community...</p>
      </div>
    </div>
  ),
});

export default function ClientApp() {
  return <ReactApp />;
}
