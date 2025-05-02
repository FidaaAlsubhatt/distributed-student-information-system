import React, { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import TableList from '@/components/dashboard/TableList';
import { departments } from '@/data/mockData';
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
  Cell,
  Pie,
  Legend,
  TooltipProps
} from 'recharts';
import {
  Download,
  Filter,
  FileText,
  Share2,
  Calendar,
  Printer,
  BarChart2,
  Globe,
  UserCheck,
  Zap,
  BarChart4
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

// Mock data for reports
const enrollmentByYear = [
  { year: '2019', undergraduate: 12400, graduate: 5200, total: 17600 },
  { year: '2020', undergraduate: 13200, graduate: 5400, total: 18600 },
  { year: '2021', undergraduate: 14500, graduate: 5600, total: 20100 },
  { year: '2022', undergraduate: 15800, graduate: 5800, total: 21600 },
  { year: '2023', undergraduate: 17200, graduate: 6000, total: 23200 },
  { year: '2024', undergraduate: 18500, graduate: 6200, total: 24700 },
];

const retentionRates = [
  { year: '2019', rate: 86 },
  { year: '2020', rate: 87 },
  { year: '2021', rate: 88 },
  { year: '2022', rate: 90 },
  { year: '2023', rate: 91 },
  { year: '2024', rate: 92 },
];

const graduationRates = [
  { year: '2019', rate: 78 },
  { year: '2020', rate: 79 },
  { year: '2021', rate: 81 },
  { year: '2022', rate: 84 },
  { year: '2023', rate: 87 },
  { year: '2024', rate: 89 },
];

const internationalStudents = [
  { region: 'Asia', count: 2450 },
  { region: 'Europe', count: 1850 },
  { region: 'North America', count: 720 },
  { region: 'South America', count: 580 },
  { region: 'Africa', count: 920 },
  { region: 'Oceania', count: 380 },
];

const departmentPerformance = departments.map(dept => ({
  name: dept.name,
  avgGpa: dept.avgGpa,
  passingRate: Math.floor(Math.random() * 10) + 85, // Random pass rate between 85% and 95%
  retentionRate: Math.floor(Math.random() * 10) + 85, // Random retention rate between 85% and 95%
  graduationRate: Math.floor(Math.random() * 15) + 80, // Random graduation rate between 80% and 95%
}));

const employmentRates = [
  { year: 'Within 3 months', rate: 65 },
  { year: 'Within 6 months', rate: 78 },
  { year: 'Within 12 months', rate: 89 },
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

const InstitutionReports: React.FC = () => {
  const [timeFrame, setTimeFrame] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Filter departments based on search
  const filteredDepartments = departmentPerformance.filter(dept => 
    !searchTerm || 
    dept.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  // Department performance columns
  const departmentColumns = [
    {
      key: 'name',
      header: 'Department',
      cell: (dept: typeof departmentPerformance[0]) => (
        <div className="font-medium text-gray-900">{dept.name}</div>
      )
    },
    {
      key: 'avgGpa',
      header: 'Avg. GPA',
      cell: (dept: typeof departmentPerformance[0]) => (
        <div className="text-gray-700">{dept.avgGpa.toFixed(1)}/4.0</div>
      )
    },
    {
      key: 'passingRate',
      header: 'Passing Rate',
      cell: (dept: typeof departmentPerformance[0]) => {
        let badgeClass = '';
        
        if (dept.passingRate >= 90) {
          badgeClass = 'bg-green-100 text-green-800 border-green-200';
        } else if (dept.passingRate >= 85) {
          badgeClass = 'bg-blue-100 text-blue-800 border-blue-200';
        } else {
          badgeClass = 'bg-yellow-100 text-yellow-800 border-yellow-200';
        }
        
        return (
          <Badge variant="outline" className={badgeClass}>
            {dept.passingRate}%
          </Badge>
        );
      }
    },
    {
      key: 'retentionRate',
      header: 'Retention',
      cell: (dept: typeof departmentPerformance[0]) => (
        <div className="text-gray-700">{dept.retentionRate}%</div>
      )
    },
    {
      key: 'graduationRate',
      header: 'Graduation',
      cell: (dept: typeof departmentPerformance[0]) => (
        <div className="text-gray-700">{dept.graduationRate}%</div>
      )
    },
    {
      key: 'actions',
      header: '',
      cell: (dept: typeof departmentPerformance[0]) => (
        <div className="flex justify-end">
          <Button variant="ghost" size="sm">
            <BarChart2 className="h-4 w-4 mr-2" />
            Details
          </Button>
        </div>
      )
    }
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Institution Reports</h2>
            <p className="text-gray-500 mt-1">University-wide performance analytics and metrics</p>
          </div>
          <div className="flex items-center gap-3">
            <Select defaultValue={timeFrame} onValueChange={setTimeFrame}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select time frame" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="5years">Last 5 Years</SelectItem>
                <SelectItem value="year">This Year</SelectItem>
                <SelectItem value="semester">This Semester</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button variant="outline">
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
          </div>
        </div>
        
        {/* Key Performance Indicators */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="relative overflow-hidden">
            <div className="absolute top-0 right-0 p-2">
              <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
                ↑ 2.5%
              </Badge>
            </div>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Total Students</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">24,700</div>
              <p className="text-sm text-gray-500">2024 Academic Year</p>
            </CardContent>
          </Card>
          
          <Card className="relative overflow-hidden">
            <div className="absolute top-0 right-0 p-2">
              <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
                ↑ 1.0%
              </Badge>
            </div>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Retention Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">92%</div>
              <p className="text-sm text-gray-500">Year-over-year</p>
            </CardContent>
          </Card>
          
          <Card className="relative overflow-hidden">
            <div className="absolute top-0 right-0 p-2">
              <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
                ↑ 2.0%
              </Badge>
            </div>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Graduation Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">89%</div>
              <p className="text-sm text-gray-500">4-year completion</p>
            </CardContent>
          </Card>
          
          <Card className="relative overflow-hidden">
            <div className="absolute top-0 right-0 p-2">
              <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
                ↑ 0.1
              </Badge>
            </div>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Average GPA</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">3.4</div>
              <p className="text-sm text-gray-500">University-wide</p>
            </CardContent>
          </Card>
        </div>
        
        {/* Report Tabs */}
        <Tabs defaultValue="enrollment">
          <TabsList className="mb-4">
            <TabsTrigger value="enrollment">Enrollment</TabsTrigger>
            <TabsTrigger value="performance">Academic Performance</TabsTrigger>
            <TabsTrigger value="demographics">Demographics</TabsTrigger>
            <TabsTrigger value="outcomes">Student Outcomes</TabsTrigger>
          </TabsList>
          
          <TabsContent value="enrollment" className="m-0 space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Enrollment Trends</CardTitle>
                    <CardDescription>Student enrollment over the past 6 years</CardDescription>
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
                      data={enrollmentByYear}
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
                      <Bar dataKey="undergraduate" name="Undergraduate" stackId="a" fill="#8884d8" />
                      <Bar dataKey="graduate" name="Graduate" stackId="a" fill="#82ca9d" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Enrollment by Department</CardTitle>
                  <CardDescription>Student distribution across departments</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={departments}
                        margin={{
                          top: 20,
                          right: 30,
                          left: 20,
                          bottom: 70,
                        }}
                        layout="vertical"
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" />
                        <YAxis type="category" dataKey="name" width={100} />
                        <Tooltip />
                        <Bar dataKey="students" fill="#8884d8" name="Students" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>International Students</CardTitle>
                  <CardDescription>Distribution by region of origin</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px] flex justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={internationalStudents}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={renderCustomizedLabel}
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="count"
                          nameKey="region"
                        >
                          {internationalStudents.map((entry, index) => (
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
            </div>
            
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 rounded-full bg-blue-100 text-blue-600">
                  <Globe className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-lg font-medium">International Recruitment Strategy</h3>
                  <p className="text-gray-500">Target regions and growth initiatives</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Key Growth Regions</h4>
                  <ul className="text-sm space-y-1">
                    <li className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                      South East Asia: 15% annual growth
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-green-600"></span>
                      South America: 12% annual growth
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-purple-600"></span>
                      Africa: 18% annual growth
                    </li>
                  </ul>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Scholarship Programs</h4>
                  <ul className="text-sm space-y-1">
                    <li className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                      Global Leadership: 50 scholarships
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-green-600"></span>
                      Emerging Nations: 75 scholarships
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-purple-600"></span>
                      Research Excellence: 30 scholarships
                    </li>
                  </ul>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Partner Institutions</h4>
                  <ul className="text-sm space-y-1">
                    <li className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                      Asia: 18 partner universities
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-green-600"></span>
                      Europe: 23 partner universities
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-purple-600"></span>
                      Americas: 15 partner universities
                    </li>
                  </ul>
                </div>
              </div>
            </Card>
          </TabsContent>
          
          <TabsContent value="performance" className="m-0 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Retention Rates</CardTitle>
                  <CardDescription>Year-over-year student retention</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={retentionRates}
                        margin={{
                          top: 10,
                          right: 30,
                          left: 0,
                          bottom: 0,
                        }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="year" />
                        <YAxis domain={[80, 100]} />
                        <Tooltip />
                        <Area type="monotone" dataKey="rate" stroke="#8884d8" fillOpacity={0.3} fill="#8884d8" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Graduation Rates</CardTitle>
                  <CardDescription>4-year completion rates</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={graduationRates}
                        margin={{
                          top: 10,
                          right: 30,
                          left: 0,
                          bottom: 0,
                        }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="year" />
                        <YAxis domain={[70, 100]} />
                        <Tooltip />
                        <Area type="monotone" dataKey="rate" stroke="#82ca9d" fillOpacity={0.3} fill="#82ca9d" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Department Performance Comparison</CardTitle>
                    <CardDescription>Academic metrics across departments</CardDescription>
                  </div>
                  <div className="relative w-64">
                    <Input
                      placeholder="Search departments..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <TableList
                  columns={departmentColumns}
                  data={filteredDepartments}
                />
              </CardContent>
            </Card>
            
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 rounded-full bg-green-100 text-green-600">
                  <Zap className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-lg font-medium">Performance Improvement Initiatives</h3>
                  <p className="text-gray-500">Programs to enhance academic outcomes</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Early Intervention</h4>
                  <p className="text-sm text-gray-600">
                    Identifying at-risk students within the first 4 weeks of courses.
                    Has improved retention by 7% across departments.
                  </p>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Peer Mentoring</h4>
                  <p className="text-sm text-gray-600">
                    Pairing senior students with first-years for academic support.
                    Program has 1,250 active mentors supporting 3,500 students.
                  </p>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Faculty Development</h4>
                  <p className="text-sm text-gray-600">
                    Training in innovative teaching methods and technologies.
                    92% of faculty have completed advanced teaching certification.
                  </p>
                </div>
              </div>
            </Card>
          </TabsContent>
          
          <TabsContent value="demographics" className="m-0 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Student Demographics</CardTitle>
                  <CardDescription>Overview of student population</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 mb-2">Gender Distribution</h4>
                      <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
                        <div className="flex h-full">
                          <div className="bg-blue-500 h-full" style={{ width: '52%' }}></div>
                          <div className="bg-pink-500 h-full" style={{ width: '47%' }}></div>
                          <div className="bg-purple-500 h-full" style={{ width: '1%' }}></div>
                        </div>
                      </div>
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>Male: 52%</span>
                        <span>Female: 47%</span>
                        <span>Non-Binary: 1%</span>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 mb-2">Age Distribution</h4>
                      <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
                        <div className="flex h-full">
                          <div className="bg-green-500 h-full" style={{ width: '38%' }}></div>
                          <div className="bg-yellow-500 h-full" style={{ width: '42%' }}></div>
                          <div className="bg-red-500 h-full" style={{ width: '20%' }}></div>
                        </div>
                      </div>
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>18-21: 38%</span>
                        <span>22-25: 42%</span>
                        <span>26+: 20%</span>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 mb-2">Student Type</h4>
                      <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
                        <div className="flex h-full">
                          <div className="bg-indigo-500 h-full" style={{ width: '75%' }}></div>
                          <div className="bg-emerald-500 h-full" style={{ width: '25%' }}></div>
                        </div>
                      </div>
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>Domestic: 75%</span>
                        <span>International: 25%</span>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 mb-2">Enrollment Status</h4>
                      <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
                        <div className="flex h-full">
                          <div className="bg-amber-500 h-full" style={{ width: '82%' }}></div>
                          <div className="bg-sky-500 h-full" style={{ width: '18%' }}></div>
                        </div>
                      </div>
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>Full-time: 82%</span>
                        <span>Part-time: 18%</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Diversity Metrics</CardTitle>
                  <CardDescription>Tracking diversity and inclusion</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 mb-3">Ethnicity Distribution</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                          <div className="text-sm">White: 48%</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-green-500"></div>
                          <div className="text-sm">Asian: 22%</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                          <div className="text-sm">Hispanic: 15%</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-red-500"></div>
                          <div className="text-sm">Black: 10%</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                          <div className="text-sm">Other: 5%</div>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 mb-3">First Generation Students</h4>
                      <div className="flex items-center gap-3">
                        <div className="relative w-16 h-16">
                          <div className="w-16 h-16 rounded-full border-4 border-blue-200"></div>
                          <div 
                            className="absolute top-0 left-0 w-16 h-16 rounded-full border-4 border-blue-500"
                            style={{ 
                              clipPath: 'polygon(50% 50%, 100% 50%, 100% 0, 0 0, 0 100%, 100% 100%, 100% 50%, 50% 50%)',
                              transform: 'rotate(90deg)'
                            }}
                          ></div>
                          <div className="absolute top-0 left-0 w-16 h-16 flex items-center justify-center text-sm font-medium">
                            28%
                          </div>
                        </div>
                        <div>
                          <div className="text-gray-900">28% of students are first-generation</div>
                          <div className="text-sm text-gray-500">↑ 3% from previous year</div>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 mb-3">Socioeconomic Diversity</h4>
                      <div className="space-y-2">
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>Need-based Financial Aid Recipients</span>
                            <span className="font-medium">42%</span>
                          </div>
                          <div className="h-2 bg-gray-100 rounded-full">
                            <div className="h-full bg-blue-500 rounded-full" style={{ width: '42%' }}></div>
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>Pell Grant Recipients</span>
                            <span className="font-medium">35%</span>
                          </div>
                          <div className="h-2 bg-gray-100 rounded-full">
                            <div className="h-full bg-green-500 rounded-full" style={{ width: '35%' }}></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 rounded-full bg-purple-100 text-purple-600">
                  <UserCheck className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-lg font-medium">Diversity & Inclusion Initiatives</h3>
                  <p className="text-gray-500">Programs to enhance campus diversity</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Diversity Scholarships</h4>
                  <p className="text-sm text-gray-600">
                    $5.2M allocated for diversity-focused scholarships, supporting 850+ students annually.
                  </p>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Inclusive Teaching Training</h4>
                  <p className="text-sm text-gray-600">
                    95% of faculty completed training on inclusive teaching methodologies and practices.
                  </p>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Multicultural Support</h4>
                  <p className="text-sm text-gray-600">
                    32 active cultural organizations with 5,800+ student members across campus.
                  </p>
                </div>
              </div>
            </Card>
          </TabsContent>
          
          <TabsContent value="outcomes" className="m-0 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Post-Graduation Employment</CardTitle>
                  <CardDescription>Employment rates for recent graduates</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={employmentRates}
                        margin={{
                          top: 20,
                          right: 30,
                          left: 20,
                          bottom: 5,
                        }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="year" />
                        <YAxis domain={[0, 100]} />
                        <Tooltip />
                        <Bar dataKey="rate" fill="#8884d8" name="Employment Rate (%)" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Average Starting Salary</CardTitle>
                  <CardDescription>By department for recent graduates</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={departments.map(dept => ({
                          name: dept.name,
                          salary: 45000 + Math.floor(Math.random() * 35000)
                        }))}
                        margin={{
                          top: 20,
                          right: 30,
                          left: 20,
                          bottom: 70,
                        }}
                        layout="vertical"
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" />
                        <YAxis type="category" dataKey="name" width={100} />
                        <Tooltip 
                          formatter={(value: any) => [`$${value.toLocaleString()}`, 'Avg. Salary']}
                        />
                        <Bar dataKey="salary" fill="#82ca9d" name="Average Starting Salary" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle>Graduate Outcomes Overview</CardTitle>
                <CardDescription>Status of recent graduates</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-3">Employment Status (6 months post-graduation)</h4>
                    <div className="h-5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="flex h-full">
                        <div className="bg-green-500 h-full" style={{ width: '78%' }}></div>
                        <div className="bg-blue-500 h-full" style={{ width: '12%' }}></div>
                        <div className="bg-amber-500 h-full" style={{ width: '8%' }}></div>
                        <div className="bg-gray-500 h-full" style={{ width: '2%' }}></div>
                      </div>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 mt-2">
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-green-500"></div>
                        <span>Employed Full-time: 78%</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                        <span>Further Education: 12%</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                        <span>Seeking Employment: 8%</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-gray-500"></div>
                        <span>Other: 2%</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">Top Employers</h4>
                        <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">
                          Corporate
                        </Badge>
                      </div>
                      <ol className="text-sm space-y-1 list-decimal pl-5">
                        <li>Google</li>
                        <li>Microsoft</li>
                        <li>Amazon</li>
                        <li>Deloitte</li>
                        <li>JP Morgan Chase</li>
                      </ol>
                    </div>
                    
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">Graduate Schools</h4>
                        <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-200">
                          Academic
                        </Badge>
                      </div>
                      <ol className="text-sm space-y-1 list-decimal pl-5">
                        <li>MIT</li>
                        <li>Stanford University</li>
                        <li>Harvard University</li>
                        <li>University of California, Berkeley</li>
                        <li>University of Oxford</li>
                      </ol>
                    </div>
                    
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">Career Satisfaction</h4>
                        <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
                          Survey Results
                        </Badge>
                      </div>
                      <div className="space-y-2">
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>Career Preparation</span>
                            <span className="font-medium">87%</span>
                          </div>
                          <div className="h-2 bg-gray-200 rounded-full">
                            <div className="h-full bg-green-500 rounded-full" style={{ width: '87%' }}></div>
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>Job Satisfaction</span>
                            <span className="font-medium">82%</span>
                          </div>
                          <div className="h-2 bg-gray-200 rounded-full">
                            <div className="h-full bg-green-500 rounded-full" style={{ width: '82%' }}></div>
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>Would Recommend University</span>
                            <span className="font-medium">91%</span>
                          </div>
                          <div className="h-2 bg-gray-200 rounded-full">
                            <div className="h-full bg-green-500 rounded-full" style={{ width: '91%' }}></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 rounded-full bg-amber-100 text-amber-600">
                  <BarChart4 className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-lg font-medium">Career Development Programs</h3>
                  <p className="text-gray-500">Initiatives to enhance graduate outcomes</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Industry Partnerships</h4>
                  <p className="text-sm text-gray-600">
                    350+ active industry partnerships providing internships and job opportunities for students.
                  </p>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Career Preparation</h4>
                  <p className="text-sm text-gray-600">
                    12,500+ career counseling sessions conducted annually with 92% student satisfaction rate.
                  </p>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Alumni Mentorship</h4>
                  <p className="text-sm text-gray-600">
                    2,800 alumni mentors actively supporting 4,500 current students in career development.
                  </p>
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
        
        {/* Report Generation Section */}
        <Card>
          <CardHeader>
            <CardTitle>Generate Custom Reports</CardTitle>
            <CardDescription>Create tailored reports for specific needs</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex flex-col items-center p-6 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                <Calendar className="h-10 w-10 text-blue-600 mb-3" />
                <h3 className="text-lg font-medium">Enrollment Report</h3>
                <p className="text-sm text-gray-500 text-center mt-2">
                  Comprehensive enrollment statistics and trends
                </p>
              </div>
              
              <div className="flex flex-col items-center p-6 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                <BarChart2 className="h-10 w-10 text-green-600 mb-3" />
                <h3 className="text-lg font-medium">Performance Analysis</h3>
                <p className="text-sm text-gray-500 text-center mt-2">
                  Academic performance metrics across departments
                </p>
              </div>
              
              <div className="flex flex-col items-center p-6 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                <Share2 className="h-10 w-10 text-purple-600 mb-3" />
                <h3 className="text-lg font-medium">Diversity Report</h3>
                <p className="text-sm text-gray-500 text-center mt-2">
                  Analysis of diversity metrics and initiatives
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default InstitutionReports;