
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, CalendarDays, PlusCircle, User } from 'lucide-react';
import { useApp } from '../context/AppContext';

const BottomNav: React.FC = () => {
  const location = useLocation();
  const { t } = useApp();
  
  const isActive = (path: string) => location.pathname === path;
  
  const navItems = [
    { path: '/', icon: LayoutDashboard, label: t('nav.home') },
    { path: '/calendar', icon: CalendarDays, label: t('nav.calendar') },
    { path: '/add', icon: PlusCircle, label: t('nav.add') },
    { path: '/profile', icon: User, label: t('nav.profile') },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-3 pb-safe">
      <div className="flex justify-between items-center max-w-md mx-auto">
        {navItems.map((item) => (
          <Link 
            key={item.path} 
            to={item.path}
            className={`flex flex-col items-center space-y-1 ${isActive(item.path) ? 'text-primary' : 'text-gray-400'}`}
          >
            <item.icon size={24} strokeWidth={isActive(item.path) ? 2.5 : 2} />
            <span className="text-xs font-medium">{item.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default BottomNav;
