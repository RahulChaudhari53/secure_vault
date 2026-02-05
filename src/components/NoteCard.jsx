import { 
  Pin, 
  Trash2, 
  X,
  Edit, 
  Share2, 
  User, 
  UserPlus, 
  UserCheck,
  RotateCcw,
  AlertTriangle 
} from 'lucide-react';

const NoteCard = ({ note, onEdit, onShare, onRevoke, onTrash, onRestore, onDeletePermanent, isTrashView = false }) => {
  const isOwner = note.role === 'owner';
  const isSharedByMe = isOwner && note.sharedWith?.length > 0;
  const isSharedWithMe = note.role === 'viewer';
  const isEncryptedError = note.content === ' [ENCRYPTED DATA UNAVAILABLE] ';

  return (
    <div className="bg-gray-800 rounded-xl p-5 border border-gray-700 shadow-sm hover:shadow-md transition-shadow break-inside-avoid mb-4 relative group">
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-semibold text-lg text-white line-clamp-2">
          {note.title}
        </h3>
        
        <div className="flex gap-1 shrink-0 ml-2">
           {note.isPinned && (
            <span className="p-1 rounded bg-blue-500/10 text-blue-400" title="Pinned">
              <Pin size={14} fill="currentColor" />
            </span>
          )}

          {isSharedByMe && (
             <span className="p-1 rounded bg-purple-500/10 text-purple-400" title="Shared by me">
               <UserPlus size={14} />
             </span>
          )}

          {isSharedWithMe && (
             <span className="p-1 rounded bg-green-500/10 text-green-400" title="Shared with me">
               <UserCheck size={14} />
             </span>
          )}
        </div>
      </div>

      <div className={`text-gray-300 text-sm whitespace-pre-wrap mb-4 font-normal ${isEncryptedError ? 'text-red-400 italic flex items-center gap-2' : ''}`}>
        {isEncryptedError ? (
          <>
            <AlertTriangle size={14} />
            Encrypted Data Unavailable
          </>
        ) : (
          note.content
        )}
      </div>

      {note.tags && note.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-4">
          {note.tags.map((tag, index) => (
             <span key={index} className="text-xs bg-gray-700 text-gray-400 px-2 py-0.5 rounded-full">
               #{tag}
             </span>
          ))}
        </div>
      )}

      {/* Collaborators */}
      {note.sharedWith && note.sharedWith.length > 0 && (
        <div className="flex -space-x-2 overflow-hidden mb-4 border-t border-gray-700/30 pt-3">
            {note.sharedWith.map((collaborator, index) => {
                 const avatarSrc = collaborator.avatarUrl 
                    ? (collaborator.avatarUrl.startsWith('http') ? collaborator.avatarUrl : `http://localhost:5000/${collaborator.avatarUrl}`)
                    : null;

                 return (
                  <div 
                    key={index} 
                    title={`${collaborator.name} (${collaborator.email})`}
                    className="relative group/avatar inline-block h-8 w-8 rounded-full ring-2 ring-gray-800 bg-gray-700 flex items-center justify-center overflow-hidden border border-gray-600 transition-transform hover:scale-110 hover:z-10"
                  >
                    {avatarSrc ? (
                      <img 
                        src={avatarSrc} 
                        alt={collaborator.name} 
                        className="h-full w-full object-cover"
                        onError={(e) => {e.target.style.display='none'; e.target.nextSibling.style.display='flex'}} 
                      />
                    ) : null}
                    <div className={`h-full w-full flex items-center justify-center bg-purple-600 text-white font-medium text-xs ${avatarSrc ? 'hidden' : ''}`}>
                         {collaborator.name.charAt(0).toUpperCase()}
                     </div>

                    {isOwner && (
                      <button
                        onClick={(e) => {
                            e.stopPropagation(); 
                            onRevoke(note._id, collaborator._id);
                        }}
                        className="absolute inset-0 bg-red-500/90 rounded-full flex items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-opacity cursor-pointer z-20"
                        title={`Revoke access for ${collaborator.name}`}
                      >
                        <X size={14} className="text-white font-bold" />
                      </button>
                    )}
                  </div>
            )})}
            
            {/* If many collaborators, show a count */}
            {note.sharedWith.length > 4 && (
              <span className="flex items-center justify-center h-8 w-8 rounded-full bg-gray-700 ring-2 ring-gray-800 text-[10px] text-gray-400 border border-gray-600">
                +{note.sharedWith.length - 4}
              </span>
            )}
        </div>
      )}

      <div className="flex justify-end gap-2 mt-auto pt-2 border-t border-gray-700/50 opacity-0 group-hover:opacity-100 transition-opacity">
        {isTrashView ? (
           <>
             <button 
                onClick={() => onRestore(note._id)}
                className="p-1.5 text-green-400 hover:bg-gray-700 rounded-md transition-colors"
                title="Restore"
             >
                <RotateCcw size={16} />
             </button>
             <button 
                onClick={() => onDeletePermanent(note._id)}
                className="p-1.5 text-red-500 hover:bg-gray-700 rounded-md transition-colors"
                title="Delete Permanently"
             >
                <Trash2 size={16} />
             </button>
           </>
        ) : (
          <>
            {/* Viewers cannot Edit or Share */}
            {isOwner && (
              <button 
                onClick={() => onShare(note)}
                className="p-1.5 text-purple-400 hover:bg-gray-700 rounded-md transition-colors"
                title="Share"
              >
                <Share2 size={16} />
              </button>
            )}

            {isOwner && (
              <button 
                onClick={() => onEdit(note)}
                className="p-1.5 text-blue-400 hover:bg-gray-700 rounded-md transition-colors"
                title="Edit"
              >
                <Edit size={16} />
              </button>
            )}

            {/* Viewers CANNOT Trash notes, only Owner */}
            {isOwner && (
               <button 
                 onClick={() => onTrash(note._id)}
                 className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-gray-700 rounded-md transition-colors"
                 title="Move to Trash"
               >
                 <Trash2 size={16} />
               </button>
            )}
            
          </>
        )}
      </div>
    </div>
  );
};

export default NoteCard;
