import TopNav from '@/components/layout/TopNav';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: '100vh', background: '#F7F7F7' }}>
      <TopNav />
      <main style={{ paddingTop: 48 }}>
        {children}
      </main>
    </div>
  );
}
