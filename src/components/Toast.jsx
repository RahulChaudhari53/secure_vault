import { X, CheckCircle, AlertCircle } from 'lucide-react';
import { useEffect } from 'react';

const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 5000);

    return () => clearTimeout(timer);
  }, [onClose]);

  const bgColor = type === 'success' ? 'bg-green-600' : 'bg-red-600';
  const icon = type === 'success' ? <CheckCircle className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />;

  return (
    <div className={`fixed top-4 right-4 z-50 flex items-center w-full max-w-sm p-4 space-x-4 text-white rounded-lg shadow-lg ${bgColor} transition-opacity duration-300`}>
      <div className="flex-shrink-0">
        {icon}
      </div>
      <div className="flex-1 text-sm font-medium">
        {message}
      </div>
      <button onClick={onClose} className="flex-shrink-0 ml-auto hover:text-gray-200 focus:outline-none">
        <X className="h-5 w-5" />
      </button>
    </div>
  );
};

export default Toast;
