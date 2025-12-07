import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import TypeManagement from "./pages/dashboard/TypeManagement";
import Login from "./pages/Login";
import Home from "./pages/dashboard/Home";
import Placeholder from "./pages/dashboard/Placeholder";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* 登录页 */}
            <Route path="/login" element={<Login />} />
            
            {/* 根路径重定向到登录页 */}
            <Route path="/" element={<Navigate to="/login" replace />} />
            
            {/* 主应用布局 */}
            <Route path="/dashboard" element={<DashboardLayout />}>
              <Route index element={<Home />} />
              <Route path="users" element={<Placeholder />} />
              <Route path="reports" element={<Placeholder />} />
              <Route path="docs" element={<Placeholder />} />
              <Route path="messages" element={<Placeholder />} />
              <Route path="settings" element={<Placeholder />} />
              <Route path="/dashboard/type-management" element={<TypeManagement />} />
            </Route>
            
            {/* 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
