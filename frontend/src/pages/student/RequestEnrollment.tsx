import React from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import EnrollmentForm from '@/components/forms/EnrollmentForm';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

const RequestEnrollment: React.FC = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/modules">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h2 className="text-2xl font-bold text-gray-800">Request Module Enrollment</h2>
        </div>
        
        <div className="max-w-3xl mx-auto">
          <p className="text-gray-600 mb-6">
            Fill out the form below to request enrollment in a new module. Your request will be reviewed by the department administrator.
          </p>
          
          <EnrollmentForm />
          
          <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-md p-4">
            <h4 className="text-sm font-semibold text-yellow-800 mb-2">Important Notes:</h4>
            <ul className="text-sm text-yellow-700 list-disc list-inside space-y-1">
              <li>Enrollment requests may take up to 3 business days to process.</li>
              <li>You must meet all prerequisites for the requested module.</li>
              <li>If approved, you will be notified via email and the system's notification center.</li>
              <li>Some modules may have limited capacity and will be filled on a first-come, first-served basis.</li>
            </ul>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default RequestEnrollment;
