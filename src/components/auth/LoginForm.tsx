import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Github, Mail, UserPlus } from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth-context';

interface LoginFormProps {
  onLogin?: (email: string, password: string) => Promise<void>;
  onSignUp?: (email: string, password: string) => Promise<void>;
  onGithubLogin?: () => Promise<void>;
}

export function LoginForm({ onLogin, onSignUp, onGithubLogin }: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  // Redirect to main page if user is already authenticated
  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      if (isSignUp) {
        if (onSignUp) {
          await onSignUp(email, password);
          toast.success('Account created successfully! Please check your email to verify your account.');
        } else {
          toast.info('Sign up functionality not connected yet');
        }
      } else {
        if (onLogin) {
          await onLogin(email, password);
          toast.success('Logged in successfully');
          // Navigate to main screen after successful login
          navigate('/');
        } else {
          toast.info('Login functionality not connected yet');
        }
      }
    } catch (error: any) {
      const errorMessage = error.message || (isSignUp ? 'Failed to create account' : 'Failed to log in');
      toast.error(errorMessage);
      console.error(isSignUp ? 'Sign up error:' : 'Login error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGithubLogin = async () => {
    try {
      if (onGithubLogin) {
        await onGithubLogin();
      } else {
        toast.info('GitHub login not connected yet');
      }
    } catch (error) {
      toast.error('Failed to log in with GitHub');
      console.error('GitHub login error:', error);
    }
  };

  // Don't render the form if user is already authenticated
  if (user) {
    return null;
  }

  return (
    <Card className="w-[400px]">
      <CardHeader>
        <CardTitle className="text-center">
          {isSignUp ? 'Create Account' : 'Welcome Back'}
        </CardTitle>
        <CardDescription className="text-center">
          {isSignUp 
            ? 'Create a new account to get started' 
            : 'Sign in to your account to continue'
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleEmailSubmit} className="space-y-4">
          <div className="space-y-2">
            <Input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>
          <Button 
            type="submit" 
            className="w-full" 
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                {isSignUp ? 'Creating Account...' : 'Signing In...'}
              </div>
            ) : (
              <>
                {isSignUp ? <UserPlus className="mr-2 h-4 w-4" /> : <Mail className="mr-2 h-4 w-4" />}
                {isSignUp ? 'Create Account' : 'Sign In'}
              </>
            )}
          </Button>
        </form>
        
        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              Or continue with
            </span>
          </div>
        </div>

        <div className="space-y-2">
          <Button
            variant="outline"
            className="w-full"
            onClick={handleGithubLogin}
            disabled={isLoading}
          >
            <Github className="mr-2 h-4 w-4" />
            Continue with GitHub
          </Button>
        </div>

        <div className="mt-4 text-center">
          <p className="text-sm text-muted-foreground">
            {isSignUp ? 'Already have an account?' : "Don't have an account? "}
            <Button
              variant="link"
              className="p-0 h-auto font-normal text-sm"
              onClick={() => setIsSignUp(!isSignUp)}
            >
              {isSignUp ? 'Sign in' : 'Sign up'}
            </Button>
          </p>
        </div>
      </CardContent>
    </Card>
  );
} 