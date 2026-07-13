import React from 'react';
import clsx from 'clsx';
import { HelpCircle, Bell, LayoutDashboard, Database, UserCircle, Shield, FileText, Users } from 'lucide-react';

export type FAQCategory = {
  id: string;
  label: string;
  description: string;
  icon: keyof typeof ICON_MAP;
};

const ICON_MAP = {
  HelpCircle: HelpCircle,
  Bell: Bell,
  LayoutDashboard: LayoutDashboard,
  Database: Database,
  UserCircle: UserCircle,
  Shield: Shield,
  FileText: FileText,
  Users: Users,
};

interface FAQSidebarProps {
  categories: FAQCategory[];
  activeCategory: string;
  onSelectCategory: (id: string) => void;
}

export function FAQSidebar({ categories, activeCategory, onSelectCategory }: FAQSidebarProps) {
  return (
    <div className="w-full lg:w-80 flex-shrink-0 mb-8 lg:mb-0 lg:mr-8 space-y-8">
      <div>
        <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 px-2">FAQ Categories</h2>
        <div className="space-y-2">
          {categories.map((category) => {
            const IconComponent = ICON_MAP[category.icon] || HelpCircle;
            const isActive = activeCategory === category.id;
            return (
              <button
                key={category.id}
                onClick={() => onSelectCategory(category.id)}
                className={clsx(
                  "w-full flex items-center p-4 rounded-2xl transition-all duration-200 border text-left",
                  isActive 
                    ? "bg-[#111827] text-white border-[#111827] shadow-md transform scale-[1.02]" 
                    : "bg-white text-gray-700 border-gray-100 hover:border-gray-200 hover:bg-gray-50 hover:shadow-sm"
                )}
              >
                <div className={clsx(
                  "flex items-center justify-center w-10 h-10 rounded-full mr-4 flex-shrink-0 transition-colors",
                  isActive ? "bg-white/10 text-white" : "bg-gray-100 text-gray-500"
                )}>
                  <IconComponent className="w-5 h-5" />
                </div>
                <div>
                  <h3 className={clsx("font-semibold text-sm", isActive ? "text-white" : "text-gray-900")}>
                    {category.label}
                  </h3>
                  <p className={clsx("text-xs mt-0.5", isActive ? "text-gray-300" : "text-gray-500")}>
                    {category.description}
                  </p>
                </div>
                <div className="ml-auto pl-2">
                  <div className={clsx("w-1.5 h-1.5 rounded-full", isActive ? "bg-blue-400" : "bg-transparent")} />
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
