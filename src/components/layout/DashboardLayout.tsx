import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { AppSidebar } from './AppSidebar';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';

export function DashboardLayout() {
  const { isAuthenticated } = useAuth();

  // 未登录则跳转到登录页
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <main className="flex-1 flex flex-col">
          <header className="h-14 border-b border-border flex items-center px-4 bg-card">
            <SidebarTrigger className="mr-4" />
            <h1 className="text-lg font-medium">管理后台</h1>
          </header>
          <div className="flex-1 p-6 bg-background">
            <Outlet />
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
