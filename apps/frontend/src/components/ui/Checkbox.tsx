import React from 'react';

interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Checkbox: React.FC<CheckboxProps> = ({
  label,
  error,
  className = '',
  ...props
}) => {
  return (
    <div className="flex items-start">
      <div className="flex items-center h-5">
        <input
          type="checkbox"
          className={`w-4 h-4 text-ocean-600 border-gray-300 rounded focus:ring-ocean-500 focus:ring-2 ${
            error ? 'border-red-300' : ''
          } ${className}`}
          {...props}
        />
      </div>
      {label && (
        <div className="ml-3 text-sm">
          <label className="font-medium text-gray-700">{label}</label>
        </div>
      )}
    </div>
  );
};
