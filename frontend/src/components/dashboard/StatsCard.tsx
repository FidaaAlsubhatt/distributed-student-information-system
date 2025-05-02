import React from 'react';
import { Card } from '@/components/ui/card';
import { 
  AlertCircle, 
  BarChart4, 
  BookOpen, 
  Calendar, 
  Clock, 
  GraduationCap,
  Users, 
  Award,
  Boxes, 
  Building, 
  Landmark, 
  School
} from 'lucide-react';
import { StatsCardProps } from '@/types';

interface StatCardComponentProps extends StatsCardProps {
  className?: string;
}

const StatsCard: React.FC<StatCardComponentProps> = ({
  icon,
  label,
  value,
  bgColor,
  textColor,
  trend,
  className = '',
}) => {
  // Get the icon component based on the icon name
  const getIcon = () => {
    switch (icon) {
      case 'BarChart4':
        return <BarChart4 size={20} />;
      case 'BookOpen':
        return <BookOpen size={20} />;
      case 'Calendar':
        return <Calendar size={20} />;
      case 'Clock':
        return <Clock size={20} />;
      case 'GraduationCap':
        return <GraduationCap size={20} />;
      case 'Users':
        return <Users size={20} />;
      case 'Award':
        return <Award size={20} />;
      case 'Boxes':
        return <Boxes size={20} />;
      case 'Building':
        return <Building size={20} />;
      case 'Landmark':
        return <Landmark size={20} />;
      case 'School':
        return <School size={20} />;
      default:
        return <AlertCircle size={20} />;
    }
  };

  return (
    <Card className={`p-5 shadow-sm rounded-lg ${className}`}>
      <div className="flex items-center">
        <div className={`p-2.5 rounded-full ${bgColor} ${textColor} mr-4`}>
          {getIcon()}
        </div>
        <div>
          <p className="text-sm text-gray-500 font-normal">{label}</p>
          <p className="text-xl font-semibold text-gray-800">{value}</p>
          {trend && (
            <p className={`text-xs ${getTrendColor(trend.direction)} flex items-center gap-0.5`}>
              {trend.value}
              {trend.direction === 'up' && (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-green-600">
                  <path d="M12 4L20 12L18.6 13.4L13 7.8V20H11V7.8L5.4 13.4L4 12L12 4Z" fill="currentColor"/>
                </svg>
              )}
              {trend.direction === 'down' && (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-red-600">
                  <path d="M12 20L4 12L5.4 10.6L11 16.2V4H13V16.2L18.6 10.6L20 12L12 20Z" fill="currentColor"/>
                </svg>
              )}
            </p>
          )}
        </div>
      </div>
    </Card>
  );
};

const getTrendColor = (direction: 'up' | 'down' | 'neutral') => {
  switch (direction) {
    case 'up':
      return 'text-green-600';
    case 'down':
      return 'text-red-600';
    case 'neutral':
      return 'text-gray-600';
    default:
      return 'text-gray-600';
  }
};

export default StatsCard;
