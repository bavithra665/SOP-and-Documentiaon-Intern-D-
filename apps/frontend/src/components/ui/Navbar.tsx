import React from 'react';

interface NavbarProps {
  title?: string;
  breadcrumbs?: { label: string; path?: string }[];
  actions?: React.ReactNode;
  user?: {
    name: string;
    avatar?: string;
    role: string;
  };
  onLogout?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  title,
  breadcrumbs,
  actions,
  user,
  onLogout,
}) => {
  return (
    <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-6">
      {/* Left Section */}
      <div className="flex items-center space-x-4">
        {breadcrumbs && breadcrumbs.length > 0 ? (
          <nav className="flex items-center space-x-2 text-sm">
            {breadcrumbs.map((crumb, index) => (
              <React.Fragment key={index}>
                {index > 0 && (
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                )}
                <span
                  className={`${
                    index === breadcrumbs.length - 1
                      ? 'text-gray-900 font-medium'
                      : 'text-gray-500 hover:text-gray-700 cursor-pointer'
                  }`}
                >
                  {crumb.label}
                </span>
              </React.Fragment>
            ))}
          </nav>
        ) : (
          <h1 className="text-lg font-semibold text-gray-900">{title}</h1>
        )}
      </div>

      {/* Right Section */}
      <div className="flex items-center space-x-4">
        {actions && <div className="flex items-center space-x-2">{actions}</div>}
        
        {/* User Menu */}
        {user && (
          <div className="flex items-center space-x-3 pl-4 border-l border-gray-200">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-gray-900">{user.name}</p>
              <p className="text-xs text-gray-500">{user.role}</p>
            </div>
            <div className="w-8 h-8 bg-ocean-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
              {user.avatar || user.name.charAt(0).toUpperCase()}
            </div>
            {onLogout && (
              <button
                onClick={onLogout}
                className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
                title="Logout"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            )}
          </div>
        )}
      </div>
    </header>
  );
};
