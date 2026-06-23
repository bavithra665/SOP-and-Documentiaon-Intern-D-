import React from 'react';

interface LoadingProps {
  size?: 'sm' | 'md' | 'lg';
  color?: string;
  text?: string;
}

export const Loading: React.FC<LoadingProps> = ({ size = 'md', color = 'ocean-600', text }) => {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  return (
    <div className="flex flex-col items-center justify-center">
      <div className={`animate-spin rounded-full border-2 border-gray-200 border-t-${color} ${sizes[size]}`}></div>
      {text && <p className="mt-2 text-sm text-gray-500">{text}</p>}
    </div>
  );
};

export const PageLoading: React.FC<{ text?: string }> = ({ text = 'Loading...' }) => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="text-center">
        <Loading size="lg" />
        <p className="mt-4 text-gray-600">{text}</p>
      </div>
    </div>
  );
};

export const Skeleton: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`animate-pulse bg-gray-200 rounded ${className}`} />
  );
};

export const SkeletonText: React.FC<{ lines?: number; className?: string }> = ({ lines = 3, className = '' }) => {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} className={`h-4 ${i === lines - 1 ? 'w-3/4' : 'w-full'}`} />
      ))}
    </div>
  );
};

export const SkeletonCard: React.FC = () => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <Skeleton className="h-6 w-1/3 mb-4" />
      <SkeletonText lines={3} />
    </div>
  );
};
