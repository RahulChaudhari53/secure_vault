const Note = require('../models/Note');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const { encrypt, decrypt } = require('../utils/cryptoUtils');

// @desc    Create a new note
// @route   POST /api/notes
// @access  Private
const createNote = async (req, res) => {
    try {
        const { title, content, tags, isPinned } = req.body;

        if (!title || !content) {
            return res.status(400).json({ message: 'Title and content are required' });
        }

        const { iv, encryptedData } = encrypt(content);

        const note = await Note.create({
            user: req.user.id,
            title,
            content: encryptedData,
            iv,
            tags,
            isPinned: isPinned || false
        });

        // Audit Log
        await AuditLog.create({
            action: 'NOTE_CREATED',
            email: req.user.email,
            route: '/api/notes',
            method: 'POST',
            details: `Note created: ${note._id}`
        });

        res.status(201).json(note);
    } catch (error) {
        console.error('Create Note Error:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get all active notes (owned + shared)
// @route   GET /api/notes
// @access  Private
// Helper function for masking
const maskEmail = (email) => {
    if (!email) return '';
    const [name, domain] = email.split('@');
    if (!name || !domain) return email; 
    return `${name[0]}***${name[name.length - 1]}@${domain}`;
};

// @desc    Get all active notes (owned + shared)
// @route   GET /api/notes
// @access  Private
const getNotes = async (req, res) => {
    try {
        const notes = await Note.find({
            $or: [{ user: req.user.id }, { sharedWith: req.user.id }],
            status: 'active'
        })
        .populate('user', 'name email avatarUrl') 
        .populate('sharedWith', 'name email avatarUrl') 
        .sort({ isPinned: -1, updatedAt: -1 });

        const processedNotes = notes.map(note => {
            const n = note.toObject();

            let decryptedContent = ' [ENCRYPTED DATA UNAVAILABLE] ';
            try {
                decryptedContent = decrypt(n.content, n.iv);
            } catch (err) {
                console.error(`Decryption failed for note ${n._id}:`, err);
            }
            n.content = decryptedContent;
            
            const isOwner = n.user._id.toString() === req.user.id;
            n.role = isOwner ? 'owner' : 'viewer';

            // VISIBILITY CHECK: Only Owner sees 'sharedWith' list
            if (!isOwner) {
                n.sharedWith = [];
            } else if (n.sharedWith) {
                n.sharedWith = n.sharedWith.map(u => ({
                    ...u,
                    email: maskEmail(u.email)
                }));
            }
            
            if (n.user && !isOwner) {
                n.user.email = maskEmail(n.user.email);
            }

            return n;
        });
       
        res.json(processedNotes);
    } catch (error) {
        console.error('Get Notes Error:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get single note by ID
// @route   GET /api/notes/:id
// @access  Private
const getNoteById = async (req, res) => {
    try {
        const note = await Note.findOne({
            _id: req.params.id,
            $or: [{ user: req.user.id }, { sharedWith: req.user.id }]
        })
        .populate('user', 'name email avatarUrl')
        .populate('sharedWith', 'name email avatarUrl');

        if (!note) {
            return res.status(404).json({ message: 'Note not found' });
        }

        const n = note.toObject();

        let decryptedContent = ' [ENCRYPTED DATA UNAVAILABLE] ';
        try {
            decryptedContent = decrypt(n.content, n.iv);
        } catch (err) {
            console.error(`Decryption failed for note ${n._id}:`, err);
        }
        n.content = decryptedContent;
        const isOwner = n.user._id.toString() === req.user.id;
        n.role = isOwner ? 'owner' : 'viewer';

        // VISIBILITY CHECK: Only Owner sees 'sharedWith' list
        if (!isOwner) {
            n.sharedWith = [];
        } else if (n.sharedWith) {
             n.sharedWith = n.sharedWith.map(u => ({
                 ...u,
                 email: maskEmail(u.email)
             }));
        }

        if (n.user && !isOwner) {
            n.user.email = maskEmail(n.user.email);
        }

         await AuditLog.create({
            action: 'NOTE_ACCESSED',
            email: req.user.email,
            route: `/api/notes/${req.params.id}`,
            method: 'GET',
            details: `Accessed note: ${note._id}`
        });

        res.json(n);
    } catch (error) {
        console.error('Get Note By ID Error:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Update a note
// @route   PUT /api/notes/:id
// @access  Private (Owner only for content)
const updateNote = async (req, res) => {
    try {
        const note = await Note.findOne({
             _id: req.params.id,
             $or: [{ user: req.user.id }, { sharedWith: req.user.id }] 
        });

        if (!note) {
            return res.status(404).json({ message: 'Note not found' });
        }

        const isOwner = note.user.toString() === req.user.id;
        
        if (!isOwner) {
            return res.status(403).json({ message: 'Unauthorized: Read-Only Access' });
        }

        const { title, content, tags, isPinned } = req.body;

        if (title) note.title = title;
        if (tags) note.tags = tags;
        if (isPinned !== undefined) note.isPinned = isPinned;

        if (content) {
            const { iv, encryptedData } = encrypt(content);
            note.content = encryptedData;
            note.iv = iv; 
        }

        await note.save();

        // Audit Log
        await AuditLog.create({
            action: 'NOTE_UPDATED',
            email: req.user.email,
            route: `/api/notes/${req.params.id}`,
            method: 'PUT',
            details: `Updated note: ${note._id}`
        });

        res.json(note);
    } catch (error) {
        console.error('Update Note Error:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Share note with another user
// @route   POST /api/notes/:id/share
// @access  Private (Owner only)
const shareNote = async (req, res) => {
    try {
        const note = await Note.findOne({
            _id: req.params.id,
            user: req.user.id 
        });

        if (!note) {
            return res.status(404).json({ message: 'Note not found or unauthorized' });
        }

        const emailToShare = String(req.body.email); // Input Sanitization
        const userToShare = await User.findOne({ email: emailToShare });

        if (!userToShare) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (userToShare._id.toString() === req.user.id) {
             return res.status(400).json({ message: 'Cannot share with yourself' });
        }

        await Note.findByIdAndUpdate(note._id, {
            $addToSet: { sharedWith: userToShare._id }
        });

        await AuditLog.create({
            action: 'NOTE_SHARED',
            email: req.user.email,
            route: `/api/notes/${req.params.id}/share`,
            method: 'POST',
            details: `Shared note ${note._id} with ${emailToShare}`
        });

        res.json({ message: `Note shared with ${emailToShare}` });
    } catch (error) {
        console.error('Share Note Error:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Revoke access from a user
// @route   DELETE /api/notes/:id/share/:userId
// @access  Private (Owner only)
const revokeAccess = async (req, res) => {
    try {
        const note = await Note.findById(req.params.id);

        if (!note) return res.status(404).json({ message: "Note not found" });

        // SECURITY: Only the owner can revoke access
        if (note.user.toString() !== req.user.id) {
            return res.status(403).json({ message: "Unauthorized to revoke access" });
        }

        note.sharedWith = note.sharedWith.filter(
            (uid) => uid.toString() !== req.params.userId
        );

        await note.save();

        await AuditLog.create({
            action: "SHARE_REVOKED",
            email: req.user.email,
            details: `Removed access for User ID: ${req.params.userId} from note: ${note.title}`,
            route: req.originalUrl,
            method: req.method
        });

        await note.populate('sharedWith', 'name email avatarUrl');
        
        const maskedSharedWith = note.sharedWith.map(u => ({
            _id: u._id,
            name: u.name,
            email: maskEmail(u.email),
            avatarUrl: u.avatarUrl
        }));

        res.json({ message: "Access revoked successfully", sharedWith: maskedSharedWith });
    } catch (error) {
        console.error("Revoke Access Error:", error);
        res.status(500).json({ message: "Server Error" });
    }
};

// @desc    Soft delete note (Trash)
// @route   PUT /api/notes/:id/trash
// @access  Private (Owner only)
const softDeleteNote = async (req, res) => {
    try {
        const note = await Note.findOne({
            _id: req.params.id,
            user: req.user.id 
        });

        if (!note) {
            return res.status(404).json({ message: 'Note not found or unauthorized' });
        }

        note.status = 'trashed';
        note.deletedAt = Date.now();
        await note.save();

        await AuditLog.create({
            action: 'NOTE_TRASHED',
            email: req.user.email,
            route: `/api/notes/${req.params.id}/trash`,
            method: 'PUT',
            details: `Trashed note: ${note._id}`
        });

        res.json({ message: 'Note moved to trash' });
    } catch (error) {
        console.error('Soft Delete Error:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Restore note from trash
// @route   PUT /api/notes/:id/restore
// @access  Private (Owner only)
const restoreNote = async (req, res) => {
    try {
        const note = await Note.findOne({
            _id: req.params.id,
            user: req.user.id,
            status: 'trashed' 
        });

        if (!note) {
            return res.status(404).json({ message: 'Note not found in trash' });
        }

        note.status = 'active';
        note.deletedAt = null;
        await note.save();

        await AuditLog.create({
            action: 'NOTE_RESTORED',
            email: req.user.email,
            route: `/api/notes/${req.params.id}/restore`,
            method: 'PUT',
            details: `Restored note: ${note._id}`
        });

        res.json({ message: 'Note restored' });
    } catch (error) {
        console.error('Restore Note Error:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Permanently delete note
// @route   DELETE /api/notes/:id
// @access  Private (Owner only)
const permanentDeleteNote = async (req, res) => {
    try {
        const note = await Note.findOneAndDelete({
            _id: req.params.id,
            user: req.user.id
        });

        if (!note) {
            return res.status(404).json({ message: 'Note not found or unauthorized' });
        }

        await AuditLog.create({
            action: 'NOTE_DELETED_PERMANENT',
            email: req.user.email,
            route: `/api/notes/${req.params.id}`,
            method: 'DELETE',
            details: `Permanently deleted note: ${req.params.id}`
        });

        res.json({ message: 'Note permanently deleted' });
    } catch (error) {
        console.error('Permanent Delete Error:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get trashed notes
// @route   GET /api/notes/trash
// @access  Private
const getTrashedNotes = async (req, res) => {
    try {
        // Shared notes normally disappear if owner trashes them.
        const notes = await Note.find({
            user: req.user.id,
            status: 'trashed'
        }).sort({ deletedAt: -1 });

        const decryptedNotes = notes.map(note => {
            let decryptedContent = ' [ENCRYPTED DATA UNAVAILABLE] ';
            try {
                decryptedContent = decrypt(note.content, note.iv);
            } catch (err) {
                 console.error(`Decryption failed for note ${note._id}:`, err);
            }
            return {
                ...note.toObject(),
                content: decryptedContent,
                 role: 'owner'
            };
        });

        res.json(decryptedNotes);
    } catch (error) {
        console.error('Get Trash Error:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

module.exports = {
    createNote,
    getNotes,
    getNoteById,
    updateNote,
    shareNote,
    softDeleteNote,
    restoreNote,
    permanentDeleteNote,
    getTrashedNotes,
    revokeAccess
};
