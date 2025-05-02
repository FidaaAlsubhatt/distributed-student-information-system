import React, { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  AreaChart, 
  BarChart, 
  PieChart,
  ResponsiveContainer, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip,
  Bar,
  Pie,
  Cell,
  Legend,
  TooltipProps 
} from 'recharts';
import { Download, Filter, FileText } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import TableList from '@/components/dashboard/TableList';
import { modules } from '@/data/mockData';

// Mock data for reports
const enrollmentTrends = [
  { month: 'Jan', count: 120 },
  { month: 'Feb', count: 140 },
  { month: 'Mar', count: 190 },
  { month: 'Apr', count: 210 },
  { month: 'May', count: 220 },
  { month: 'Jun', count: 170 },
  { month: 'Jul', count: 180 },
  { month: 'Aug', count: 240 },
  { month: 'Sep', count: 250 },
  { month: 'Oct', count: 280 },
  { month: 'Nov', count: 240 },
  { month: 'Dec', count: 230 },
];

const gradeDistribution = [
  { name: 'A', value: 15 },
  { name: 'B+', value: 22 },
  { name: 'B', value: 27 },
  { name: 'C+', value: 18 },
  { name: 'C', value: 12 },
  { name: 'D', value: 4 },
  { name: 'F', value: 2 },
];

const modulePerformance = modules.map(module => ({
  name: module.code,
  avgGrade: (Math.random() * 1.5 + 2.5).toFixed(2), // Random GPA between 2.5 and 4.0
  passRate: Math.floor(Math.random() * 20 + 80), // Random pass rate between 80% and 100%
  students: Math.floor(Math.random() * 70 + 30), // Random number of students between 30 and 100
}));

