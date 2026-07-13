import React from 'react';
import { HelpCircle } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'motion/react';
import { useAuth } from '../contexts/AuthContext';

export function FloatingFAQButton() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  if (!user || location.pathname === '/faq') return null;

  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      onClick={() => navigate('/faq')}
      className="fixed bottom-6 right-6 z-50 flex items-center justify-center w-14 h-14 rounded-full bg-transparent text-gray-400 hover:text-white hover:bg-blue-600 hover:shadow-xl transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      aria-label="Frequently Asked Questions"
    >
      <HelpCircle className="w-6 h-6" />
      {/* Optional: Add a small pulsing dot indicator to draw attention */}
      <span className="absolute top-0 right-0 flex h-3 w-3">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
      </span>
    </motion.button>
  );
}
