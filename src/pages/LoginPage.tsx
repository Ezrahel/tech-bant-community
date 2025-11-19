import { SignIn } from '@clerk/clerk-react';
import { dark } from '@clerk/themes';

const LoginPage: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-white">
      <div className="w-full max-w-md bg-gray-900/30 border border-gray-800 rounded-2xl p-8">
        <SignIn
          routing="path"
          path="/login"
          signUpUrl="/signup"
          appearance={{ baseTheme: dark }}
        />
      </div>
    </div>
  );
};

export default LoginPage;