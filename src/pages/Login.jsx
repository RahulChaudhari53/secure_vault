import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useNavigate, Link } from 'react-router-dom';
import { Shield, Mail, Lock, Loader2, Eye, EyeOff } from 'lucide-react';

import { useGoogleReCaptcha } from 'react-google-recaptcha-v3';

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { executeRecaptcha } = useGoogleReCaptcha(); 
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (!executeRecaptcha) {
         showToast("reCAPTCHA not ready", "error");
         setLoading(false);
         return;
    }
    const recaptchaToken = await executeRecaptcha('login'); 

    const result = await login(email, password, recaptchaToken);
    setLoading(false);

    if (result.success) {
      showToast('Credentials accepted', 'success');
      if (result.message.includes('OTP')) {
         navigate('/verify-otp', { state: { email } });
      } else {
         navigate('/dashboard');
      }
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
                 <h3 className="text-xl font-semibold">Welcome back</h3>
                 <p className="text-gray-400 text-sm">Enter you credentials to access your vault</p>
            </div>
          <form className="space-y-6" onSubmit={handleSubmit}>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300">
                Email address
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 h-10 bg-gray-700 border border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-white placeholder-gray-400"
                  placeholder="name@company.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300">
                Password
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-10 h-10 bg-gray-700 border border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-white placeholder-gray-400"
                  placeholder="••••••••"
                />
                 <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
              </div>
            </div>

            <div className="flex items-center justify-end">
                <Link to="/forgot-password" className="text-sm font-medium text-blue-500 hover:text-blue-400">
                    Forgot your password?
                </Link>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? (
                    <div className="flex items-center gap-2">
                         <Loader2 className="animate-spin h-4 w-4" />
                         <span>Signing in...</span>
                    </div>
                ) : 'Sign in'}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-600" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-gray-800 text-gray-400">
                  Secure Access
                </span>
              </div>
            </div>
             <div className="mt-6 text-center text-xs text-gray-500 flex items-center justify-center gap-2">
                 <Lock className="h-3 w-3" />
                 Protected by 256-bit AES encryption
             </div>
          </div>
           <p className="mt-6 text-center text-sm text-gray-400">
                Don't have an account?{' '}
                <Link to="/register" className="font-medium text-blue-500 hover:text-blue-400">
                    Register here
                </Link>
            </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