const yearlyComparison = [
  { year: '2020', avgGPA: 3.2, passRate: 85, retention: 88 },
  { year: '2021', avgGPA: 3.3, passRate: 86, retention: 90 },
  { year: '2022', avgGPA: 3.4, passRate: 87, retention: 91 },
  { year: '2023', avgGPA: 3.3, passRate: 88, retention: 92 },
  { year: '2024', avgGPA: 3.5, passRate: 90, retention: 93 },
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

const DepartmentReports: React.FC = () => {
  const [timeFrame, setTimeFrame] = useState('all');
  
  // Module performance columns
  const moduleColumns = [
    {
      key: 'name',
      header: 'Module Code',
      cell: (module: typeof modulePerformance[0]) => (
        <div className="font-medium text-gray-900">{module.name}</div>
      )
    },
    {
      key: 'students',
      header: 'Students',
      cell: (module: typeof modulePerformance[0]) => (
        <div className="text-gray-700">{module.students}</div>
      )
    },
    {
      key: 'avgGrade',
      header: 'Avg. GPA',
      cell: (module: typeof modulePerformance[0]) => (
        <div className="text-gray-700 font-medium">{module.avgGrade}</div>
      )
    },
    {
      key: 'passRate',
      header: 'Pass Rate',
      cell: (module: typeof modulePerformance[0]) => {
        let badgeClass = '';
        
        if (module.passRate >= 90) {
          badgeClass = 'bg-green-100 text-green-800 border-green-200';
        } else if (module.passRate >= 80) {
          badgeClass = 'bg-blue-100 text-blue-800 border-blue-200';
        } else {
          badgeClass = 'bg-yellow-100 text-yellow-800 border-yellow-200';
        }
        
        return (
          <Badge variant="outline" className={badgeClass}>
            {module.passRate}%
          </Badge>
        );
      }
    }
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Department Reports</h2>
            <p className="text-gray-500 mt-1">Performance analytics and data for Computer Science Department</p>
          </div>
          <div className="flex items-center gap-3">
            <Select defaultValue={timeFrame} onValueChange={setTimeFrame}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select time frame" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="year">This Year</SelectItem>
                <SelectItem value="semester">This Semester</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export Data
            </Button>
          </div>
        </div>
        
        {/* Performance Overview Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Average GPA</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">3.4/4.0</div>
              <p className="text-sm text-gray-500 flex items-center mt-1">
                <span className="text-green-600">↑ 0.2</span> &nbsp;from previous {timeFrame === 'semester' ? 'semester' : 'year'}
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Pass Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">87%</div>
              <p className="text-sm text-gray-500 flex items-center mt-1">
                <span className="text-green-600">↑ 2%</span> &nbsp;from previous {timeFrame === 'semester' ? 'semester' : 'year'}
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Retention Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-600">92%</div>
              <p className="text-sm text-gray-500 flex items-center mt-1">
                <span className="text-green-600">↑ 1%</span> &nbsp;from previous {timeFrame === 'semester' ? 'semester' : 'year'}
              </p>
            </CardContent>
          </Card>
        </div>
        
        {/* Detailed Reports Tabs */}
        <Tabs defaultValue="performance">
          <TabsList className="mb-4">
            <TabsTrigger value="performance">Module Performance</TabsTrigger>
            <TabsTrigger value="enrollment">Enrollment Trends</TabsTrigger>
            <TabsTrigger value="grades">Grade Distribution</TabsTrigger>
            <TabsTrigger value="yearly">Yearly Comparison</TabsTrigger>
          </TabsList>
          
          <TabsContent value="performance" className="m-0">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Module Performance</CardTitle>
                    <CardDescription>Performance metrics for all modules in the department</CardDescription>
                  </div>
                  <Button variant="outline" size="sm">
                    <Filter className="h-4 w-4 mr-2" />
                    Filter
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <TableList
                  columns={moduleColumns}
                  data={modulePerformance}
                />
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="enrollment" className="m-0">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Enrollment Trends</CardTitle>
                    <CardDescription>Monthly enrollment statistics over the past year</CardDescription>
                  </div>
                  <Button variant="outline" size="sm">
                    <FileText className="h-4 w-4 mr-2" />
                    Full Report
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={enrollmentTrends}
                      margin={{
                        top: 10,
                        right: 30,
                        left: 0,
                        bottom: 0,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Area type="monotone" dataKey="count" stroke="#8884d8" fillOpacity={0.3} fill="#8884d8" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="grades" className="m-0">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Grade Distribution</CardTitle>
                    <CardDescription>Breakdown of grades across all modules</CardDescription>
                  </div>
                  <Button variant="outline" size="sm">
                    <FileText className="h-4 w-4 mr-2" />
                    Full Report
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-[400px] flex justify-center">
                  <ResponsiveContainer width="70%" height="100%">
                    <PieChart>
                      <Pie
                        data={gradeDistribution}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={renderCustomizedLabel}
                        outerRadius={150}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {gradeDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="yearly" className="m-0">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Yearly Comparison</CardTitle>
                    <CardDescription>Performance trends over the past 5 years</CardDescription>
                  </div>
                  <Button variant="outline" size="sm">
                    <FileText className="h-4 w-4 mr-2" />
                    Full Report
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={yearlyComparison}
                      margin={{
                        top: 20,
                        right: 30,
                        left: 20,
                        bottom: 5,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="year" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="avgGPA" name="Avg. GPA" fill="#8884d8" />
                      <Bar dataKey="passRate" name="Pass Rate %" fill="#82ca9d" />
                      <Bar dataKey="retention" name="Retention %" fill="#ffc658" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        
        {/* Additional Reports Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Reports</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="font-medium">End of Semester Report</p>
                      <p className="text-sm text-gray-500">Spring 2024</p>
                    </div>
                  </div>
                  <Badge>PDF</Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="font-medium">Student Performance Analysis</p>
                      <p className="text-sm text-gray-500">2023-2024</p>
                    </div>
                  </div>
                  <Badge>Excel</Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-purple-600" />
                    <div>
                      <p className="font-medium">Enrollment Statistics</p>
                      <p className="text-sm text-gray-500">2024 Q1</p>
                    </div>
                  </div>
                  <Badge>PDF</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Generate Custom Report</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-1 block">Report Type</label>
                    <Select defaultValue="performance">
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select report type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="performance">Performance Report</SelectItem>
                        <SelectItem value="enrollment">Enrollment Report</SelectItem>
                        <SelectItem value="grades">Grade Distribution</SelectItem>
                        <SelectItem value="retention">Retention Analysis</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Time Period</label>
                    <Select defaultValue="semester">
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select time period" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="semester">Current Semester</SelectItem>
                        <SelectItem value="year">Current Year</SelectItem>
                        <SelectItem value="custom">Custom Range</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">File Format</label>
                    <Select defaultValue="pdf">
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select format" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pdf">PDF Document</SelectItem>
                        <SelectItem value="excel">Excel Spreadsheet</SelectItem>
                        <SelectItem value="csv">CSV File</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Include Charts</label>
                    <Select defaultValue="yes">
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Include charts?" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="yes">Yes</SelectItem>
                        <SelectItem value="no">No</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button className="w-full">Generate Report</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default DepartmentReports;