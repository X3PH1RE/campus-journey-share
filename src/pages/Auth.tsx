
import AuthForm from '@/components/auth/AuthForm';
import { CarIcon } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';

const Auth = () => {
  const { user, isLoading } = useAuth();

  // Redirect if already logged in
  if (!isLoading && user) {
    return <Navigate to="/app" replace />;
  }

  return (
    <div className="flex flex-col min-h-screen bg-muted/30">
      <div className="container max-w-screen-xl flex flex-col items-center justify-center flex-1 px-4 py-12">
        <div className="w-full max-w-md">
          <div className="flex flex-col items-center mb-8">
            <div className="bg-primary/10 p-3 rounded-full mb-4">
              <CarIcon className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-2xl font-bold">Welcome to Hailo</h1>
            <p className="text-muted-foreground text-center mt-1">
              Sign in to your account or create a new one
            </p>
          </div>
          
          <AuthForm />
          
          <div className="text-center mt-8">
            <p className="text-sm text-muted-foreground">
              By signing in, you agree to our Terms of Service and Privacy Policy.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
