import React from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { ClipboardList, CalendarClock, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

const ViewGrades: React.FC = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-800">My Grades</h2>
        </div>
        
        <div className="flex flex-col items-center justify-center py-16 px-4 bg-white rounded-lg shadow-sm border border-gray-100 text-center">
          <div className="mb-6 p-4 bg-[#f0f8f9] rounded-full">
            <ClipboardList className="h-12 w-12 text-[#1d7a85]" />
          </div>
          
          <h3 className="text-2xl font-semibold text-gray-800 mb-2">Grades Dashboard Coming Soon</h3>
          <p className="text-gray-500 max-w-lg mb-8">
            We're working on an enhanced grades experience that will provide detailed analytics, 
            grade history, and performance tracking across all your modules.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 mb-2 w-full max-w-md">
            <div className="flex-1 p-4 border border-gray-200 rounded-lg bg-gray-50">
              <div className="flex items-center mb-2">
                <CalendarClock className="h-5 w-5 text-[#1d7a85] mr-2" />
                <h4 className="font-medium text-gray-800">Expected Release</h4>
              </div>
              <p className="text-gray-600 text-sm">Summer Term 2025</p>
            </div>
            
            <div className="flex-1 p-4 border border-gray-200 rounded-lg bg-gray-50">
              <div className="flex items-center mb-2">
                <ClipboardList className="h-5 w-5 text-[#1d7a85] mr-2" />
                <h4 className="font-medium text-gray-800">Key Features</h4>
              </div>
              <p className="text-gray-600 text-sm">GPA tracking, grade history, and performance analytics</p>
            </div>
          </div>
          
          <Button 
            variant="outline" 
            className="mt-8 group hover:bg-[#1d7a85] hover:text-white transition-colors"
            onClick={() => window.history.back()}
          >
            Return to Dashboard
            <ChevronRight className="ml-2 h-4 w-4 group-hover:transform group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ViewGrades;
