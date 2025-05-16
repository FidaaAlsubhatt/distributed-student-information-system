import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import TableList from '@/components/dashboard/TableList';
import { getExams } from '@/services/api/staff';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';

interface Exam {
  id: string;
  title: string;
  module_code: string;
  module_name: string;
  exam_type: string;
  exam_date: string;
  start_time: string;
  duration: string;
}

const ManageExams: React.FC = () => {
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);

  // 1. Fetch exams on mount
  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const data = await getExams();
        setExams(data);
      } catch (err) {
        console.error('Failed to load exams', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // 2. Define columns for TableList
  const columns = [
    {
      key: 'module',
      header: 'Module',
      cell: (exam: Exam) => (
        <div>
          <div className="font-medium">{exam.module_code}</div>
          <div className="text-sm text-muted-foreground">{exam.module_name}</div>
        </div>
      ),
    },
    {
      key: 'title',
      header: 'Exam Title',
      cell: (exam: Exam) => (
        <div>
          <div className="font-medium">{exam.title}</div>
          <Badge variant="outline" className="mt-1">
            {exam.exam_type}
          </Badge>
        </div>
      ),
    },
    {
      key: 'date',
      header: 'Date',
      cell: (exam: Exam) => (
        <div className="font-medium">
          {format(new Date(exam.exam_date), 'PPP')}
        </div>
      ),
    },
    {
      key: 'time',
      header: 'Time',
      cell: (exam: Exam) => (
        <div className="font-medium">
          {exam.start_time} ({exam.duration})
        </div>
      ),
    },
  ];

  // 3. Render
  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Manage Exams</h1>
      </div>

      <TableList
        data={exams}
        columns={columns}
        loading={loading}
      />
    </DashboardLayout>
  );
};

export default ManageExams;
