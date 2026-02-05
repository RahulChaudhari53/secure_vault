import { Link } from 'react-router-dom';
import { Shield, Search, LogOut } from 'lucide-react';

const Header = ({ user, logout, searchQuery, setSearchQuery, showSearch = true }) => {
  const getAvatarUrl = () => {
    if (!user?.avatarUrl) return null;
    const baseUrl = import.meta.env.VITE_API_URL.replace('/api', '');
    return `${baseUrl}/${user.avatarUrl}?t=${new Date().getTime()}`;
  };

  return (
    <nav className="bg-gray-800 border-b border-gray-700 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-3">
            <div className="h-9 w-9 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
               <Shield className="h-5 w-5 text-white" />
            </div>
            <span className="font-bold text-xl tracking-tight text-white">Secure Vault</span>
          </Link>

          {showSearch && (
            <div className="hidden md:flex flex-1 max-w-lg mx-8">
              <div className="relative w-full group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                </div>
                <input
                  type="text"
                  placeholder="Search encrypted notes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-700 rounded-lg leading-5 bg-gray-900 text-gray-300 placeholder-gray-500 focus:outline-none focus:bg-gray-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 sm:text-sm transition-all"
                />
              </div>
            </div>
          )}

          <div className="flex items-center gap-4">
            {user?.role === 'Admin' && (
              <Link to="/admin/logs" className="text-red-400 font-bold hover:text-red-300 transition-colors text-sm">
                System Logs
              </Link>
            )}

            <Link to="/profile" className="flex items-center gap-3 hover:bg-gray-700/50 p-2 rounded-lg transition-colors group">
                <div className="h-8 w-8 rounded-full overflow-hidden bg-gray-600 ring-2 ring-gray-700 group-hover:ring-blue-500/50 transition-all">
                    {user?.avatarUrl ? (
                         <img 
                            src={getAvatarUrl()} 
                            alt={user.name} 
                            className="h-full w-full object-cover"
                            onError={(e) => {e.target.style.display='none'; e.target.nextSibling.style.display='flex'}} 
                        />
                    ) : null}
                     <div className={`h-full w-full flex items-center justify-center bg-blue-600 text-white font-medium ${user?.avatarUrl ? 'hidden' : ''}`}>
                         {user?.name?.charAt(0).toUpperCase()}
                     </div>
                </div>
                <span className="hidden md:block text-sm text-gray-300 font-medium group-hover:text-white transition-colors">
                  {user?.name}
                </span>
            </Link>

            <button
              onClick={logout}
              className="p-2 text-gray-400 hover:text-red-400 hover:bg-gray-700/50 rounded-lg transition-colors"
              title="Sign Out"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Header;
