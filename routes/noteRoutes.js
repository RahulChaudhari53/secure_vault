const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
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
} = require('../controllers/noteController');

// All routes are protected
router.use(protect);

// Specific named routes MUST be before /:id to prevent conflict
router.get('/trash', getTrashedNotes);

router.route('/')
    .post(createNote)
    .get(getNotes);

router.route('/:id')
    .get(getNoteById)
    .put(updateNote)
    .delete(permanentDeleteNote);

router.post('/:id/share', shareNote);
router.delete('/:id/share/:userId', revokeAccess);
router.put('/:id/trash', softDeleteNote);
router.put('/:id/restore', restoreNote);

router.all(['/trash', '/', '/:id', '/:id/share', '/:id/share/:userId', '/:id/trash', '/:id/restore'], (req, res) => {
  res.status(405).json({ message: "Method Not Allowed" });
});

module.exports = router;
