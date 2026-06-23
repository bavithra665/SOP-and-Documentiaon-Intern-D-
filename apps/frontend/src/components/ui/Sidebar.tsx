import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
  badge?: number;
}

interface SidebarProps {
  navItems: NavItem[];
  collapsed?: boolean;
  onCollapse?: (collapsed: boolean) => void;
  logo?: React.ReactNode;
}

export const Sidebar: React.FC<SidebarProps> = ({
  navItems,
  collapsed = false,
  onCollapse,
  logo,
}) => {
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(collapsed);

  const handleCollapse = () => {
    const newCollapsed = !isCollapsed;
    setIsCollapsed(newCollapsed);
    onCollapse?.(newCollapsed);
  };

  return (
    <div
      className={`bg-white border-r border-gray-200 h-screen flex flex-col transition-all duration-300 ${
        isCollapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Logo */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
        {!isCollapsed && (logo || <span className="font-bold text-lg text-gray-900">AI Docs</span>)}
        <button
          onClick={handleCollapse}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <svg
            className={`w-5 h-5 text-gray-500 transition-transform ${isCollapsed ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 overflow-y-auto">
        <ul className="space-y-1 px-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`flex items-center px-3 py-2 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-ocean-50 text-ocean-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <span className="flex-shrink-0">{item.icon}</span>
                  {!isCollapsed && (
                    <>
                      <span className="ml-3 text-sm font-medium">{item.label}</span>
                      {item.badge && (
                        <span className="ml-auto bg-ocean-100 text-ocean-700 text-xs font-medium px-2 py-0.5 rounded-full">
                          {item.badge}
                        </span>
                      )}
                    </>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User Section */}
      <div className="border-t border-gray-200 p-4">
        <div className={`flex items-center ${isCollapsed ? 'justify-center' : ''}`}>
          <div className="w-8 h-8 bg-ocean-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
            U
          </div>
          {!isCollapsed && (
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-900">User</p>
              <p className="text-xs text-gray-500">user@example.com</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
