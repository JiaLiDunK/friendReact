import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import TypeManagement from "./pages/dashboard/TypeManagement";
import PromptManagement from "./pages/dashboard/PromptManagement";
import DocumentManagement from "./pages/dashboard/DocumentManagement";
import BookVectorsManagement from "./pages/dashboard/BookVectorsManagement";
import KnowledgeBaseManagement from "./pages/dashboard/knowledgeBaseManagement";
import KnowledgeBooksManagement from "./pages/dashboard/KnowledgeBooksManagement"
import MemoryMangament from "./pages/dashboard/MemoryMangament"
import ChatManagement from "./pages/dashboard/ChatManagement"
import SearchManagement from "./pages/dashboard/SearchManagement";
import QuestionManagement from "./pages/dashboard/QuestionManagement"
import DatasetManagement  from "./pages/dashboard/DatasetManagement";
import JoinLinkManagement from "./pages/dashboard/JoinLinkManagement";
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
              <Route path="type-management" element={<TypeManagement />} />
              <Route path="prompt-management" element={<PromptManagement />} />
              <Route path="document-management" element={<DocumentManagement />} />
              <Route path="book-vectors-management" element={<BookVectorsManagement />} />
              <Route path="knowledge-base-management" element={<KnowledgeBaseManagement />} />
              <Route path="knowledge-books-management" element={<KnowledgeBooksManagement />} />
              <Route path="memory-mangament" element={<MemoryMangament/>}></Route>
              <Route path="chat-management" element={<ChatManagement/>}></Route>
              <Route path="search-management" element={<SearchManagement />} />
              <Route path="question-management" element={<QuestionManagement />} />
              <Route path="dataset-management" element={<DatasetManagement />} />
              <Route path="join-link-management" element={<JoinLinkManagement />} />
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
