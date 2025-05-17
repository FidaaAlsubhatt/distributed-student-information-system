import React from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Bell } from 'lucide-react';

const Notifications: React.FC = () => {

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold tracking-tight">Notifications</h1>
        </div>
        
        <Card className="border-2 border-dashed border-gray-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-amber-500" />
              Notification System
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center py-10">
            <div className="text-center space-y-3 max-w-lg">
              <h3 className="text-xl font-medium text-gray-900">Feature Under Development</h3>
              <p className="text-gray-500">
                The notification system is currently under development. This feature will provide real-time
                alerts for important academic events, assignment deadlines, grade releases, and administrative
                announcements with customizable preferences.
              </p>
              <div className="text-sm text-gray-400 mt-2">
                Expected release: August 2025
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Notifications;
