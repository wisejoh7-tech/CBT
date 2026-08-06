import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/src/context/AuthContext';
import { SocketProvider } from '@/src/context/SocketContext';
import { Toaster } from '@/lib/ui/sonner';
import { toast } from 'sonner';
import { WifiOff, Wifi } from 'lucide-react';

// Pages
import Home from '@/src/pages/Home';
import CandidateLogin from '@/src/pages/CandidateLogin';
import CandidateRegister from '@/src/pages/CandidateRegister';
import ExamDashboard from '@/src/pages/ExamDashboard';
import ExamPlayer from '@/src/pages/ExamPlayer';
import Admin from '@/src/pages/Admin';
import AdminAuth from '@/src/pages/AdminAuth';
import StaffLogin from '@/src/pages/StaffLogin';
import ResultSlip from '@/src/pages/ResultSlip';
import ResultChecker from '@/src/pages/ResultChecker';
import ExamSlip from '@/src/pages/ExamSlip';
import ExamInstructions from '@/src/pages/ExamInstructions';
import ForgotPassword from '@/src/pages/ForgotPassword';
import ResetPassword from '@/src/pages/ResetPassword';

const ProtectedRoute = ({ children, adminOnly = false }: { children: React.ReactNode, adminOnly?: boolean }) => {
  const { user, profile, loading } = useAuth();

  if (loading) return <div className="flex items-center justify-center h-screen bg-slate-50 font-sans text-muted-foreground animate-pulse">Loading VIVI Portal...</div>;
  if (!user) return <Navigate to="/" />;

  const isAnyAdmin = profile?.role === 'admin' || profile?.role === 'super_admin' || profile?.role === 'reg_admin';

  // Strict Separation: Redirect based on role
  if (adminOnly && !isAnyAdmin) return <Navigate to="/dashboard" />;
  if (!adminOnly && isAnyAdmin) return <Navigate to="/admin" />;

  return <>{children}</>;
};

const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, profile, loading } = useAuth();

  if (loading) return null;

  if (user && profile) {
    const isAnyAdmin = profile.role === 'admin' || profile.role === 'super_admin' || profile.role === 'reg_admin';
    return <Navigate to={isAnyAdmin ? "/admin" : "/dashboard"} />;
  }

  return <>{children}</>;
};

export default function App() {
  useEffect(() => {
    const handleOnline = () => {
      toast.success("Connection Restored", {
        id: 'network-status',
        icon: <Wifi className="w-4 h-4 text-emerald-500" />,
        description: "Your link to the central server is active."
      });
    };

    const handleOffline = () => {
      toast.error("Network Interrupted", {
        id: 'network-status',
        duration: Infinity,
        icon: <WifiOff className="w-4 h-4" />,
        description: "Connection lost. Please remain in your terminal. Progress is locally cached."
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <AuthProvider>
      <SocketProvider>
        <BrowserRouter>
          <div className="min-h-screen">
            <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/candidate-login" element={<PublicRoute><CandidateLogin /></PublicRoute>} />
            <Route path="/candidate-register" element={<PublicRoute><CandidateRegister /></PublicRoute>} />
            <Route
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <ExamDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/exam/:examId" 
              element={
                <ProtectedRoute>
                  <ExamPlayer />
                </ProtectedRoute>
              }
            />
            <Route
              path="/instructions/:examId"
              element={
                <ProtectedRoute>
                  <ExamInstructions />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin" 
              element={
                <ProtectedRoute adminOnly>
                  <Admin />
                </ProtectedRoute>
              } 
            />
            <Route path="/admin/auth" element={<PublicRoute><AdminAuth /></PublicRoute>} />
            <Route path="/forgot-password" element={<PublicRoute><ForgotPassword /></PublicRoute>} />
            <Route path="/reset-password" element={<PublicRoute><ResetPassword /></PublicRoute>} />
            <Route path="/staff" element={<PublicRoute><StaffLogin /></PublicRoute>} />
            <Route path="/exam-slip/:examNumber" element={<ProtectedRoute adminOnly><ExamSlip /></ProtectedRoute>} />
            <Route path="/results" element={<ResultChecker />} />
            <Route path="/result-slip/:examNumber" element={<ProtectedRoute><ResultSlip /></ProtectedRoute>} />
            <Route path="/verify/:examNumber" element={<ResultSlip isVerification />} />
          </Routes>
          <Toaster position="top-center" />
        </div>
      </BrowserRouter>
      </SocketProvider>
    </AuthProvider>
  );
}
