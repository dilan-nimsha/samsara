import dynamic from 'next/dynamic';

const TopNav = dynamic(() => import('@/components/layout/TopNav'), {
  loading: () => <div style={{ height: 48, background: '#111111', borderBottom: '1px solid rgba(255,255,255,0.08)' }} />,
});

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: '100vh', background: '#F7F7F7' }}>
      <TopNav />
      <main style={{ paddingTop: 48 }}>
        {children}
      </main>
    </div>
  );
}
