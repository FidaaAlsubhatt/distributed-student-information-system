import React from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import DashboardCard from '@/components/dashboard/DashboardCard';
import StatsCard from '@/components/dashboard/StatsCard';
import NotificationItem from '@/components/dashboard/NotificationItem';
import TableList from '@/components/dashboard/TableList';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { centralStats, notifications, departments, systemHealth } from '@/data/mockData';
import { Badge } from '@/components/ui/badge';
import { 
  AreaChart, 
  BarChart, 
  ResponsiveContainer, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip,
  Bar,
  Cell,
  PieChart,
  Pie,
  TooltipProps 
} from 'recharts';
import { Building, Lock, Shield, Users, Award, History, Settings } from 'lucide-react';

const genderDistribution = [
  { name: 'Male', value: 52 },
  { name: 'Female', value: 47 },
  { name: 'Non-Binary', value: 1 },
];

const colors = [
  '#8884d8', '#83a6ed', '#8dd1e1', '#82ca9d', '#a4de6c', '#d0ed57', '#ffc658', '#ff8a65'
];

const RADIAN = Math.PI / 180;
const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index }: any) => {
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central">
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

const CentralDashboard: React.FC = () => {
  // Department columns
  const departmentColumns = [
    {
      key: 'name',
      header: 'Department',
      cell: (department: typeof departments[0]) => (
        <div className="font-medium text-gray-900">{department.name}</div>
      )
    },
    {
      key: 'students',
      header: 'Students',
      cell: (department: typeof departments[0]) => (
        <div className="text-gray-700">{department.students}</div>
      )
    },
    {
      key: 'staff',
      header: 'Staff',
      cell: (department: typeof departments[0]) => (
        <div className="text-gray-700">{department.staff}</div>
      )
    },
    {
      key: 'avgGpa',
      header: 'Avg. GPA',
      cell: (department: typeof departments[0]) => (
        <div className="text-gray-700 font-medium">{department.avgGpa.toFixed(1)}</div>
      )
    },
    {
      key: 'trend',
      header: 'Trend',
      cell: (department: typeof departments[0]) => {
        const trendColor = department.trend.direction === 'up' 
          ? 'text-green-600' 
          : department.trend.direction === 'down'
            ? 'text-red-600'
            : 'text-gray-600';
        
        const trendSymbol = department.trend.direction === 'up'
          ? '↑'
          : department.trend.direction === 'down'
            ? '↓'
            : '→';
        
        return (
          <div className={`flex items-center ${trendColor}`}>
            <span>{trendSymbol}</span>
            <span className="ml-1">{department.trend.value}</span>
          </div>
        );
      }
    }
  ];
  
  // System health columns
  const systemColumns = [
    {
      key: 'name',
      header: 'System',
      cell: (system: typeof systemHealth[0]) => (
        <div>
          <div className="font-medium text-gray-900">{system.name}</div>
          <div className="text-sm text-gray-500">{system.description}</div>
        </div>
      )
    },
    {
      key: 'status',
      header: 'Status',
      cell: (system: typeof systemHealth[0]) => {
        let badgeClass = '';
        let statusText = '';
        
        switch (system.status) {
          case 'healthy':
            badgeClass = 'bg-green-100 text-green-800 border-green-200';
            statusText = 'Healthy';
            break;
          case 'warning':
            badgeClass = 'bg-yellow-100 text-yellow-800 border-yellow-200';
            statusText = 'Warning';
            break;
          case 'alert':
            badgeClass = 'bg-red-100 text-red-800 border-red-200';
            statusText = 'Alert';
            break;
        }
        
        return (
          <Badge variant="outline" className={badgeClass}>
            {statusText}
          </Badge>
        );
      }
    },
    {
      key: 'actions',
      header: 'Actions',
      cell: (system: typeof systemHealth[0]) => (
        <div className="flex justify-end">
          <Button variant="ghost" size="sm">
            <History className="h-4 w-4 mr-2" />
            View Logs
          </Button>
          <Button variant="ghost" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Configure
          </Button>
        </div>
      )
    }
  ];
  
  return (
    <DashboardLayout>
      <div className="flex flex-col space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Central Administration Dashboard</h2>
          <p className="text-gray-500 mt-1">University-wide management and monitoring</p>
        </div>
        
        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {centralStats.map((stat, index) => (
            <StatsCard key={index} {...stat} />
          ))}
        </div>
        

        
        {/* Quick Actions */}
        <DashboardCard title="Quick Actions">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2">
            <Button variant="outline" className="h-auto py-6 flex flex-col items-center" asChild>
              <Link href="/manage-dept-admins">
                <Building className="h-6 w-6 mb-2 text-blue-600" />
                <span>Manage Departments</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto py-6 flex flex-col items-center" asChild>
              <Link href="/user-access">
                <Lock className="h-6 w-6 mb-2 text-green-600" />
                <span>User Access</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto py-6 flex flex-col items-center" asChild>
              <Link href="/system-logs">
                <Shield className="h-6 w-6 mb-2 text-purple-600" />
                <span>Security Monitoring</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto py-6 flex flex-col items-center" asChild>
              <Link href="/institution-reports">
                <Award className="h-6 w-6 mb-2 text-amber-600" />
                <span>Institution Reports</span>
              </Link>
            </Button>
          </div>
        </DashboardCard>
        
        {/* Departments & System Health */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <DashboardCard 
            title="Department Overview" 
            footerLink={{ url: '/manage-dept-admins', text: 'Manage Departments' }}
          >
            <div className="mt-2">
              <TableList 
                columns={departmentColumns}
                data={departments.slice(0, 4)}
              />
            </div>
          </DashboardCard>
          
          <DashboardCard 
            title="System Health" 
            footerLink={{ url: '/system-logs', text: 'View All Systems' }}
          >
            <div className="mt-2">
              <TableList 
                columns={systemColumns}
                data={systemHealth.slice(0, 4)}
              />
            </div>
          </DashboardCard>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default CentralDashboard;