import TopNav from '@/components/layout/TopNav';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: '100vh' }}>
      <TopNav />
      <main style={{ paddingTop: 48 }}>
        {children}
      </main>
    </div>
  );
}
