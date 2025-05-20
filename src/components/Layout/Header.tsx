import React from 'react';
import { Navigation, BarChart2, Dumbbell, User, Settings, Search } from 'lucide-react';
import { Link } from 'react-router-dom';

const Header: React.FC = () => {
  return (
    <header className="bg-white border-b border-gray-200 shadow-sm">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-2">
            <div className="bg-blue-600 text-white p-1.5 rounded">
              <Navigation size={20} />
            </div>
            <h1 className="text-xl font-semibold text-gray-800">MoHero</h1>
          </div>
          
          <div className="hidden md:block mx-auto max-w-lg w-full px-8">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Rechercher..."
                className="bg-gray-100 w-full py-2 pl-10 pr-4 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white"
              />
            </div>
          </div>
          
          <nav className="flex items-center space-x-1">
            <Link to="/" className="relative p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors">
              <Navigation size={20} />
            </Link>
            <Link to="/exercise-bank" className="relative p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors">
              <Dumbbell size={20} />
              <span className="absolute top-0 right-0 h-2 w-2 bg-blue-600 rounded-full"></span>
            </Link>
            <Link to="/stats" className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors">
              <BarChart2 size={20} />
            </Link>
            <div className="h-6 w-px bg-gray-300 mx-1"></div>
            <Link to="/profile" className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors">
              <User size={20} />
            </Link>
            <Link to="/settings" className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors">
              <Settings size={20} />
            </Link>
            <Link to="/profile" className="ml-2 h-8 w-8 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center text-white font-medium text-sm">
              TP
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;