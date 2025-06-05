import React from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen } from 'lucide-react';

const DepartmentDashboard: React.FC = () => {
  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold tracking-tight">Department Dashboard</h1>
        </div>
        <Card className="border-2 border-dashed border-gray-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-green-600" />
              Department Admin Dashboard
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center py-10">
            <div className="text-center space-y-3 max-w-lg">
              <h3 className="text-xl font-medium text-gray-900">Feature Under Development</h3>
              <p className="text-gray-500">
                The department dashboard is currently under development. Soon, this page will provide real-time departmental analytics, student and staff insights, and quick management actions.
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

export default DepartmentDashboard;