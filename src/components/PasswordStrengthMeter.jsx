import { CheckCircle, XCircle } from 'lucide-react';
import { useMemo } from 'react';

const PasswordStrengthMeter = ({ password }) => {
  const validations = useMemo(() => ({
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /\d/.test(password),
    special: /[\W_]/.test(password)
  }), [password]);

  return (
    <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
      <div className={`flex items-center gap-1 ${validations.length ? 'text-green-500' : 'text-gray-500'}`}>
        {validations.length ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
        Min 8 characters
      </div>
      <div className={`flex items-center gap-1 ${validations.uppercase ? 'text-green-500' : 'text-gray-500'}`}>
        {validations.uppercase ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
        Uppercase letter
      </div>
      <div className={`flex items-center gap-1 ${validations.lowercase ? 'text-green-500' : 'text-gray-500'}`}>
        {validations.lowercase ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
        Lowercase letter
      </div>
      <div className={`flex items-center gap-1 ${validations.number ? 'text-green-500' : 'text-gray-500'}`}>
        {validations.number ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
        Number
      </div>
      <div className={`flex items-center gap-1 ${validations.special ? 'text-green-500' : 'text-gray-500'}`}>
        {validations.special ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
        Special char (@$!%*?&)
      </div>
    </div>
  );
};

export default PasswordStrengthMeter;
