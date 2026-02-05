import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isMfaPending, setIsMfaPending] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/auth/me');
      setUser(data);
      setIsAuthenticated(true);
      setIsMfaPending(false);
    } catch (error) {
      setUser(null);
      setIsAuthenticated(false);
      setIsMfaPending(false);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password, recaptchaToken) => {
    try {
      const { data } = await api.post('/auth/login', { email, password, recaptchaToken });
      // Backend returns 200 with "OTP sent" message if login is valid but needs MFA
      setIsMfaPending(true);
      return { success: true, message: data.message };
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.message || 'Login failed' 
      };
    }
  };

  const verifyOtp = async (email, otp) => {
    try {
      const { data } = await api.post('/auth/verify-otp', { email, otp });
      setUser({ role: data.role }); 
      setIsAuthenticated(true);
      setIsMfaPending(false);
      checkAuth();
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.message || 'Verification failed' 
      };
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error("Logout error", error);
    } finally {
      setUser(null);
      setIsAuthenticated(false);
      setIsMfaPending(false);
    }
  };

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        isAuthenticated, 
        isMfaPending, 
        loading, 
        login, 
        verifyOtp, 
        logout,
        checkAuth,
        setUser 
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
