import React from 'react';
import { clans } from '../../data/mockData';

interface ClanBadgeProps {
  clanId: string;
  size?: 'sm' | 'md' | 'lg';
}

const ClanBadge: React.FC<ClanBadgeProps> = ({ clanId, size = 'md' }) => {
  const clan = clans.find(c => c.id === clanId);
  
  if (!clan) return null;
  
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-0.5',
    lg: 'text-base px-3 py-1'
  };
  
  const style = {
    backgroundColor: `${clan.color}20`,
    color: clan.color,
    borderColor: clan.color
  };
  
  return (
    <span 
      className={`inline-flex items-center rounded-full border ${sizeClasses[size]} font-medium`}
      style={style}
    >
      {clan.name}
    </span>
  );
};

export default ClanBadge;