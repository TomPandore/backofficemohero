import React, { ReactNode } from 'react';

interface PageContainerProps {
  title?: string;
  children: ReactNode;
  action?: ReactNode;
}

const PageContainer: React.FC<PageContainerProps> = ({ 
  title, 
  children, 
  action 
}) => {
  return (
    <div className="w-full">
      {title && (
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold text-gray-800">{title}</h1>
          {action}
        </div>
      )}
      <div className="text-gray-700">
        {children}
      </div>
    </div>
  );
};

export default PageContainer;