import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { NoteProvider } from './context/NoteContext';
import ProtectedRoute from './components/ProtectedRoute';
import AdminProtectedRoute from './components/AdminProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import VerifyOtp from './pages/VerifyOtp';
import ForgotPassword from './pages/ForgotPassword';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import AdminLogs from './pages/AdminLogs';
import './index.css';
import { GoogleReCaptchaProvider } from 'react-google-recaptcha-v3';

function App() {
  const recaptchaKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY;

  return (
    <Router>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            <Route 
              path="/login" 
              element={
                <GoogleReCaptchaProvider reCaptchaKey={recaptchaKey}>
                  <Login />
                </GoogleReCaptchaProvider>
              } 
            />
            <Route 
              path="/register" 
              element={
                <GoogleReCaptchaProvider reCaptchaKey={recaptchaKey}>
                  <Register />
                </GoogleReCaptchaProvider>
              } 
            />
            <Route path="/verify-otp" element={<VerifyOtp />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            
            {/* Protected Routes */}
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <NoteProvider>
                    <Dashboard />
                  </NoteProvider>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/profile" 
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              } 
            />
            
            {/* Admin Route */}
            <Route 
              path="/admin/logs" 
              element={
                <AdminProtectedRoute>
                  <AdminLogs />
                </AdminProtectedRoute>
              } 
            />

             {/* Default Redirect */}
             <Route path="/" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
