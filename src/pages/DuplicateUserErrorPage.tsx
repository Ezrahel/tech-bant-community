import React from 'react';

const DuplicateUserErrorPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      <div className="w-full max-w-md">
        <div className="bg-gray-900/30 border border-gray-800 rounded-2xl p-8 text-center">
          <div className="flex flex-col items-center mb-6">
            <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center mb-4">
              <span className="text-2xl font-bold text-white">!</span>
            </div>
            <h1 className="text-2xl font-bold mb-2">Account Already Exists</h1>
            <p className="text-gray-400 mb-4">
              A user with the same email or phone number already exists in this project.<br/>
              Please try logging in or use a different email address.
            </p>
            <button
              onClick={() => (window.location.href = '/signup')}
              className="w-full bg-white text-black py-3 rounded-xl font-medium hover:bg-gray-200 transition-colors mb-2"
            >
              Back to Signup
            </button>
            <button
              onClick={() => (window.location.href = '/')}
              className="w-full bg-gray-800 text-white py-3 rounded-xl font-medium hover:bg-gray-700 transition-colors"
            >
              Go to Home
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DuplicateUserErrorPage; 