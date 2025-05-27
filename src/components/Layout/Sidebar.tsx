import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Dumbbell, 
  BarChart2, 
  Settings, 
  User, 
  ChevronLeft, 
  ChevronRight,
  Menu,
  Home,
  Users,
  FileText,
  BookOpen
} from 'lucide-react';

const Sidebar: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  // Groupes de menu
  const menuGroups = [
    {
      title: "Tableau de bord",
      items: [
        { 
          path: '/stats', 
          icon: <BarChart2 size={20} />, 
          label: 'Statistiques',
          notification: false
        }
      ]
    },
    {
      title: "Application",
      items: [
        { 
          path: '/', 
          icon: <LayoutDashboard size={20} />, 
          label: 'Programmes',
          notification: false
        },
        { 
          path: '/exercise-bank', 
          icon: <Dumbbell size={20} />, 
          label: 'Exercices',
          notification: true
        },
        { 
          path: '/blog', 
          icon: <FileText size={20} />, 
          label: 'Blog',
          notification: false
        }
      ]
    },
    {
      title: "Utilisateurs",
      items: [
        { 
          path: '/users', 
          icon: <Users size={20} />, 
          label: 'Gestion',
          notification: false
        },
        { 
          path: '/clans', 
          icon: <BookOpen size={20} />, 
          label: 'Clans',
          notification: false
        }
      ]
    },
    {
      title: "Administration",
      items: [
        { 
          path: '/settings', 
          icon: <Settings size={20} />, 
          label: 'Paramètres',
          notification: false
        },
        { 
          path: '/profile', 
          icon: <User size={20} />, 
          label: 'Profil',
          notification: false
        }
      ]
    }
  ];

  return (
    <aside className={`bg-mohero-sidebar text-white transition-all duration-300 ease-in-out ${collapsed ? 'w-16' : 'w-64'} border-r border-gray-800`}>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center h-16 px-4 border-b border-gray-800">
          {!collapsed && (
            <div className="flex items-center space-x-2">
              <div className="bg-mohero-accent text-gray-900 p-1.5 rounded">
                <Menu size={18} />
              </div>
              <h1 className="text-xl font-semibold text-white">MoHero</h1>
            </div>
          )}
          {collapsed && (
            <div className="mx-auto bg-mohero-accent text-gray-900 p-1.5 rounded">
              <Menu size={18} />
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="ml-auto text-gray-400 hover:text-white p-1 rounded-full hover:bg-gray-800"
          >
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>

        {/* Navigation avec groupes */}
        <nav className="flex-1 py-4 px-3 overflow-y-auto">
          {menuGroups.map((group, groupIndex) => (
            <div key={groupIndex} className={`mb-6 ${collapsed ? 'text-center' : ''}`}>
              {!collapsed && (
                <p className="text-xs uppercase text-gray-400 font-medium mb-2 px-3">
                  {group.title}
                </p>
              )}
              {collapsed && <div className="h-px bg-gray-800 w-8 mx-auto mb-3"></div>}
              
              <ul className="space-y-1">
                {group.items.map((item) => (
                  <li key={item.path}>
                    <Link
                      to={item.path}
                      className={`flex items-center px-3 py-2.5 rounded-md transition-colors ${
                        isActive(item.path)
                          ? 'bg-gray-800 text-mohero-accent'
                          : 'text-gray-400 hover:text-white hover:bg-gray-800'
                      }`}
                    >
                      <div className="relative">
                        {item.icon}
                        {item.notification && (
                          <span className="absolute -top-1 -right-1 h-2 w-2 bg-mohero-accent rounded-full"></span>
                        )}
                      </div>
                      {!collapsed && <span className="ml-3">{item.label}</span>}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        {/* User */}
        <div className="p-4 border-t border-gray-800">
          <div className={`flex ${collapsed ? 'justify-center' : 'items-center'}`}>
            {!collapsed ? (
              <>
                <div className="h-8 w-8 bg-gray-700 rounded-full flex items-center justify-center text-mohero-accent font-medium">
                  TP
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-white">Tom Pandore</p>
                  <p className="text-xs text-gray-400">Admin</p>
                </div>
              </>
            ) : (
              <div className="h-8 w-8 bg-gray-700 rounded-full flex items-center justify-center text-mohero-accent font-medium">
                TP
              </div>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar; 