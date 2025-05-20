import React from 'react';
import { Link } from 'react-router-dom';
import { Bell, Settings, Search } from 'lucide-react';

interface TopHeaderProps {
  title?: string;
  showSearch?: boolean;
}

const TopHeader: React.FC<TopHeaderProps> = ({ title, showSearch = true }) => {
  return (
    <header className="bg-white border-b border-gray-200 shadow-sm">
      <div className="flex justify-between items-center h-16 px-6">
        {/* Titre de la page */}
        {title && (
          <h1 className="text-xl font-semibold text-gray-800">{title}</h1>
        )}

        {/* Zone de recherche (optionnelle) */}
        {showSearch && (
          <div className="hidden md:block mx-auto max-w-lg w-full px-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Rechercher..."
                className="bg-gray-100 w-full py-2 pl-10 pr-4 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-mohero-accent focus:bg-white"
              />
            </div>
          </div>
        )}

        {/* Icônes à droite */}
        <div className="flex items-center space-x-4">
          {/* Notifications */}
          <div className="relative">
            <button className="p-2 text-gray-600 hover:text-mohero-accent hover:bg-gray-100 rounded-full transition-colors">
              <Bell size={20} />
              <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 bg-red-500 rounded-full"></span>
            </button>
          </div>

          {/* Paramètres */}
          <Link to="/settings" className="p-2 text-gray-600 hover:text-mohero-accent hover:bg-gray-100 rounded-full transition-colors">
            <Settings size={20} />
          </Link>

          {/* Avatar utilisateur */}
          <Link to="/profile" className="h-9 w-9 bg-mohero-sidebar rounded-full flex items-center justify-center text-white font-medium text-sm hover:bg-gray-700 transition-colors">
            TP
          </Link>
        </div>
      </div>
    </header>
  );
};

export default TopHeader; 