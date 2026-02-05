import { useState, useEffect } from 'react';
import { X, Lock, Save, Loader2 } from 'lucide-react';

const NoteModal = ({ isOpen, onClose, onSubmit, initialData = null, isSaving = false }) => {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    tags: '',
    isPinned: false
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title || '',
        content: initialData.content || '',
        tags: initialData.tags ? initialData.tags.join(', ') : '',
        isPinned: initialData.isPinned || false
      });
    } else {
      setFormData({
        title: '',
        content: '',
        tags: '',
        isPinned: false
      });
    }
  }, [initialData, isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const processedTags = formData.tags
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0);
    
    onSubmit({
      ...formData,
      tags: processedTags
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-gray-800 rounded-2xl w-full max-w-2xl border border-gray-700 shadow-2xl overflow-hidden">
        <div className="flex justify-between items-center p-4 border-b border-gray-700 bg-gray-800/50">
          <h2 className="text-xl font-semibold text-white flex items-center gap-2">
            <Lock className="text-blue-500 h-5 w-5" />
            {initialData ? 'Edit Secure Note' : 'New Secure Note'}
          </h2>
          <button 
             onClick={onClose}
             className="text-gray-400 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
           <div>
             <input
               type="text"
               placeholder="Title"
               maxLength={100}
               required
               value={formData.title}
               onChange={(e) => setFormData({...formData, title: e.target.value})}
               className="w-full bg-transparent text-2xl font-bold text-white placeholder-gray-500 border-none focus:ring-0 focus:outline-none"
             />
           </div>

           <div>
             <textarea
               placeholder="Start typing your secure note..."
               required
               value={formData.content}
               onChange={(e) => setFormData({...formData, content: e.target.value})}
               className="w-full h-64 bg-transparent text-gray-300 placeholder-gray-600 resize-none border-none focus:ring-0 focus:outline-none text-base leading-relaxed"
             />
           </div>

           <div className="flex flex-col gap-4 pt-4 border-t border-gray-700/50">
             <div>
               <label className="text-xs text-gray-500 uppercase font-semibold tracking-wider">Tags (comma separated)</label>
               <input 
                 type="text" 
                 placeholder="work, ideas, urgent"
                 value={formData.tags}
                 onChange={(e) => setFormData({...formData, tags: e.target.value})}
                 className="w-full bg-gray-900/50 border border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-300 mt-1 focus:border-blue-500 focus:outline-none transition-colors"
               />
             </div>

             <div className="flex items-center gap-2">
                 <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer select-none">
                    <input 
                      type="checkbox"
                      checked={formData.isPinned}
                      onChange={(e) => setFormData({...formData, isPinned: e.target.checked})}
                      className="form-checkbox h-4 w-4 bg-gray-900 border-gray-600 rounded text-blue-600 focus:ring-offset-gray-800"
                    />
                    Pin to top
                 </label>
             </div>
           </div>

           <div className="flex justify-end gap-3 pt-2">
              <button 
                type="button" 
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                disabled={isSaving}
                className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Encrypting...
                  </>
                ) : (
                  <>
                    <Save size={18} />
                    Save Note
                  </>
                )}
              </button>
           </div>
        </form>
      </div>
    </div>
  );
};

export default NoteModal;
