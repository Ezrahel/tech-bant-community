import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const OAuthCallbackPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const error = params.get('error');
    if (error) {
      if (
        error.includes('failed to create account') &&
        error.includes('already exists')
      ) {
        navigate('/duplicate-user-error', { replace: true });
      } else {
        // Show a generic error or redirect to home
        alert('OAuth error: ' + error);
        navigate('/', { replace: true });
      }
    } else {
      // No error, redirect to home
      navigate('/', { replace: true });
    }
  }, [location, navigate]);

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      <div className="text-center">
        <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center mx-auto mb-4">
          <div className="w-4 h-4 bg-black rounded-full"></div>
        </div>
        <p className="text-gray-400">Processing OAuth callback...</p>
      </div>
    </div>
  );
};

export default OAuthCallbackPage; 