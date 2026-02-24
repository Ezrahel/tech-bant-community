// OAuth callback page
import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { authService } from '../services/auth';
import { useAuth } from '../contexts/AuthContext';

const OAuthCallbackPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { refreshUserProfile } = useAuth();
  const [error, setError] = useState('');

  useEffect(() => {
    // Check URL fragment for token (backend redirects with token in fragment)
    const hash = window.location.hash.substring(1);
    const params = new URLSearchParams(hash);
    const token = params.get('token');
    const errorParam = params.get('error');

    // Also check query params as fallback
    const queryToken = searchParams.get('token');
    const queryError = searchParams.get('error');

    const finalToken = token || queryToken;
    const finalError = errorParam || queryError;

    if (finalError) {
      setError(finalError);
      setTimeout(() => navigate('/login'), 3000);
      return;
    }

    if (finalToken) {
      // Store token using authService
      authService.setToken(finalToken);
      refreshUserProfile();
      navigate('/', { replace: true });
    } else {
      setError('No token received');
      setTimeout(() => navigate('/login'), 3000);
    }
  }, [searchParams, navigate, refreshUserProfile]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black px-4">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto">
            <span className="text-red-400 text-2xl">✕</span>
          </div>
          <h2 className="text-xl font-semibold text-white">OAuth Error</h2>
          <p className="text-gray-400">{error}</p>
          <p className="text-gray-500 text-sm">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <div className="text-center space-y-4">
        <Loader2 className="w-12 h-12 text-white animate-spin mx-auto" />
        <p className="text-gray-400">Completing sign in...</p>
      </div>
    </div>
  );
};

export default OAuthCallbackPage;
