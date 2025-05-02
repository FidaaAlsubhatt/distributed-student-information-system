import React from 'react';
import { InfoIcon, CheckCircleIcon, AlertTriangleIcon, AlertCircleIcon } from 'lucide-react';
import { Notification } from '@/types';

interface NotificationItemProps {
  notification: Notification;
  onClick?: () => void;
}

const NotificationItem: React.FC<NotificationItemProps> = ({ notification, onClick }) => {
  const { type, title, message, time } = notification;

  const getIconDetails = () => {
    switch (type) {
      case 'info':
        return {
          Icon: InfoIcon,
          bgColor: 'bg-[#e6f3f4]',
          textColor: 'text-[#1d7a85]'
        };
      case 'success':
        return {
          Icon: CheckCircleIcon,
          bgColor: 'bg-green-50',
          textColor: 'text-green-600'
        };
      case 'warning':
        return {
          Icon: AlertTriangleIcon,
          bgColor: 'bg-amber-50',
          textColor: 'text-amber-600'
        };
      case 'error':
        return {
          Icon: AlertCircleIcon,
          bgColor: 'bg-red-50',
          textColor: 'text-red-600'
        };
      default:
        return {
          Icon: InfoIcon,
          bgColor: 'bg-[#e6f3f4]',
          textColor: 'text-[#1d7a85]'
        };
    }
  };

  const { Icon, bgColor, textColor } = getIconDetails();

  return (
    <div className="block px-4 py-2.5 hover:bg-gray-50 border-b last:border-b-0 cursor-pointer" onClick={onClick}>
      <div className="flex">
        <div className="flex-shrink-0 mr-3">
          <div className={`h-8 w-8 rounded-full ${bgColor} flex items-center justify-center`}>
            <Icon className={`h-4 w-4 ${textColor}`} />
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-800 truncate">{title}</p>
          <p className="text-xs text-gray-500 line-clamp-1">{message}</p>
          <p className="text-xs text-gray-400 mt-0.5">{time}</p>
        </div>
      </div>
    </div>
  );
};

export default NotificationItem;
