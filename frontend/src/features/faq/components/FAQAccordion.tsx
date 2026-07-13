import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown } from 'lucide-react';
import clsx from 'clsx';

interface FAQAccordionProps {
  question: string;
  answer: React.ReactNode;
  defaultOpen?: boolean;
}

export function FAQAccordion({ question, answer, defaultOpen = false }: FAQAccordionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border border-gray-200 rounded-xl bg-white shadow-sm overflow-hidden transition-all duration-200 hover:border-gray-300 hover:shadow-md mb-3">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-5 py-4 text-left focus:outline-none"
      >
        <span className="font-semibold text-gray-800">{question}</span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2, ease: "easeInOut" }}
          className="flex-shrink-0 ml-4 text-gray-400"
        >
          <ChevronDown className="w-5 h-5" />
        </motion.div>
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
          >
            <div className="px-5 pb-5 pt-1 text-gray-600 leading-relaxed text-sm">
              {answer}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
