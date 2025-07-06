import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import { AuthProvider, useAuth } from "./lib/auth-context";
import { LoginForm } from "./components/auth/LoginForm";

// Create a client for react-query
const queryClient = new QueryClient();

// Login page component that uses auth context
function LoginPage() {
  const { signIn, signUp, signInWithGithub } = useAuth();
  
  return (
    <div className="min-h-screen flex items-center justify-center">
      <LoginForm 
        onLogin={signIn}
        onSignUp={signUp}
        onGithubLogin={signInWithGithub}
      />
    </div>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Sonner position="bottom-center" />
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/" element={<Index />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
