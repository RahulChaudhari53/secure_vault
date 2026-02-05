import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';
import { useToast } from '../context/ToastContext';
import { Shield, Key, Mail, Lock, ArrowRight, CheckCircle, RefreshCw } from 'lucide-react';

const ForgotPassword = () => {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [resetToken, setResetToken] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  
  const [passwordCriteria, setPasswordCriteria] = useState({
      length: false,
      uppercase: false,
      lowercase: false,
      number: false,
      special: false
  });
  
  const { showToast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    setPasswordCriteria({
      length: newPassword.length >= 8,
      uppercase: /[A-Z]/.test(newPassword),
      lowercase: /[a-z]/.test(newPassword),
      number: /\d/.test(newPassword),
      special: /[\W_]/.test(newPassword)
    });
  }, [newPassword]);

  const isPasswordValid = Object.values(passwordCriteria).every(Boolean);

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post('/auth/forgot-password', { email });
      showToast(data.message, 'success'); 
      setStep(2);
    } catch (error) {
      showToast(error.response?.data?.message || 'Request failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post('/auth/verify-reset-otp', { email, otp });
      setResetToken(data.resetToken); 
      showToast('Code verified successfully', 'success');
      setStep(3);
    } catch (error) {
      showToast(error.response?.data?.message || 'Invalid code', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      showToast("Passwords do not match", "error");
      return;
    }
    if (!isPasswordValid) {
        showToast("Password does not meet security requirements", "error");
        return;
    }

    setLoading(true);
    try {
      await api.post('/auth/reset-password', { 
        resetToken, 
        newPassword 
      });
      showToast('Password reset successfully! Please login.', 'success');
      navigate('/login');
    } catch (error) {
      showToast(error.response?.data?.message || 'Reset failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const renderStepIndicator = () => (
      <div className="flex items-center justify-center mb-8 gap-4">
          {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center">
                  <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 font-bold transition-colors ${
                      step >= s 
                          ? 'bg-blue-600 border-blue-600 text-white' 
                          : 'border-gray-600 text-gray-500'
                  }`}>
                      {step > s ? <CheckCircle size={16} /> : s}
                  </div>
                  {s < 3 && (
                      <div className={`w-12 h-1 mx-2 rounded ${
                          step > s ? 'bg-blue-600' : 'bg-gray-700'
                      }`} />
                  )}
              </div>
          ))}
      </div>
  );

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-gray-900 px-4">
        {/* Header Logo */}
        <div className="mb-8 flex flex-col items-center">
            <div className="h-14 w-14 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20 mb-4 animate-bounce-slow">
                <Shield className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-white tracking-tight">Secure Recovery</h2>
            <p className="text-gray-400 mt-2 text-center max-w-sm">
                {step === 1 && "Start by entering your associated email address."}
                {step === 2 && "Enter the verification code sent to your email."}
                {step === 3 && "Create a strong new password for your account."}
            </p>
        </div>

        <div className="w-full max-w-md bg-gray-800 p-8 rounded-2xl shadow-xl border border-gray-700">
            {renderStepIndicator()}

            {step === 1 && (
                <form onSubmit={handleRequestOtp} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">Email Address</label>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Mail className="h-5 w-5 text-gray-500 group-focus-within:text-blue-500 transition-colors" />
                            </div>
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="block w-full pl-10 pr-3 py-3 border border-gray-700 rounded-xl bg-gray-900 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all shadow-inner"
                                placeholder="name@example.com"
                            />
                        </div>
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-[1.02]"
                    >
                        {loading && <RefreshCw className="animate-spin h-4 w-4" />}
                        Send Recovery Code
                    </button>
                </form>
            )}

            {step === 2 && (
                <form onSubmit={handleVerifyOtp} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">Verification Code</label>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Key className="h-5 w-5 text-gray-500 group-focus-within:text-blue-500 transition-colors" />
                            </div>
                            <input
                                type="text"
                                required
                                maxLength="6"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))} // Numbers only
                                className="block w-full pl-10 pr-3 py-3 border border-gray-700 rounded-xl bg-gray-900 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all shadow-inner tracking-widest text-center font-mono text-xl"
                                placeholder="000000"
                            />
                        </div>
                    </div>
                    <button
                        type="submit"
                        disabled={loading || otp.length < 6}
                        className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-[1.02]"
                    >
                        {loading && <RefreshCw className="animate-spin h-4 w-4" />}
                        Verify Code
                    </button>
                    <div className="text-center">
                        <button type="button" onClick={() => setStep(1)} className="text-sm text-gray-400 hover:text-white underline">
                            Change Email
                        </button>
                    </div>
                </form>
            )}

            {step === 3 && (
                <form onSubmit={handleResetPassword} className="space-y-6">
                     <div>
                         <label className="block text-sm font-medium text-gray-400 mb-2">New Password</label>
                         <div className="relative group">
                             <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                 <Lock className="h-5 w-5 text-gray-500 group-focus-within:text-blue-500 transition-colors" />
                             </div>
                             <input
                                 type="password"
                                 required
                                 value={newPassword}
                                 onChange={(e) => setNewPassword(e.target.value)}
                                 className="block w-full pl-10 pr-3 py-3 border border-gray-700 rounded-xl bg-gray-900 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all shadow-inner"
                                 placeholder="••••••••"
                             />
                         </div>
                         <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                             <div className={`flex items-center gap-1 ${passwordCriteria.length ? 'text-green-400' : 'text-gray-500'}`}>
                                 <div className={`w-2 h-2 rounded-full ${passwordCriteria.length ? 'bg-green-400' : 'bg-gray-600'}`}/> 8+ Chars
                             </div>
                             <div className={`flex items-center gap-1 ${passwordCriteria.uppercase ? 'text-green-400' : 'text-gray-500'}`}>
                                 <div className={`w-2 h-2 rounded-full ${passwordCriteria.uppercase ? 'bg-green-400' : 'bg-gray-600'}`}/> Uppercase
                             </div>
                             <div className={`flex items-center gap-1 ${passwordCriteria.lowercase ? 'text-green-400' : 'text-gray-500'}`}>
                                 <div className={`w-2 h-2 rounded-full ${passwordCriteria.lowercase ? 'bg-green-400' : 'bg-gray-600'}`}/> Lowercase
                             </div>
                             <div className={`flex items-center gap-1 ${passwordCriteria.number ? 'text-green-400' : 'text-gray-500'}`}>
                                 <div className={`w-2 h-2 rounded-full ${passwordCriteria.number ? 'bg-green-400' : 'bg-gray-600'}`}/> Number
                             </div>
                             <div className={`flex items-center gap-1 ${passwordCriteria.special ? 'text-green-400' : 'text-gray-500'}`}>
                                 <div className={`w-2 h-2 rounded-full ${passwordCriteria.special ? 'bg-green-400' : 'bg-gray-600'}`}/> Symbol
                             </div>
                         </div>
                     </div>

                     <div>
                         <label className="block text-sm font-medium text-gray-400 mb-2">Confirm New Password</label>
                         <div className="relative group">
                             <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                 <Lock className="h-5 w-5 text-gray-500 group-focus-within:text-blue-500 transition-colors" />
                             </div>
                             <input
                                 type="password"
                                 required
                                 value={confirmPassword}
                                 onChange={(e) => setConfirmPassword(e.target.value)}
                                 className="block w-full pl-10 pr-3 py-3 border border-gray-700 rounded-xl bg-gray-900 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all shadow-inner"
                                 placeholder="••••••••"
                             />
                         </div>
                     </div>

                    <button
                        type="submit"
                        disabled={loading || !isPasswordValid}
                        className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-[1.02]"
                    >
                        {loading && <RefreshCw className="animate-spin h-4 w-4" />}
                        Reset Password
                    </button>
                </form>
            )}

            <div className="mt-6 text-center">
                <Link to="/login" className="text-sm font-medium text-blue-400 hover:text-blue-300 transition-colors">
                    Return to Log In
                </Link>
            </div>
        </div>
    </div>
  );
};

export default ForgotPassword;
