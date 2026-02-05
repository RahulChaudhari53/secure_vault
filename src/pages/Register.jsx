import { useState } from 'react';
import api from '../api/axios';
import { useToast } from '../context/ToastContext';
import { useNavigate, Link } from 'react-router-dom';
import { Shield, Mail, Lock, User, Loader2, Eye, EyeOff } from 'lucide-react';
import PasswordStrengthMeter from '../components/PasswordStrengthMeter';

import { useGoogleReCaptcha } from 'react-google-recaptcha-v3';

const Register = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { executeRecaptcha } = useGoogleReCaptcha();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const isPasswordValid = (password) => {
    return (
      password.length >= 8 &&
      /[A-Z]/.test(password) &&
      /[a-z]/.test(password) &&
      /\d/.test(password) &&
      /[\W_]/.test(password)
    );
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isPasswordValid(formData.password)) {
        showToast("Please satisfy all password requirements", 'error');
        return;
    }

    setLoading(true);

    try {
      console.log('Attempting registration with data:', { name: formData.name, email: formData.email });
      
      if (!executeRecaptcha) {
           showToast("reCAPTCHA not ready", "error");
           setLoading(false);
           return;
      }
      const recaptchaToken = await executeRecaptcha('register');
      
      const response = await api.post('/auth/register', { ...formData, recaptchaToken });
      console.log('Registration success:', response);
      
      showToast('Registration successful! Redirecting to login...', 'success');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      console.error('Registration failed:', err);
      showToast(err.response?.data?.message || 'Registration failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white p-4 font-sans">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
            <div className="mx-auto h-16 w-16 bg-blue-600 rounded-2xl flex items-center justify-center mb-4">
                 <Shield className="h-8 w-8 text-white" />
            </div>
          <h2 className="text-3xl font-bold tracking-tight">Create Account</h2>
          <p className="mt-2 text-sm text-gray-400">Join Secure Note Vault today</p>
        </div>

        <div className="bg-gray-800 py-8 px-4 shadow-xl border border-gray-700 rounded-xl sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>

            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-300">
                Full Name
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className="block w-full pl-10 h-10 bg-gray-700 border border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-white placeholder-gray-400"
                  placeholder="John Doe"
                />
              </div>
            </div>

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
                  value={formData.email}
                  onChange={handleChange}
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
                  value={formData.password}
                  onChange={handleChange}
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
              
              <PasswordStrengthMeter password={formData.password} />
            </div>

            <div>
              <button
                type="submit"
                disabled={loading || !isPasswordValid(formData.password)}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? (
                    <div className="flex items-center gap-2">
                         <Loader2 className="animate-spin h-4 w-4" />
                         <span>Creating Account...</span>
                    </div>
                ) : 'Sign Up'}
              </button>
            </div>
          </form>

           <p className="mt-6 text-center text-sm text-gray-400">
                Already have an account?{' '}
                <Link to="/login" className="font-medium text-blue-500 hover:text-blue-400">
                    Sign in here
                </Link>
            </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
