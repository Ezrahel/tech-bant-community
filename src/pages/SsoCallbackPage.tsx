import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';

const SsoCallbackPage: React.FC = () => {
  const { isSignedIn } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isSignedIn) {
      navigate('/');
    }
  }, [isSignedIn, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-white">
      <div className="text-center">
        <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center mx-auto mb-4">
          <div className="w-4 h-4 bg-black rounded-full"></div>
        </div>
        <p className="text-gray-400">Completing sign in...</p>
      </div>
    </div>
  );
};

export default SsoCallbackPage;
