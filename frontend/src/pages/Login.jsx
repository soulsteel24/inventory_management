import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSignIn, useSignUp } from '@clerk/react/legacy';
import { Lock, Mail, AlertCircle, RefreshCw, ArrowRight, ShieldCheck } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  // Verification states
  const [verifying, setVerifying] = useState(false);
  const [otpCode, setOtpCode] = useState('');

  const { isLoaded: isSignInLoaded, signIn, setActive } = useSignIn();
  const { isLoaded: isSignUpLoaded, signUp } = useSignUp();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const { user } = useAuth();

  // Redirect if already authenticated
  React.useEffect(() => {
    if (user) {
      console.log('User is authenticated, redirecting to dashboard...');
      navigate('/');
    }
  }, [user, navigate]);

  console.log('Login component render. isSignInLoaded:', isSignInLoaded, 'isSignUpLoaded:', isSignUpLoaded, 'loading:', loading, 'hasUser:', !!user);

  const handleGoogleSignIn = async () => {
    console.log('handleGoogleSignIn clicked');
    if (!isSignInLoaded) {
      console.warn('Google sign-in clicked but isSignInLoaded is false!');
      addToast('Authentication service is still loading. Please wait a moment...', 'warning');
      return;
    }
    try {
      setLoading(true);
      setErrorMsg('');
      console.log('Calling signIn.authenticateWithRedirect...');
      await signIn.authenticateWithRedirect({
        strategy: 'oauth_google',
        redirectUrl: '/sso-callback',
        redirectUrlComplete: '/',
      });
    } catch (err) {
      console.error('Google sign-in error:', err);
      setErrorMsg(err.message || 'Failed to initialize Google sign-in.');
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isSignInLoaded || !isSignUpLoaded) return;
    if (!email.trim() || !password) {
      setErrorMsg('Please fill in all fields.');
      return;
    }

    try {
      setLoading(true);
      setErrorMsg('');

      // 1. Try to sign in first
      const signInAttempt = await signIn.create({
        identifier: email,
        password: password,
      });

      if (signInAttempt.status === 'complete') {
        await setActive({ session: signInAttempt.createdSessionId });
        addToast('Welcome back to Inventory SYNC!', 'success');
        navigate('/');
      } else {
        setErrorMsg('Sign-in requires additional verification steps.');
      }
    } catch (signInErr) {
      console.log('Sign-in failed. Checking if user exists...', signInErr);

      // Check if error is because user does not exist
      const userNotFound = signInErr.errors?.some(
        (err) => err.code === 'form_identifier_not_found'
      );

      if (userNotFound) {
        // 2. User doesn't exist, directly register them!
        try {
          // Generate a safe username fallback just in case their Clerk configurations require it
          const cleanEmailPrefix = email.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '');
          const fallbackUsername = `${cleanEmailPrefix}_${Math.floor(100 + Math.random() * 900)}`;

          const signUpAttempt = await signUp.create({
            emailAddress: email,
            password: password,
            username: fallbackUsername,
          });

          if (signUpAttempt.status === 'missing_requirements') {
            // Trigger verification email
            await signUp.prepareEmailAddressVerification({
              strategy: 'email_code',
            });
            setVerifying(true);
            addToast('Account not found. Automatically initiating registration. Verification code sent!', 'info');
          } else if (signUpAttempt.status === 'complete') {
            await setActive({ session: signUpAttempt.createdSessionId });
            addToast('Account created successfully!', 'success');
            navigate('/');
          }
        } catch (signUpErr) {
          console.error('Sign-up failed:', signUpErr);
          setErrorMsg(signUpErr.message || 'Failed to auto-create account.');
        }
      } else {
        // Standard wrong password or form error
        setErrorMsg(signInErr.message || 'Invalid email or password.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!isSignUpLoaded) return;
    if (!otpCode.trim()) {
      setErrorMsg('Please enter the verification code.');
      return;
    }

    try {
      setLoading(true);
      setErrorMsg('');

      const completeSignUp = await signUp.attemptEmailAddressVerification({
        code: otpCode,
      });

      if (completeSignUp.status === 'complete') {
        await setActive({ session: completeSignUp.createdSessionId });
        addToast('Registration complete. Welcome to Inventory SYNC!', 'success');
        navigate('/');
      } else {
        setErrorMsg('Verification incomplete. Please check requirements.');
      }
    } catch (err) {
      console.error('OTP verification failed:', err);
      setErrorMsg(err.message || 'Invalid code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 px-4 transition-colors duration-200">
      <div className="w-full max-w-[400px] bg-white dark:bg-slate-900 rounded-[24px] shadow-xl border border-slate-100 dark:border-slate-800 p-8 space-y-6 relative overflow-hidden animate-fade-in">
        {/* Decorative background glow */}
        <div className="absolute -top-20 -right-20 w-48 h-48 bg-brand-500/10 dark:bg-brand-500/20 rounded-full blur-3xl pointer-events-none z-0" />
        <div className="absolute -bottom-20 -left-20 w-48 h-48 bg-emerald-500/10 dark:bg-emerald-500/20 rounded-full blur-3xl pointer-events-none z-0" />

        {!verifying ? (
          <>
            <div className="text-center relative z-10">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-brand-500/10 dark:bg-brand-500/20 text-brand-500 rounded-2xl mb-4 text-xl font-bold">
                🔄
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Sign in</h2>
              <p className="text-slate-500 dark:text-slate-400 mt-1.5 text-sm">
                to continue to Inventory SYNC
              </p>
            </div>

            {errorMsg && (
              <div className="p-3.5 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 text-rose-800 dark:text-rose-300 rounded-2xl flex items-start gap-2.5 text-xs animate-fade-in">
                <AlertCircle className="w-4 h-4 text-rose-500 dark:text-rose-400 shrink-0 mt-0.5" />
                <p className="font-medium">{errorMsg}</p>
              </div>
            )}

            <div className="space-y-4 relative z-10">
              {/* Google Sign In Button */}
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full py-2.5 px-4 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-200 flex items-center justify-center gap-2.5 hover:bg-slate-50 dark:hover:bg-slate-900 transition-all cursor-pointer shadow-xs disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {/* Google Icon SVG */}
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#EA4335"
                    d="M12 5.04c1.66 0 3.2.57 4.38 1.69l3.27-3.27C17.67 1.6 15.02 1 12 1 7.35 1 3.39 3.67 1.4 7.56l3.85 2.99C6.2 7.74 8.87 5.04 12 5.04z"
                  />
                  <path
                    fill="#4285F4"
                    d="M23.49 12.27c0-.81-.07-1.59-.2-2.36H12v4.51h6.46c-.29 1.48-1.14 2.73-2.4 3.58l3.73 2.89c2.18-2.01 3.7-4.97 3.7-8.62z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.25 14.65c-.25-.74-.39-1.53-.39-2.35s.14-1.61.39-2.35L1.4 6.96C.5 8.78 0 10.83 0 13s.5 4.22 1.4 6.04l3.85-3.39z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c3.24 0 5.97-1.07 7.96-2.91l-3.73-2.89c-1.04.7-2.37 1.12-4.23 1.12-3.13 0-5.8-2.7-6.75-5.51l-3.85 2.99C3.39 20.33 7.35 23 12 23z"
                  />
                </svg>
                Continue with Google
              </button>

              {/* Divider */}
              <div className="flex items-center gap-3">
                <div className="h-px bg-slate-200 dark:bg-slate-800 flex-1" />
                <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider">or</span>
                <div className="h-px bg-slate-200 dark:bg-slate-800 flex-1" />
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Email address</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 dark:text-slate-500">
                      <Mail className="w-4 h-4" />
                    </span>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@example.com"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 transition-all text-sm"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Password</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 dark:text-slate-500">
                      <Lock className="w-4 h-4" />
                    </span>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 transition-all text-sm"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 px-4 bg-brand-500 hover:bg-brand-600 active:bg-brand-700 text-white rounded-xl text-sm font-semibold shadow-xs hover:shadow-md transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" /> Processing...
                    </>
                  ) : (
                    <>
                      Continue <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            </div>
          </>
        ) : (
          <>
            <div className="text-center relative z-10">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-brand-500/10 dark:bg-brand-500/20 text-brand-500 rounded-2xl mb-4">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Verify Your Email</h2>
              <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm">
                We've sent a 6-digit confirmation code to <strong className="text-slate-800 dark:text-slate-200">{email}</strong>.
              </p>
            </div>

            {errorMsg && (
              <div className="p-3.5 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 text-rose-800 dark:text-rose-300 rounded-2xl flex items-start gap-2.5 text-xs animate-fade-in">
                <AlertCircle className="w-4 h-4 text-rose-500 dark:text-rose-400 shrink-0 mt-0.5" />
                <p className="font-medium">{errorMsg}</p>
              </div>
            )}

            <form onSubmit={handleVerify} className="space-y-4 relative z-10" autoComplete="off">
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Verification Code</label>
                <input
                  type="text"
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="123456"
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 transition-all text-center tracking-widest text-lg font-bold"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 bg-brand-500 hover:bg-brand-600 active:bg-brand-700 text-white rounded-xl text-sm font-semibold shadow-xs hover:shadow-md transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" /> Verifying...
                  </>
                ) : (
                  'Confirm & Create Account'
                )}
              </button>
            </form>

            <div className="text-center relative z-10 text-xs">
              <button
                type="button"
                onClick={() => setVerifying(false)}
                className="text-brand-600 hover:text-brand-500 dark:text-brand-500 dark:hover:text-brand-500 font-semibold transition-colors"
              >
                Back to Sign In
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default Login;


