import { useState, useEffect } from 'react';
import { X, Share2, Mail, Loader2 } from 'lucide-react';

const ShareModal = ({ isOpen, onClose, onShare, note }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setEmail('');
      setError('');
      setLoading(false);
    }
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) {
       setError("Email is required");
       return;
    }
    
    // Basic email regex for UI feedback
    if (!/\S+@\S+\.\S+/.test(email)) {
        setError("Please enter a valid email address");
        return;
    }

    setLoading(true);
    await onShare(note._id, email);
    setLoading(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-gray-800 rounded-2xl w-full max-w-md border border-gray-700 shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="flex justify-between items-center p-5 border-b border-gray-700 bg-gray-800/50">
          <h2 className="text-xl font-semibold text-white flex items-center gap-2">
            <Share2 className="text-purple-500 h-5 w-5" />
            Share Note
          </h2>
          <button 
             onClick={onClose}
             className="text-gray-400 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
            <p className="text-gray-400 text-sm mb-4">
               Share <span className="text-white font-medium">"{note?.title}"</span> with another user securely. They will have read-only access.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
               <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-500" />
                  </div>
                  <input
                    type="email"
                    placeholder="recipient@example.com"
                    value={email}
                    onChange={(e) => {
                        setEmail(e.target.value);
                        setError('');
                    }}
                    className="w-full pl-10 bg-gray-900 border border-gray-600 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 focus:outline-none transition-all"
                    autoFocus
                  />
               </div>
               
               {error && (
                   <div className="text-red-400 text-sm flex items-center gap-1">
                       <span>•</span> {error}
                   </div>
               )}

               <div className="flex gap-3 pt-2">
                  <button 
                    type="button" 
                    onClick={onClose}
                    className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-300 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    disabled={loading}
                    className="flex-[2] flex items-center justify-center gap-2 px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-purple-600/20"
                  >
                    {loading ? (
                       <Loader2 size={18} className="animate-spin" />
                    ) : (
                       <span>Share Access</span>
                    )}
                  </button>
               </div>
            </form>
        </div>
      </div>
    </div>
  );
};

export default ShareModal;
