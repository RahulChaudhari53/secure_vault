import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Header from '../components/Header';
import api from '../api/axios';
import { ShieldAlert, Clock, User, Globe, Activity, RefreshCw, Search } from 'lucide-react';

const AdminLogs = () => {
  const { user, logout } = useAuth();
  const { showToast } = useToast();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/admin/logs');
      setLogs(data);
    } catch (error) {
      showToast(error.response?.data?.message || "Failed to fetch logs", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  // Format date to readable string
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  // Filter logs based on search query
  const filteredLogs = logs.filter(log => 
    log.email.toLowerCase().includes(searchQuery.toLowerCase()) || 
    log.action.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-900 text-white font-sans flex flex-col">
      <Header user={user} logout={logout} showSearch={false} />

      <main className="flex-1 max-w-7xl mx-auto w-full p-4 sm:p-6 lg:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
           <div className="flex items-center gap-3">
              <div className="p-3 bg-red-500/10 rounded-xl border border-red-500/20">
                <ShieldAlert className="h-8 w-8 text-red-500" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">System Audit Logs</h1>
                <p className="text-gray-400 text-sm">Monitoring system-wide security events</p>
              </div>
           </div>
           
           <div className="flex items-center gap-4">
               {/* Search Bar */}
               <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-gray-500" />
                  </div>
                  <input
                    type="text"
                    placeholder="Filter by email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-700 rounded-lg bg-gray-800 text-gray-300 placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 sm:text-sm transition-all"
                  />
               </div>

               <button 
                 onClick={fetchLogs}
                 className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm font-medium transition-colors border border-gray-700"
               >
                 <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
                 Refresh
               </button>
           </div>
        </div>

        {/* Logs Table */}
        <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden shadow-xl">
           <div className="overflow-x-auto">
             <table className="w-full text-left text-sm text-gray-400">
               <thead className="bg-gray-900/50 text-gray-200 font-medium uppercase tracking-wider text-xs">
                 <tr>
                   <th className="px-6 py-4">Timestamp</th>
                   <th className="px-6 py-4">Action</th>
                   <th className="px-6 py-4">User (Email)</th>
                   <th className="px-6 py-4">Route</th>
                   <th className="px-6 py-4">Details</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-gray-700/50">
                 {loading ? (
                    <tr>
                      <td colSpan="5" className="px-6 py-8 text-center">
                        <div className="flex justify-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                        </div>
                      </td>
                    </tr>
                 ) : filteredLogs.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                        {logs.length === 0 ? "No activity logs found." : "No matching logs found."}
                      </td>
                    </tr>
                 ) : (
                    filteredLogs.map((log) => (
                      <tr key={log._id} className="hover:bg-gray-700/30 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap font-mono text-xs text-gray-500">
                          {formatDate(log.timestamp)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold border ${
                            log.action.includes('FAILURE') || log.action.includes('error') ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                            log.action.includes('Admin') ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' :
                            'bg-blue-500/10 text-blue-400 border-blue-500/20'
                          }`}>
                            {log.action}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-white font-medium">
                          {log.email || 'Anonymous'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap font-mono text-xs">
                          {log.method} {log.route}
                        </td>
                        <td className="px-6 py-4 max-w-xs truncate" title={log.details}>
                          {log.details || '-'}
                        </td>
                      </tr>
                    ))
                 )}
               </tbody>
             </table>
           </div>
        </div>
      </main>
    </div>
  );
};

export default AdminLogs;
