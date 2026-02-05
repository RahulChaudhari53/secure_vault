import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotes } from '../context/NoteContext';
import { useToast } from '../context/ToastContext';
import NoteCard from '../components/NoteCard';
import NoteModal from '../components/NoteModal';
import ShareModal from '../components/ShareModal';
import Header from '../components/Header';
import { 
  Plus, 
  Search, 
  LayoutGrid, 
  Pin, 
  Users, 
  UserPlus, 
  Trash2, 
} from 'lucide-react';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const { 
    notes, 
    trashedNotes, 
    loading, 
    fetchNotes, 
    fetchTrashedNotes, 
    addNote, 
    updateNote, 
    shareNote, 
    revokeNoteAccess,
    trashNote, 
    restoreNote, 
    deleteNotePermanent 
  } = useNotes();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState('all'); // all, pinned, shared_by, shared_with, trash
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  
  // Share Modal State
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [noteToShare, setNoteToShare] = useState(null);

  // Initial Fetch
  useEffect(() => {
    fetchNotes();
  }, []);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === 'trash') {
      fetchTrashedNotes();
    }
  };

  const handleLogout = () => {
    logout();
  };

  const getFilteredNotes = () => {
    let sourceData = activeTab === 'trash' ? trashedNotes : notes;
    
    let filtered = sourceData;
    if (activeTab === 'all') {
      filtered = notes.filter(n => n.status === 'active');
    } else if (activeTab === 'pinned') {
      filtered = notes.filter(n => n.isPinned);
    } else if (activeTab === 'shared_by') {
      filtered = notes.filter(n => n.role === 'owner' && n.sharedWith?.length > 0);
    } else if (activeTab === 'shared_with') {
      filtered = notes.filter(n => n.role === 'viewer');
    }
    
    if (searchQuery.trim()) {
      const lowerQuery = searchQuery.toLowerCase();
      filtered = filtered.filter(n => 
        n.title.toLowerCase().includes(lowerQuery) || 
        n.content.toLowerCase().includes(lowerQuery) ||
        n.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
      );
    }

    return filtered;
  };

  const displayedNotes = getFilteredNotes();

  // --- Handlers ---
  const handleSaveNote = async (noteData) => {
    setIsSaving(true);
    let result;
    if (editingNote) {
      result = await updateNote(editingNote._id, noteData);
    } else {
      result = await addNote(noteData);
    }
    setIsSaving(false);
    
    if (result.success) {
      setIsModalOpen(false);
      setEditingNote(null);
    }
  };

  const handleEditClick = (note) => {
    setEditingNote(note);
    setIsModalOpen(true);
  };

  const handleCreateClick = () => {
    setEditingNote(null);
    setIsModalOpen(true);
  };

  const handleShareClick = (note) => {
    setNoteToShare(note);
    setIsShareModalOpen(true);
  };
  
  const handleShareSubmit = async (noteId, email) => {
     if (email === user.email) {
          showToast("You cannot share with yourself", "error");
          return;
      }
      const result = await shareNote(noteId, email);
      if (result.success) {
          setIsShareModalOpen(false);
          setNoteToShare(null);
      }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white font-sans flex flex-col">
      <Header 
        user={user} 
        logout={handleLogout} 
        searchQuery={searchQuery} 
        setSearchQuery={setSearchQuery} 
      />

      <div className="flex flex-1 max-w-7xl mx-auto w-full">
        {/* Sidebar */}
        <aside className="w-64 hidden lg:block border-r border-gray-800 p-6 space-y-2 sticky top-16 h-[calc(100vh-4rem)]">
           <button 
             onClick={handleCreateClick}
             className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-medium shadow-lg shadow-blue-600/20 transition-all mb-8"
           >
             <Plus size={20} />
             New Note
           </button>

           <div className="space-y-1">
             <SidebarItem 
               icon={<LayoutGrid size={18} />} 
               label="All Notes" 
               active={activeTab === 'all'} 
               onClick={() => handleTabChange('all')} 
             />
             <SidebarItem 
               icon={<Pin size={18} />} 
               label="Pinned" 
               active={activeTab === 'pinned'} 
               onClick={() => handleTabChange('pinned')} 
             />
             <SidebarItem 
               icon={<UserPlus size={18} />} 
               label="Shared By Me" 
               active={activeTab === 'shared_by'} 
               onClick={() => handleTabChange('shared_by')} 
             />
             <SidebarItem 
               icon={<Users size={18} />} 
               label="Shared With Me" 
               active={activeTab === 'shared_with'} 
               onClick={() => handleTabChange('shared_with')} 
             />
             <SidebarItem 
               icon={<Trash2 size={18} />} 
               label="Trash" 
               active={activeTab === 'trash'} 
               onClick={() => handleTabChange('trash')} 
             />
           </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <div className="lg:hidden mb-6 space-y-4">
             <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <input 
                  type="text" 
                  placeholder="Search..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 bg-gray-800 border border-gray-700 rounded-lg py-2"
                />
             </div>
             <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
               {['all', 'pinned', 'trash'].map(t => (
                 <button 
                   key={t}
                   onClick={() => handleTabChange(t)}
                   className={`px-4 py-1.5 rounded-full text-sm whitespace-nowrap ${activeTab === t ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400'}`}
                 >
                   {t.charAt(0).toUpperCase() + t.slice(1)}
                 </button>
               ))}
             </div>
          </div>

          <div className="mb-6 flex justify-between items-center">
             <h1 className="text-2xl font-bold text-white capitalize">
               {activeTab.replace('_', ' ')} Notes
             </h1>
             <span className="text-gray-500 text-sm">{displayedNotes.length} notes</span>
          </div>

          {loading ? (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
               {[1,2,3].map(i => (
                 <div key={i} className="h-48 bg-gray-800 rounded-xl animate-pulse"></div>
               ))}
             </div>
          ) : displayedNotes.length === 0 ? (
             <div className="flex flex-col items-center justify-center h-96 text-gray-500">
               <div className="bg-gray-800 p-4 rounded-full mb-4">
                 {activeTab === 'trash' ? <Trash2 size={32} /> : <LayoutGrid size={32} />}
               </div>
               <p className="text-lg">No notes found here.</p>
               {activeTab === 'all' && (
                 <button onClick={handleCreateClick} className="mt-4 text-blue-400 hover:underline">
                   Create your first note
                 </button>
               )}
             </div>
          ) : (
            // Masonry-like CSS Columns
            <div className="columns-1 md:columns-2 lg:columns-3 gap-4 space-y-4">
               {displayedNotes.map(note => (
                 <NoteCard 
                   key={note._id} 
                   note={note}
                   onEdit={handleEditClick}
                   onShare={handleShareClick}
                   onRevoke={revokeNoteAccess}
                   onTrash={trashNote}
                   onRestore={restoreNote}
                   onDeletePermanent={deleteNotePermanent}
                   isTrashView={activeTab === 'trash'}
                 />
               ))}
            </div>
          )}
        </main>

        {/* Floating Action Button (Mobile) */}
        <button 
          onClick={handleCreateClick}
          className="lg:hidden fixed bottom-6 right-6 h-14 w-14 bg-blue-600 rounded-full flex items-center justify-center shadow-lg shadow-blue-600/30 z-30"
        >
          <Plus size={24} text-white />
        </button>
      </div>

      <NoteModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSaveNote}
        initialData={editingNote}
        isSaving={isSaving}
      />

      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        onShare={handleShareSubmit}
        note={noteToShare}
      />
    </div>
  );
};

// Sidebar Helper Component
const SidebarItem = ({ icon, label, active, onClick }) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
      active ? 'bg-gray-800 text-blue-400' : 'text-gray-400 hover:bg-gray-800/50 hover:text-gray-200'
    }`}
  >
    {icon}
    {label}
  </button>
);

export default Dashboard;
