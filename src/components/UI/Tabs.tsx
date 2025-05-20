import React, { createContext, useContext, useState } from 'react';

type TabsContextType = {
  value: string;
  onValueChange: (value: string) => void;
};

const TabsContext = createContext<TabsContextType | undefined>(undefined);

// Hook pour utiliser le contexte des tabs
const useTabsContext = () => {
  const context = useContext(TabsContext);
  if (!context) {
    throw new Error("Les composants Tabs doivent être utilisés à l'intérieur d'un composant Tabs");
  }
  return context;
};

type TabsProps = {
  value: string;
  onValueChange: (value: string) => void;
  children: React.ReactNode;
  className?: string;
};

export const Tabs: React.FC<TabsProps> = ({ 
  value, 
  onValueChange, 
  children, 
  className = ''
}) => {
  return (
    <TabsContext.Provider value={{ value, onValueChange }}>
      <div className={`tabs ${className}`}>
        {children}
      </div>
    </TabsContext.Provider>
  );
};

type TabsListProps = {
  children: React.ReactNode;
  className?: string;
};

export const TabsList: React.FC<TabsListProps> = ({ children, className = '' }) => {
  return (
    <div className={`flex border-b border-gray-200 mb-6 ${className}`}>
      {children}
    </div>
  );
};

type TabsTriggerProps = {
  value: string;
  children: React.ReactNode;
  className?: string;
};

export const TabsTrigger: React.FC<TabsTriggerProps> = ({ 
  value, 
  children, 
  className = '' 
}) => {
  const { value: selectedValue, onValueChange } = useTabsContext();
  const isActive = selectedValue === value;
  
  return (
    <button
      type="button"
      onClick={() => onValueChange(value)}
      className={`px-4 py-2 text-sm font-medium ${
        isActive 
          ? 'text-blue-600 border-b-2 border-blue-600' 
          : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
      } ${className}`}
    >
      {children}
    </button>
  );
};

type TabsContentProps = {
  value: string;
  children: React.ReactNode;
  className?: string;
};

export const TabsContent: React.FC<TabsContentProps> = ({ 
  value, 
  children, 
  className = '' 
}) => {
  const { value: selectedValue } = useTabsContext();
  
  if (selectedValue !== value) {
    return null;
  }
  
  return (
    <div className={className}>
      {children}
    </div>
  );
}; 