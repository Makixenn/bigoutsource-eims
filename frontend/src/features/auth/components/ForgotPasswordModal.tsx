import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, ArrowLeft, CheckCircle2, X } from 'lucide-react';
import { AuthInput } from './authFields';
import { authService } from '../services/authService';

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialEmail?: string;
}

export function ForgotPasswordModal({ isOpen, onClose, initialEmail = '' }: ForgotPasswordModalProps) {
  const [email, setEmail] = useState(initialEmail);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setEmail(initialEmail);
      setError(null);
      setIsSubmitted(false);
    }
  }, [isOpen, initialEmail]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || isLoading) return;

    setIsLoading(true);
    setError(null);

    try {
      await authService.forgotPassword(email.trim());
      setIsSubmitted(true);
    } catch (err: any) {
      setError(err.message || 'Failed to request password reset. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetModal = () => {
    setEmail('');
    setError(null);
    setIsSubmitted(false);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleResetModal}
            className="fixed inset-0 bg-[#111827]/60 backdrop-blur-md"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', stiffness: 380, damping: 30 }}
            className="relative w-full max-w-md bg-white rounded-[28px] border border-gray-100 shadow-2xl p-8 overflow-hidden z-10"
          >
            <div className="absolute top-0 left-0 w-full h-28 bg-gradient-to-b from-gray-50 to-transparent pointer-events-none" />

            <button
              onClick={handleResetModal}
              className="absolute top-5 right-5 p-2 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors z-20"
            >
              <X className="w-5 h-5" />
            </button>

            {isSubmitted ? (
              <div className="flex flex-col items-center text-center py-4 relative z-10">
                <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-5 shadow-inner">
                  <CheckCircle2 className="w-9 h-9" />
                </div>
                <h3 className="text-2xl font-black text-[#111827] mb-2 tracking-tight">
                  Check Your Inbox
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed mb-6">
                  If an account with <span className="font-semibold text-gray-900">{email}</span> exists, we have sent instructions to reset your password.
                </p>
                <button
                  type="button"
                  onClick={handleResetModal}
                  className="w-full bg-[#111827] text-white py-3.5 rounded-2xl font-bold text-sm shadow-lg shadow-[#111827]/20 hover:bg-[#1F2937] transition-all"
                >
                  Return to Login
                </button>
              </div>
            ) : (
              <div className="relative z-10">
                <div className="mb-6">
                  <h3 className="text-2xl font-black text-[#111827] tracking-tight mb-2">
                    Forgot Password?
                  </h3>
                  <p className="text-sm text-gray-500 leading-relaxed">
                    Enter your registered email address and we'll send you a link to reset your password.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                  <AuthInput
                    icon={Mail}
                    label="Email Address"
                    type="email"
                    value={email}
                    onChange={setEmail}
                    placeholder="name@bigoutsource.com"
                    error={error || undefined}
                    required
                  />

                  <div className="flex items-center gap-3 pt-2">
                    <button
                      type="button"
                      onClick={handleResetModal}
                      className="flex-1 py-3.5 rounded-2xl border border-gray-200 font-bold text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isLoading || !email.trim()}
                      className="flex-1 bg-[#111827] text-white py-3.5 rounded-2xl font-bold text-sm shadow-lg shadow-[#111827]/20 hover:bg-[#1F2937] active:scale-[0.98] disabled:opacity-50 transition-all flex items-center justify-center"
                    >
                      {isLoading ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        'Send Reset Link'
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
