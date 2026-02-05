import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import noteService from '../services/noteService';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';

const NoteContext = createContext();

export const NoteProvider = ({ children }) => {
  const { user } = useAuth();
  const [notes, setNotes] = useState([]);
  const [trashedNotes, setTrashedNotes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { showToast } = useToast();

  useEffect(() => {
    if (!user) {
      setNotes([]);
      setTrashedNotes([]);
      setError(null);
    }
  }, [user]);

  const clearState = () => {
    setNotes([]);
    setTrashedNotes([]);
    setError(null);
  };

  const fetchNotes = useCallback(async () => {
    setLoading(true);
    try {
      const data = await noteService.getNotes();
      setNotes(data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch notes');
      showToast(err.response?.data?.message || 'Failed to fetch notes', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  const fetchTrashedNotes = useCallback(async () => {
    setLoading(true);
    try {
      const data = await noteService.getTrashedNotes();
      setTrashedNotes(data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch trash');
      showToast(err.response?.data?.message || 'Failed to fetch trash', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  const addNote = async (noteData) => {
    try {
      const newNote = await noteService.createNote(noteData);
      await fetchNotes(); 
      showToast('Note created successfully', 'success');
      return { success: true };
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to create note', 'error');
      return { success: false, error: err.response?.data?.message };
    }
  };

  const updateNote = async (id, noteData) => {
    try {
      await noteService.updateNote(id, noteData);
      await fetchNotes();
      showToast('Note updated successfully', 'success');
      return { success: true };
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update note', 'error');
      return { success: false };
    }
  };

  const shareNote = async (id, email) => {
    try {
      await noteService.shareNote(id, email);
      showToast(`Note shared with ${email}`, 'success');
      return { success: true };
      showToast(`Note shared with ${email}`, 'success');
      return { success: true };
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to share note', 'error');
      return { success: false };
    }
  };

  const revokeNoteAccess = async (id, userId) => {
    try {
      const data = await noteService.revokeAccess(id, userId);
      setNotes(prev => prev.map(note => 
        note._id === id ? { ...note, sharedWith: data.sharedWith } : note
      ));
      showToast('Access revoked successfully', 'success');
      return { success: true };
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to revoke access', 'error');
      return { success: false };
    }
  };

  const trashNote = async (id) => {
    try {
      await noteService.softDeleteNote(id);
      setNotes(prev => prev.filter(n => n._id !== id));
      await fetchTrashedNotes();
      showToast('Note moved to trash', 'success');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to trash note', 'error');
    }
  };

  const restoreNote = async (id) => {
    try {
      await noteService.restoreNote(id);
      setTrashedNotes(prev => prev.filter(n => n._id !== id));
      await fetchNotes(); 
      showToast('Note restored', 'success');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to restore note', 'error');
    }
  };

  const deleteNotePermanent = async (id) => {
    try {
      await noteService.permanentDeleteNote(id);
      setTrashedNotes(prev => prev.filter(n => n._id !== id));
      showToast('Note permanently deleted', 'success');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to delete note', 'error');
    }
  };

  return (
    <NoteContext.Provider
      value={{
        notes,
        trashedNotes,
        loading,
        error,
        fetchNotes,
        fetchTrashedNotes,
        addNote,
        updateNote,
        shareNote,
        revokeNoteAccess,
        trashNote,
        restoreNote,
        deleteNotePermanent,
        clearState
      }}
    >
      {children}
    </NoteContext.Provider>
  );
};

export const useNotes = () => useContext(NoteContext);
