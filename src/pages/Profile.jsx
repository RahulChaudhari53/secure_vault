import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api from '../api/axios';
import Header from '../components/Header';
import PasswordStrengthMeter from '../components/PasswordStrengthMeter'; // Import Meter
import { 
  User, 
  Mail, 
  Lock, 
  Camera, 
  Save, 
  X, 
  Edit2, 
  Activity, 
  Share2, 
  FileText, 
  Hash 
} from 'lucide-react';

const Profile = () => {
  const { user, logout, checkAuth } = useAuth();
  const { showToast } = useToast();
  
  const [stats, setStats] = useState({ totalNotes: 0, sharedNotes: 0, tagsCount: 0 });
  const [loadingStats, setLoadingStats] = useState(true);

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: ''
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  const validateEmail = (email) => {
    return /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(email);
  };

  const isPasswordValid = (password) => {
    return (
      password.length >= 8 &&
      /[A-Z]/.test(password) &&
      /[a-z]/.test(password) &&
      /\d/.test(password) &&
      /[\W_]/.test(password)
    );
  };

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name,
        email: user.email
      });
      fetchStats();
    }
  }, [user]);

  const fetchStats = async () => {
    try {
      const { data } = await api.get('/auth/stats');
      setStats(data);
    } catch (error) {
      console.error("Failed to fetch stats", error);
    } finally {
      setLoadingStats(false);
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      showToast("File is too large. Max 2MB allowed.", "error");
      return;
    }

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      showToast("Invalid format. Please upload JPG, PNG, or WEBP.", "error");
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append('avatar', file);

    try {
      await api.put('/auth/profile/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' } 
      });
      showToast("Avatar updated successfully!", "success");
      await checkAuth(); 
    } catch (error) {
       showToast(error.response?.data?.message || "Avatar upload failed", "error");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // --- Profile Update Logic ---
  const handleProfileUpdate = async (e) => {
    e.preventDefault();

    if (!validateEmail(formData.email)) {
        showToast("Please enter a valid email address.", "error");
        return;
    }

    try {
      await api.put('/auth/profile', formData);
      showToast("Profile updated successfully", "success");
      setIsEditing(false);
      await checkAuth();
    } catch (error) {
      showToast(error.response?.data?.message || "Update failed", "error");
    }
  };

  // --- Password Change Logic ---
  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showToast("New passwords do not match", "error");
      return;
    }

    if (!isPasswordValid(passwordData.newPassword)) {
        showToast("New password is too weak.", "error");
        return;
    }

    try {
      await api.put('/auth/change-password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      showToast("Password changed successfully", "success");
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      showToast(error.response?.data?.message || "Password change failed", "error");
    }
  };

  const getAvatarUrl = () => {
    if (!user?.avatarUrl) return null;
    const baseUrl = import.meta.env.VITE_API_URL.replace('/api', '');
    return `${baseUrl}/${user.avatarUrl}?t=${new Date().getTime()}`;
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white font-sans flex flex-col">
      <Header user={user} logout={logout} showSearch={false} />

      <main className="flex-1 max-w-4xl mx-auto w-full p-4 sm:p-6 lg:p-8 space-y-8">
        
        <div className="bg-gray-800 rounded-2xl p-6 md:p-8 shadow-xl border border-gray-700 relative overflow-hidden">
           <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-r from-blue-600 to-purple-600 opacity-20"></div>
           
           <div className="relative z-10 flex flex-col md:flex-row items-center gap-6 md:gap-8">
              <div className="relative group">
                <div className="h-32 w-32 rounded-full ring-4 ring-gray-800 overflow-hidden bg-gray-700 flex items-center justify-center shadow-2xl">
                    {isUploading ? (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-20">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                        </div>
                    ) : null}
                    
                    {user?.avatarUrl ? (
                         <img 
                            src={getAvatarUrl()} 
                            alt="Profile" 
                            className="h-full w-full object-cover"
                            onError={(e) => {e.target.style.display='none'; e.target.nextSibling.style.display='flex'}}
                        />
                    ) : null}
                    <span className={`text-4xl font-bold text-gray-400 ${user?.avatarUrl ? 'hidden' : 'block'}`}>
                        {user?.name?.charAt(0).toUpperCase()}
                    </span>
                    
                    <button 
                        onClick={handleAvatarClick}
                        className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white cursor-pointer"
                    >
                        <Camera size={24} className="mb-1" />
                        <span className="text-xs font-medium">Change</span>
                    </button>
                </div>
                <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileChange} 
                    className="hidden" 
                    accept="image/png, image/jpeg, image/webp"
                />
              </div>

              <div className="text-center md:text-left flex-1">
                 <h1 className="text-3xl font-bold text-white mb-2">{user?.name}</h1>
                 <div className="flex items-center justify-center md:justify-start gap-2 text-gray-400 mb-4">
                    <Mail size={16} />
                    <span>{user?.email}</span>
                 </div>
                 <div className="flex gap-2 justify-center md:justify-start">
                    <span className="px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 text-xs font-semibold border border-blue-500/20 uppercase tracking-wide">
                        {user?.role || 'User'}
                    </span>
                 </div>
              </div>

              <div className="flex gap-4">
                 <div className="text-center px-4 py-2 bg-gray-900/50 rounded-xl border border-gray-700/50">
                    <div className="text-2xl font-bold text-white">{!loadingStats ? stats.totalNotes : '-'}</div>
                    <div className="text-xs text-gray-400">Notes</div>
                 </div>
                 <div className="text-center px-4 py-2 bg-gray-900/50 rounded-xl border border-gray-700/50">
                    <div className="text-2xl font-bold text-white">{!loadingStats ? stats.sharedNotes : '-'}</div>
                    <div className="text-xs text-gray-400">Shared</div>
                 </div>
              </div>
           </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatsCard icon={<FileText className="text-blue-400" />} label="Total Notes" value={stats.totalNotes} loading={loadingStats} />
            <StatsCard icon={<Share2 className="text-green-400" />} label="Shared Notes" value={stats.sharedNotes} loading={loadingStats} />
            <StatsCard icon={<Hash className="text-purple-400" />} label="Tags Used" value={stats.tagsCount} loading={loadingStats} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <User size={20} className="text-blue-500" />
                        Personal Information
                    </h2>
                    <button 
                        onClick={() => setIsEditing(!isEditing)}
                        className="text-sm text-gray-400 hover:text-white flex items-center gap-1 transition-colors"
                    >
                        {isEditing ? <><X size={14}/> Cancel</> : <><Edit2 size={14}/> Edit</>}
                    </button>
                </div>

                <form onSubmit={handleProfileUpdate} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Full Name</label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({...formData, name: e.target.value})}
                            disabled={!isEditing}
                            className={`w-full bg-gray-900 border ${isEditing ? 'border-gray-600 focus:border-blue-500' : 'border-transparent'} rounded-lg px-4 py-2 text-white transition-all`}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Email Address</label>
                         <input
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({...formData, email: e.target.value})}
                            disabled={!isEditing}
                            className={`w-full bg-gray-900 border ${isEditing ? 'border-gray-600 focus:border-blue-500' : 'border-transparent'} rounded-lg px-4 py-2 text-white transition-all`}
                        />
                    </div>
                    
                    {isEditing && (
                        <button 
                            type="submit"
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
                        >
                            <Save size={18} />
                            Save Changes
                        </button>
                    )}
                </form>
            </div>

            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                <h2 className="text-xl font-bold flex items-center gap-2 mb-6">
                    <Lock size={20} className="text-purple-500" />
                    Security
                </h2>

                <form onSubmit={handlePasswordChange} className="space-y-4">
                     <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Current Password</label>
                        <input
                            type="password"
                            value={passwordData.currentPassword}
                            onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                            className="w-full bg-gray-900 border border-gray-700 focus:border-purple-500 rounded-lg px-4 py-2 text-white transition-all focus:outline-none"
                            placeholder="••••••••"
                        />
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">New Password</label>
                        <input
                            type="password"
                            value={passwordData.newPassword}
                            onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                             className="w-full bg-gray-900 border border-gray-700 focus:border-purple-500 rounded-lg px-4 py-2 text-white transition-all focus:outline-none"
                             placeholder="••••••••"
                        />
                        {passwordData.newPassword && (
                            <div className="mt-2">
                                <PasswordStrengthMeter password={passwordData.newPassword} />
                            </div>
                        )}
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Confirm New Password</label>
                        <input
                            type="password"
                            value={passwordData.confirmPassword}
                            onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                            className="w-full bg-gray-900 border border-gray-700 focus:border-purple-500 rounded-lg px-4 py-2 text-white transition-all focus:outline-none"
                             placeholder="••••••••"
                        />
                    </div>

                    <button 
                        type="submit"
                        disabled={!isPasswordValid(passwordData.newPassword) || passwordData.newPassword !== passwordData.confirmPassword}
                        className="w-full bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                        Update Password
                    </button>
                </form>
            </div>
        </div>

      </main>
    </div>
  );
};

const StatsCard = ({ icon, label, value, loading }) => (
    <div className="bg-gray-800 p-4 rounded-xl border border-gray-700 flex items-center gap-4">
        <div className="p-3 bg-gray-900 rounded-lg">
            {icon}
        </div>
        <div>
            <p className="text-gray-400 text-sm">{label}</p>
            <p className="text-2xl font-bold text-white">{loading ? '...' : value}</p>
        </div>
    </div>
);

export default Profile;
