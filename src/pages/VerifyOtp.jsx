import { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { Shield, Smartphone, Lock, Loader2 } from 'lucide-react';

const VerifyOtp = () => {
  const { verifyOtp } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();
  
  const [optCode, setOtpCode] = useState('');
  const [loading, setLoading] = useState(false);
  
  const [timer, setTimer] = useState(60);

  const email = location.state?.email;

  useEffect(() => {
    if (!email) {
      navigate('/login');
    }
  }, [email, navigate]);

  useEffect(() => {
    let interval;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const handleResend = async () => {
    if (timer > 0) return;
    
    setLoading(true);

    try {
        const result = await api.post('/auth/resend-otp', { email });
        setTimer(60); 
        showToast(result.data.message || 'New code sent!', 'success');
    } catch (err) {
      console.error('[RESEND OTP ERROR]', {
        message: err.message,
        status: err.response?.status,
        data: err.response?.data,
      });
      showToast(err.response?.data?.message || 'Failed to resend code', 'error');
    } finally {
        setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (optCode.length !== 6) return;
    
    setLoading(true);

    const result = await verifyOtp(email, optCode);
    setLoading(false);

    if (result.success) {
      showToast('Login successful!', 'success');
      navigate('/dashboard');
    } else {
      showToast(result.message, 'error');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white p-4 font-sans">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
            <div className="mx-auto h-16 w-16 bg-blue-600 rounded-2xl flex items-center justify-center mb-4">
                 <Shield className="h-8 w-8 text-white" />
            </div>
          <h2 className="text-3xl font-bold tracking-tight">Secure Note Vault</h2>
          <p className="mt-2 text-sm text-gray-400">Enterprise-grade encrypted storage</p>
        </div>

        <div className="bg-gray-800 py-8 px-4 shadow-xl border border-gray-700 rounded-xl sm:px-10">
            <div className="mb-6 text-center">
                 <div className="mx-auto h-12 w-12 bg-blue-900/50 rounded-full flex items-center justify-center mb-3">
                    <Smartphone className="h-6 w-6 text-blue-500" />
                 </div>
                 <h3 className="text-xl font-semibold">Two-Factor Authentication</h3>
                 <p className="text-gray-400 text-sm mt-1">Enter the 6-digit code sent to {email}</p>
            </div>
          <form className="space-y-6" onSubmit={handleSubmit}>

            <div>
              <label htmlFor="otp" className="sr-only">
                OTP Code
              </label>
              <input
                id="otp"
                name="otp"
                type="text"
                maxLength="6"
                required
                value={optCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                className="block w-full text-center h-14 text-2xl tracking-widest bg-gray-700 border border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 text-white placeholder-gray-500"
                placeholder="000000"
              />
            </div>

            <div>
              <button
                type="submit"
                disabled={loading || optCode.length !== 6}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? (
                    <div className="flex items-center gap-2">
                         <Loader2 className="animate-spin h-4 w-4" />
                         <span>Verifying...</span>
                    </div>
                ) : 'Verify Code'}
              </button>
            </div>
          </form>

            <div className="mt-6 text-center">
                 <button 
                    onClick={handleResend}
                    disabled={timer > 0 || loading}
                    className={`text-sm font-medium ${timer > 0 ? 'text-gray-500 cursor-not-allowed' : 'text-blue-500 hover:text-blue-400'}`}
                 >
                     {timer > 0 ? `Resend Code in ${timer}s` : 'Resend Code'}
                 </button>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-700">
             <div className="text-center text-xs text-gray-500 flex items-center justify-center gap-2">
                 <Lock className="h-3 w-3" />
                 Protected by 256-bit AES encryption
             </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyOtp;
