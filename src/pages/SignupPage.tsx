import React, { useState } from 'react';
import { Mail, Lock, User, ArrowRight, Github, Chrome } from 'lucide-react';
import { authService } from '../services/auth';
import { useNavigate } from 'react-router-dom';

const SignupPage: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const navigate = useNavigate();

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      alert('Passwords do not match');
      return;
    }
    authService.register({ name, email, password })
      .then(() => {
        navigate('/');
      })
      .catch((error) => {
        console.error('Registration failed:', error);
        // Check for duplicate user error
        if (
          error?.response?.data?.error?.includes('failed to create account') &&
          error?.response?.data?.error?.includes('already exists')
        ) {
          window.location.href = '/duplicate-user-error';
        } else {
          alert('Registration failed. Please try again.');
        }
      });
  };

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      <div className="w-full max-w-md">
        <div className="bg-gray-900/30 border border-gray-800 rounded-2xl p-8">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                <div className="w-4 h-4 bg-black rounded-full"></div>
              </div>
              <h1 className="text-2xl font-bold">nothing community</h1>
            </div>
            <p className="text-gray-400 text-sm">Join the tech community</p>
          </div>

          {/* Signup Form */}
          <form onSubmit={handleSignup} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-gray-900 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-gray-600 transition-colors"
                  placeholder="Enter your full name"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-gray-900 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-gray-600 transition-colors"
                  placeholder="Enter your email"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-gray-900 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-gray-600 transition-colors"
                  placeholder="Create a password"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-gray-900 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-gray-600 transition-colors"
                  placeholder="Confirm your password"
                  required
                />
              </div>
            </div>

            <div className="flex items-start">
              <input type="checkbox" className="w-4 h-4 text-white bg-gray-900 border-gray-700 rounded focus:ring-white focus:ring-2 mt-1" required />
              <span className="ml-2 text-sm text-gray-300">
                I agree to the <button type="button" className="text-white hover:text-gray-300 transition-colors">Terms of Service</button> and <button type="button" className="text-white hover:text-gray-300 transition-colors">Privacy Policy</button>
              </span>
            </div>

            <button
              type="submit"
              className="w-full bg-white text-black py-3 rounded-xl font-medium hover:bg-gray-200 transition-colors flex items-center justify-center space-x-2"
            >
              <span>Create Account</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Divider */}
          <div className="my-6 flex items-center">
            <div className="flex-1 border-t border-gray-700"></div>
            <span className="px-4 text-sm text-gray-500">or</span>
            <div className="flex-1 border-t border-gray-700"></div>
          </div>

          {/* Social Login */}
          <div className="space-y-3">
            <button 
              onClick={async () => {
                try {
                  const authUrl = await authService.getGoogleAuthUrl();
                  window.location.href = authUrl;
                } catch (error) {
                  console.error('Google auth error:', error);
                }
              }}
              className="w-full bg-gray-900 border border-gray-700 text-white py-3 rounded-xl font-medium hover:bg-gray-800 transition-colors flex items-center justify-center space-x-2"
            >
              <Github className="w-5 h-5" />
              <span>Continue with Google</span>
            </button>
            <button 
              onClick={async () => {
                try {
                  const authUrl = await authService.getGitHubAuthUrl();
                  window.location.href = authUrl;
                } catch (error) {
                  console.error('GitHub auth error:', error);
                }
              }}
              className="w-full bg-gray-900 border border-gray-700 text-white py-3 rounded-xl font-medium hover:bg-gray-800 transition-colors flex items-center justify-center space-x-2"
            >
              <Chrome className="w-5 h-5" />
              <span>Continue with GitHub</span>
            </button>
          </div>

          {/* Sign In Link */}
          <div className="text-center mt-6">
            <span className="text-gray-400 text-sm">Already have an account? </span>
            <button 
              onClick={() => navigate('/login')}
              className="text-white hover:text-gray-300 transition-colors text-sm font-medium"
            >
              Sign in
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;