import React, { useEffect, useState, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/src/contexts/AuthContext';
import { useTheme } from '@/src/contexts/ThemeContext';
import { authService } from '@/src/features/auth/services/authService';
import { Mail, ShieldAlert } from 'lucide-react';
import { motion } from 'motion/react';
import { AuthInput, PasswordInput } from '@/src/features/auth/components/authFields';
import { LoginBackground } from '@/src/features/auth/components/LoginBackground';
import logoUrl from '/logo-only-bigoutsource.svg';

const PASSWORD_RULES = [
  { label: 'At least 12 characters', test: (value: string) => value.length >= 12 },
  { label: 'One uppercase letter', test: (value: string) => /[A-Z]/.test(value) },
  { label: 'One lowercase letter', test: (value: string) => /[a-z]/.test(value) },
  { label: 'One number', test: (value: string) => /\d/.test(value) },
  { label: 'One special character', test: (value: string) => /[^A-Za-z0-9]/.test(value) },
];

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const navigate = useNavigate();
  const { loginMfa, resendLoginMfa } = useAuth();
  const { isDark } = useTheme();

  useEffect(() => {
    document.documentElement.classList.remove('dark');
    return () => {
      if (isDark) {
        document.documentElement.classList.add('dark');
      }
    };
  }, [isDark]);

  const [isVerifyingToken, setIsVerifyingToken] = useState(true);
  const [isTokenValid, setIsTokenValid] = useState(false);
  const [tokenError, setTokenError] = useState<string | null>(null);

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // MFA Phase States
  const [mfaToken, setMfaToken] = useState<string | null>(null);
  const [mfaCode, setMfaCode] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    async function verifyToken() {
      if (!token) {
        setIsTokenValid(false);
        setTokenError('Missing password reset token');
        setIsVerifyingToken(false);
        return;
      }

      try {
        const result = await authService.verifyResetPasswordToken(token);
        setIsTokenValid(result.valid);
        if (!result.valid && result.message) {
          setTokenError(result.message);
        }
      } catch (err: any) {
        setIsTokenValid(false);
        setTokenError(err.message || 'Invalid or expired password reset link');
      } finally {
        setIsVerifyingToken(false);
      }
    }

    verifyToken();
  }, [token]);

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const passwordRulesErrors = useMemo(() => {
    const errors: string[] = [];
    PASSWORD_RULES.forEach((rule) => {
      if (!rule.test(password)) {
        errors.push(rule.label);
      }
    });
    return errors;
  }, [password]);

  const passwordStrengthScore = PASSWORD_RULES.filter((rule) => rule.test(password)).length;
  const passwordStrength = passwordStrengthScore <= 2 ? 'Weak' : passwordStrengthScore <= 4 ? 'Fair' : 'Strong';
  const passwordStrengthColor =
    passwordStrengthScore <= 2 ? 'bg-[#EF4444]' : passwordStrengthScore <= 4 ? 'bg-[#F59E0B]' : 'bg-[#10B981]';

  const isPasswordValid = passwordRulesErrors.length === 0;
  const isConfirmMatch = password === confirmPassword;

  const canSubmitPassword = isPasswordValid && confirmPassword.length > 0 && isConfirmMatch;
  const canSubmitMfa = mfaCode.trim().length > 0;

  const handlePasswordSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setErrorMsg(null);

    if (!canSubmitPassword) return;

    setIsLoading(true);
    try {
      const result = await authService.resetPassword(token, password);
      if (result?.requiresMfa && result.mfaToken) {
        setMfaToken(result.mfaToken);
        setResendCooldown(300);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to reset password');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMfaSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setErrorMsg(null);

    if (!canSubmitMfa || !mfaToken) return;

    setIsLoading(true);
    try {
      await loginMfa(mfaToken, mfaCode);
      setIsExiting(true);
      setTimeout(() => {
        navigate('/', { replace: true });
      }, 500);
    } catch (err: any) {
      setErrorMsg(err.message || 'Invalid MFA code');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (!mfaToken || resendCooldown > 0 || isLoading) return;
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const result = await resendLoginMfa(mfaToken);
      setMfaToken(result.mfaToken);
      setResendCooldown(300);
      setMfaCode('');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to resend OTP');
    } finally {
      setIsLoading(false);
    }
  };

  if (isVerifyingToken) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-[#F9FAFB]">
        <div className="w-12 h-12 border-4 border-[#E5E7EB] border-t-[#111827] rounded-full animate-spin mb-4" />
        <p className="text-sm font-medium text-[#6B7280]">Verifying password reset link...</p>
      </div>
    );
  }

  return (
    <LoginBackground>
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.97 }}
        animate={isExiting ? { opacity: 0, y: -50, scale: 0.95 } : { opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-[460px] relative z-10"
      >
        <div className="absolute -inset-2 rounded-[36px] bg-gradient-to-r from-[#1f6fa0]/60 to-[#2b93c9]/50 blur-2xl animate-[pulse_5s_ease-in-out_infinite]" />
        
        <div className="bg-white/90 backdrop-blur-xl rounded-[32px] border border-white shadow-[0_20px_60px_-15px_rgba(0,0,0,0.08)] p-8 md:p-10 overflow-hidden relative">
          <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-gray-50 to-transparent pointer-events-none" />

          <div className="flex flex-col items-center mb-8 relative z-10">
            <img src={logoUrl} alt="Big Outsource" className="w-20 h-auto mb-6 relative z-10 object-contain" />
            
            {!isTokenValid ? (
              <>
                <h1 className="text-[1.75rem] font-black text-[#111827] tracking-tight text-center cursor-default select-none animate-fade-in">
                  Link Invalid or Expired
                </h1>
                <p className="text-[#6B7280] text-sm mt-3 text-center text-balance leading-relaxed cursor-default select-none">
                  {tokenError || 'This password reset link is invalid, has expired, or has already been used.'}
                </p>
              </>
            ) : mfaToken ? (
              <>
                <h1 className="text-[1.75rem] font-black text-[#111827] tracking-tight text-center cursor-default select-none animate-fade-in">
                  Verify Your Identity
                </h1>
                <p className="text-[#6B7280] text-sm mt-3 text-center text-balance leading-relaxed cursor-default select-none">
                  We've sent a 6-digit verification code to your email. Enter it below to finish resetting your password and log in.
                </p>
              </>
            ) : (
              <>
                <h1 className="text-[1.75rem] font-black text-[#111827] tracking-tight text-center cursor-default select-none animate-fade-in">
                  Reset Your Password
                </h1>
                <p className="text-[#6B7280] text-sm mt-3 text-center text-balance leading-relaxed cursor-default select-none">
                  Enter your new password below to secure your EIMS account.
                </p>
              </>
            )}
          </div>

          <div className="relative z-10">
            {!isTokenValid ? (
              <div className="space-y-6">
                <div className="flex flex-col items-center p-6 border border-red-100 bg-red-50/50 rounded-2xl">
                  <ShieldAlert className="h-12 w-12 text-[#DC2626] mb-3 animate-pulse" />
                  <p className="text-xs text-center text-red-600 font-semibold leading-relaxed">
                    For security reasons, password reset links expire after 1 hour and are single-use only. Please request a new link if needed.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  className="w-full bg-[#111827] text-white py-3.5 rounded-2xl font-bold text-[0.9375rem] shadow-lg shadow-[#111827]/20 transition-all hover:bg-[#1F2937] active:scale-[0.98] cursor-pointer"
                >
                  Return to Login
                </button>
              </div>
            ) : mfaToken ? (
              <form onSubmit={handleMfaSubmit} className="space-y-5" noValidate>
                <AuthInput
                  icon={Mail}
                  label="Verification Code"
                  type="text"
                  value={mfaCode}
                  onChange={setMfaCode}
                  placeholder="123456"
                  error={errorMsg || undefined}
                  required
                />
                
                <div className="flex justify-center pt-2">
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={resendCooldown > 0 || isLoading}
                    className="text-sm font-bold text-[#111827] disabled:text-gray-400 transition-colors hover:text-blue-600 cursor-pointer disabled:cursor-not-allowed"
                  >
                    {resendCooldown > 0 
                      ? `Resend OTP in ${resendCooldown}s`
                      : 'Resend OTP'
                    }
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={isLoading || !canSubmitMfa}
                  className="w-full bg-[#111827] text-white py-3.5 rounded-2xl font-bold text-[0.9375rem] shadow-lg shadow-[#111827]/20 transition-all hover:bg-[#1F2937] active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    'Verify and Log In'
                  )}
                </button>
              </form>
            ) : (
              <form onSubmit={handlePasswordSubmit} className="space-y-5" noValidate>
                <PasswordInput
                  label="New Password"
                  value={password}
                  onChange={setPassword}
                  showPassword={showPassword}
                  onToggleVisibility={() => setShowPassword(!showPassword)}
                  minLength={12}
                  error={errorMsg || undefined}
                />

                <div className="space-y-2">
                  <div className="flex items-center gap-1.5" aria-label={`Password strength: ${passwordStrength}`}>
                    {PASSWORD_RULES.map((rule) => (
                      <div
                        key={rule.label}
                        className={`h-1.5 flex-1 rounded-full transition-colors ${rule.test(password) ? passwordStrengthColor : 'bg-[#E5E7EB]'}`}
                      />
                    ))}
                    <span className="ml-2 text-[0.625rem] font-black uppercase tracking-wider text-[#6B7280]">
                      {passwordStrength}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 gap-1 text-[0.6875rem] text-[#6B7280]">
                    {PASSWORD_RULES.map((rule) => {
                      const passed = rule.test(password);
                      return (
                        <p key={rule.label} className={passed ? 'text-[#047857]' : 'text-[#6B7280]'}>
                          {passed ? '✓' : '-'} {rule.label}
                        </p>
                      );
                    })}
                  </div>
                </div>

                <PasswordInput
                  label="Confirm New Password"
                  value={confirmPassword}
                  onChange={setConfirmPassword}
                  showPassword={showPassword}
                  onToggleVisibility={() => setShowPassword(!showPassword)}
                  minLength={12}
                  placeholder="Re-enter new password"
                  error={confirmPassword.length > 0 && !isConfirmMatch ? 'Passwords do not match' : undefined}
                />

                <button
                  type="submit"
                  disabled={isLoading || !canSubmitPassword}
                  className="w-full bg-[#111827] text-white py-3.5 rounded-2xl font-bold text-[0.9375rem] shadow-lg shadow-[#111827]/20 transition-all hover:bg-[#1F2937] active:scale-[0.98] flex items-center justify-center gap-2 mt-4 disabled:opacity-50 cursor-pointer"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    'Reset Password'
                  )}
                </button>
              </form>
            )}
          </div>

          <div className="mt-8 pt-8 border-t border-[#F3F4F6] text-center">
            <p className="text-[0.625rem] text-[#9CA3AF] uppercase tracking-widest font-bold cursor-default select-none">
              © 2026 BIG OUTSOURCE
            </p>
            <p className="mt-2 text-[0.625rem] text-[#9CA3AF] cursor-default select-none">
              Secure access for authorized users
            </p>
          </div>
        </div>
      </motion.div>
    </LoginBackground>
  );
}
