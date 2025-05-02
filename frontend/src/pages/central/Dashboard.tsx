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

// Mock data for charts
const enrollmentTrends = [
  { year: '2019', students: 12400 },
  { year: '2020', students: 13200 },
  { year: '2021', students: 14500 },
  { year: '2022', students: 15800 },
  { year: '2023', students: 17200 },
  { year: '2024', students: 18500 },
];

const departmentComparison = [
  { name: 'Computer Science', students: 3250, staff: 125 },
  { name: 'Business', students: 3850, staff: 155 },
  { name: 'Engineering', students: 3550, staff: 145 },
  { name: 'Medicine', students: 2950, staff: 180 },
  { name: 'Arts & Humanities', students: 2650, staff: 135 },
  { name: 'Sciences', students: 2250, staff: 120 },
];

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
        
        {/* Charts Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <DashboardCard
            title="Enrollment Trends"
            headerClassName="border-b"
          >
            <div className="pt-4 h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={enrollmentTrends}
                  margin={{
                    top: 10,
                    right: 10,
                    left: 0,
                    bottom: 0,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="year" />
                  <YAxis />
                  <Tooltip />
                  <Area type="monotone" dataKey="students" stroke="#8884d8" fillOpacity={0.3} fill="#8884d8" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </DashboardCard>
          
          <DashboardCard
            title="Department Comparison"
            headerClassName="border-b"
          >
            <div className="pt-4 h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={departmentComparison}
                  margin={{
                    top: 10,
                    right: 10,
                    left: 0,
                    bottom: 0,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="students" name="Students" fill="#8884d8" />
                  <Bar dataKey="staff" name="Staff" fill="#82ca9d" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </DashboardCard>
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
        
        {/* Notifications & Demographics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <DashboardCard 
            title="Recent Notifications" 
            footerLink={{ url: '/notifications', text: 'View All Notifications' }}
          >
            <div className="space-y-4 mt-2">
              {notifications.slice(0, 3).map((notification) => (
                <NotificationItem 
                  key={notification.id} 
                  notification={notification} 
                />
              ))}
            </div>
          </DashboardCard>
          
          <Card>
            <CardHeader>
              <CardTitle>Student Demographics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[250px] flex items-center">
                <ResponsiveContainer width="50%" height="100%">
                  <PieChart>
                    <Pie
                      data={genderDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={renderCustomizedLabel}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {genderDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2">
                  <h3 className="font-medium text-gray-800">Gender Distribution</h3>
                  {genderDistribution.map((item, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: colors[index % colors.length] }}
                      ></div>
                      <span className="text-sm text-gray-700">{item.name}: {item.value}%</span>
                    </div>
                  ))}
                  <div className="pt-4">
                    <Button variant="outline" size="sm">View Full Demographics</Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Additional Metrics */}
        <Card>
          <CardHeader className="pb-0">
            <CardTitle>Key Performance Indicators</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-full bg-blue-100 text-blue-600">
                    <Award className="h-5 w-5" />
                  </div>
                  <span className="text-sm font-medium text-gray-500">Graduation Rate</span>
                </div>
                <div className="pl-10">
                  <div className="text-2xl font-bold">92%</div>
                  <div className="text-sm text-green-600">↑ 2.5% from previous year</div>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-full bg-green-100 text-green-600">
                    <Users className="h-5 w-5" />
                  </div>
                  <span className="text-sm font-medium text-gray-500">Student-Faculty Ratio</span>
                </div>
                <div className="pl-10">
                  <div className="text-2xl font-bold">14:1</div>
                  <div className="text-sm text-gray-500">No change from last year</div>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-full bg-purple-100 text-purple-600">
                    <History className="h-5 w-5" />
                  </div>
                  <span className="text-sm font-medium text-gray-500">Retention Rate</span>
                </div>
                <div className="pl-10">
                  <div className="text-2xl font-bold">88%</div>
                  <div className="text-sm text-green-600">↑ 1.2% from previous year</div>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-full bg-amber-100 text-amber-600">
                    <Building className="h-5 w-5" />
                  </div>
                  <span className="text-sm font-medium text-gray-500">New Enrollments</span>
                </div>
                <div className="pl-10">
                  <div className="text-2xl font-bold">4,250</div>
                  <div className="text-sm text-green-600">↑ 350 from previous year</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default CentralDashboard;