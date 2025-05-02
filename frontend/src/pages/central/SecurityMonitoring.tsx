import React, { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
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
  TooltipProps 
} from 'recharts';
import TableList from '@/components/dashboard/TableList';
import { systemHealth } from '@/data/mockData';
import { 
  Lock, 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  RefreshCw, 
  Download, 
  Calendar as CalendarIcon, 
  Search, 
  UserX, 
  LogIn,
  Users,
  UserPlus,
  Eye,
  FileText,
  Server,
  Database,
  Globe,
  Wifi
} from 'lucide-react';

// Mock security logs
const securityLogs = [
  {
    id: '1',
    timestamp: '2023-05-01T08:25:43',
    user: 'admin@university.edu',
    action: 'Login Success',
    ipAddress: '192.168.1.105',
    location: 'Main Campus',
    severity: 'info'
  },
  {
    id: '2',
    timestamp: '2023-05-01T10:37:12',
    user: 'jsmith@university.edu',
    action: 'Login Failed (Multiple Attempts)',
    ipAddress: '45.67.89.123',
    location: 'Off Campus - NY, USA',
    severity: 'warning'
  },
  {
    id: '3',
    timestamp: '2023-05-01T11:42:57',
    user: 'system',
    action: 'Backup Completed',
    ipAddress: '192.168.1.10',
    location: 'Data Center',
    severity: 'info'
  },
  {
    id: '4',
    timestamp: '2023-05-01T14:15:03',
    user: 'mwilson@university.edu',
    action: 'Admin Access',
    ipAddress: '192.168.1.202',
    location: 'Admin Building',
    severity: 'info'
  },
  {
    id: '5',
    timestamp: '2023-05-01T16:30:25',
    user: 'unknown',
    action: 'Unauthorized Access Attempt',
    ipAddress: '78.90.123.45',
    location: 'Unknown - Russia',
    severity: 'critical'
  }
];

// Mock login attempts
const loginAttempts = [
  { hour: '00', success: 42, failed: 8 },
  { hour: '01', success: 28, failed: 5 },
  { hour: '02', success: 15, failed: 3 },
  { hour: '03', success: 10, failed: 2 },
  { hour: '04', success: 8, failed: 1 },
  { hour: '05', success: 12, failed: 2 },
  { hour: '06', success: 35, failed: 4 },
  { hour: '07', success: 87, failed: 10 },
  { hour: '08', success: 180, failed: 25 },
  { hour: '09', success: 250, failed: 30 },
  { hour: '10', success: 220, failed: 28 },
  { hour: '11', success: 205, failed: 22 },
  { hour: '12', success: 230, failed: 25 },
  { hour: '13', success: 240, failed: 27 },
  { hour: '14', success: 220, failed: 23 },
  { hour: '15', success: 210, failed: 25 },
  { hour: '16', success: 190, failed: 20 },
  { hour: '17', success: 170, failed: 18 },
  { hour: '18', success: 120, failed: 15 },
  { hour: '19', success: 90, failed: 12 },
  { hour: '20', success: 75, failed: 10 },
  { hour: '21', success: 60, failed: 8 },
  { hour: '22', success: 55, failed: 7 },
  { hour: '23', success: 48, failed: 6 },
];

// Mock user roles
const userRoles = [
  { id: '1', role: 'System Administrator', users: 5, permissions: 42 },
  { id: '2', role: 'Department Admin', users: 12, permissions: 35 },
  { id: '3', role: 'Academic Staff', users: 235, permissions: 28 },
  { id: '4', role: 'Student', users: 18500, permissions: 14 },
  { id: '5', role: 'Guest', users: 320, permissions: 6 },
];

// Mock system alerts
const systemAlerts = systemHealth.map((system, index) => ({
  id: (index + 1).toString(),
  timestamp: new Date(Date.now() - Math.random() * 86400000 * 5).toISOString(),
  system: system.name,
  message: system.status === 'healthy' 
    ? 'System operating normally' 
    : system.status === 'warning'
      ? 'Performance degradation detected'
      : 'Critical system failure',
  status: system.status,
  acknowledged: system.status === 'healthy' || Math.random() > 0.5
}));

const SecurityMonitoring: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentTab, setCurrentTab] = useState('logs');
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [alertFilter, setAlertFilter] = useState('all');
  
  // Filter logs based on search
  const filteredLogs = securityLogs.filter(log => 
    !searchTerm || 
    log.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.ipAddress.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.location.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  // Filter alerts based on search and status
  const filteredAlerts = systemAlerts.filter(alert => {
    const matchesSearch = !searchTerm || 
      alert.system.toLowerCase().includes(searchTerm.toLowerCase()) ||
      alert.message.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = 
      alertFilter === 'all' || 
      (alertFilter === 'critical' && alert.status === 'alert') ||
      (alertFilter === 'warning' && alert.status === 'warning') ||
      (alertFilter === 'healthy' && alert.status === 'healthy');
    
    return matchesSearch && matchesFilter;
  });
  
  // Filter roles based on search
  const filteredRoles = userRoles.filter(role => 
    !searchTerm || 
    role.role.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  // Security log columns
  const logColumns = [
    {
      key: 'timestamp',
      header: 'Timestamp',
      cell: (log: typeof securityLogs[0]) => (
        <div className="text-gray-700">
          {format(new Date(log.timestamp), 'MMM d, yyyy HH:mm:ss')}
        </div>
      )
    },
    {
      key: 'user',
      header: 'User',
      cell: (log: typeof securityLogs[0]) => (
        <div className="text-gray-700">{log.user}</div>
      )
    },
    {
      key: 'action',
      header: 'Action',
      cell: (log: typeof securityLogs[0]) => (
        <div className="text-gray-700">{log.action}</div>
      )
    },
    {
      key: 'location',
      header: 'Location',
      cell: (log: typeof securityLogs[0]) => (
        <div>
          <div className="text-gray-700">{log.location}</div>
          <div className="text-sm text-gray-500">{log.ipAddress}</div>
        </div>
      )
    },
    {
      key: 'severity',
      header: 'Severity',
      cell: (log: typeof securityLogs[0]) => {
        let badgeClass = '';
        
        switch (log.severity) {
          case 'info':
            badgeClass = 'bg-blue-100 text-blue-800 border-blue-200';
            break;
          case 'warning':
            badgeClass = 'bg-yellow-100 text-yellow-800 border-yellow-200';
            break;
          case 'critical':
            badgeClass = 'bg-red-100 text-red-800 border-red-200';
            break;
        }
        
        return (
          <Badge variant="outline" className={badgeClass}>
            {log.severity.charAt(0).toUpperCase() + log.severity.slice(1)}
          </Badge>
        );
      }
    }
  ];
  
  // System alert columns
  const alertColumns = [
    {
      key: 'timestamp',
      header: 'Timestamp',
      cell: (alert: typeof systemAlerts[0]) => (
        <div className="text-gray-700">
          {format(new Date(alert.timestamp), 'MMM d, yyyy HH:mm:ss')}
        </div>
      )
    },
    {
      key: 'system',
      header: 'System',
      cell: (alert: typeof systemAlerts[0]) => (
        <div className="text-gray-700">{alert.system}</div>
      )
    },
    {
      key: 'message',
      header: 'Message',
      cell: (alert: typeof systemAlerts[0]) => (
        <div className="text-gray-700">{alert.message}</div>
      )
    },
    {
      key: 'status',
      header: 'Status',
      cell: (alert: typeof systemAlerts[0]) => {
        let badgeClass = '';
        let statusText = '';
        
        switch (alert.status) {
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
            statusText = 'Critical';
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
      key: 'acknowledged',
      header: 'Acknowledged',
      cell: (alert: typeof systemAlerts[0]) => (
        <div className="flex justify-center">
          {alert.acknowledged ? (
            <CheckCircle className="h-5 w-5 text-green-600" />
          ) : (
            <XCircle className="h-5 w-5 text-red-600" />
          )}
        </div>
      )
    },
    {
      key: 'actions',
      header: '',
      cell: (alert: typeof systemAlerts[0]) => (
        <div className="flex justify-end">
          {!alert.acknowledged && alert.status !== 'healthy' && (
            <Button variant="outline" size="sm" className="h-8">
              <CheckCircle className="h-4 w-4 mr-2" />
              Acknowledge
            </Button>
          )}
          <Button variant="ghost" size="sm" className="h-8 ml-2">
            <Eye className="h-4 w-4" />
          </Button>
        </div>
      )
    }
  ];
  
  // User roles columns
  const roleColumns = [
    {
      key: 'role',
      header: 'Role',
      cell: (role: typeof userRoles[0]) => (
        <div className="text-gray-700 font-medium">{role.role}</div>
      )
    },
    {
      key: 'users',
      header: 'Users',
      cell: (role: typeof userRoles[0]) => (
        <div className="text-gray-700">{role.users.toLocaleString()}</div>
      )
    },
    {
      key: 'permissions',
      header: 'Permissions',
      cell: (role: typeof userRoles[0]) => (
        <div className="text-gray-700">{role.permissions}</div>
      )
    },
    {
      key: 'actions',
      header: '',
      cell: (role: typeof userRoles[0]) => (
        <div className="flex justify-end">
          <Button variant="ghost" size="sm">
            <Eye className="h-4 w-4 mr-2" />
            View
          </Button>
          <Button variant="ghost" size="sm">
            <FileText className="h-4 w-4 mr-2" />
            Audit
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
            <h2 className="text-2xl font-bold text-gray-800">Security Monitoring</h2>
            <p className="text-gray-500 mt-1">System security monitoring and management</p>
          </div>
          <div className="flex items-center gap-3">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="flex gap-2">
                  <CalendarIcon className="h-4 w-4" />
                  {date ? format(date, 'PPP') : 'Select date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            <Button variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
        
        {/* Security Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="relative overflow-hidden">
            <div className="absolute top-0 right-0 w-16 h-16">
              <div className="absolute transform rotate-45 bg-green-600 text-white font-semibold py-1 right-[-35px] top-[25px] w-[140px] text-center text-xs">
                SECURE
              </div>
            </div>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">System Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <Shield className="h-8 w-8 text-green-600 mr-3" />
                <div>
                  <div className="text-2xl font-bold">Protected</div>
                  <p className="text-sm text-gray-500">All systems operational</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Active Alerts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <AlertTriangle className="h-8 w-8 text-amber-600 mr-3" />
                <div>
                  <div className="text-2xl font-bold">
                    {systemAlerts.filter(a => (a.status === 'warning' || a.status === 'alert') && !a.acknowledged).length}
                  </div>
                  <p className="text-sm text-gray-500">Unacknowledged alerts</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Failed Logins</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <UserX className="h-8 w-8 text-red-600 mr-3" />
                <div>
                  <div className="text-2xl font-bold">
                    {loginAttempts.reduce((sum, item) => sum + item.failed, 0)}
                  </div>
                  <p className="text-sm text-gray-500">In the last 24 hours</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Active Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <Users className="h-8 w-8 text-blue-600 mr-3" />
                <div>
                  <div className="text-2xl font-bold">1,245</div>
                  <p className="text-sm text-gray-500">Currently online</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Login Attempts Chart */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Login Attempts (24 Hours)</CardTitle>
                <CardDescription>Successful vs. failed login attempts</CardDescription>
              </div>
              <Button variant="outline" size="sm">
                <FileText className="h-4 w-4 mr-2" />
                Full Report
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={loginAttempts}
                  margin={{
                    top: 20,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="hour" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="success" fill="#8884d8" name="Successful" />
                  <Bar dataKey="failed" fill="#ff8a65" name="Failed" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        
        {/* Tabs for different security aspects */}
        <Tabs defaultValue="logs" value={currentTab} onValueChange={setCurrentTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="logs">Security Logs</TabsTrigger>
            <TabsTrigger value="alerts">System Alerts</TabsTrigger>
            <TabsTrigger value="roles">User Roles & Permissions</TabsTrigger>
            <TabsTrigger value="connections">Network Connections</TabsTrigger>
          </TabsList>
          
          <TabsContent value="logs" className="m-0">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Security Event Logs</CardTitle>
                  <div className="relative w-64">
                    <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <Input
                      placeholder="Search logs..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <TableList
                  columns={logColumns}
                  data={filteredLogs}
                />
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="alerts" className="m-0">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>System Alerts</CardTitle>
                  <div className="flex gap-3">
                    <Select defaultValue={alertFilter} onValueChange={setAlertFilter}>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Filter alerts" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Alerts</SelectItem>
                        <SelectItem value="critical">Critical Only</SelectItem>
                        <SelectItem value="warning">Warnings Only</SelectItem>
                        <SelectItem value="healthy">Healthy Only</SelectItem>
                      </SelectContent>
                    </Select>
                    <div className="relative w-64">
                      <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <Input
                        placeholder="Search alerts..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10"
                      />
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <TableList
                  columns={alertColumns}
                  data={filteredAlerts}
                />
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="roles" className="m-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <Card>
                <CardHeader>
                  <CardTitle>Role Distribution</CardTitle>
                  <CardDescription>Users by role type</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={userRoles}
                        margin={{
                          top: 20,
                          right: 30,
                          left: 20,
                          bottom: 40,
                        }}
                        layout="vertical"
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" />
                        <YAxis type="category" dataKey="role" width={150} />
                        <Tooltip />
                        <Bar dataKey="users" fill="#82ca9d" name="Number of Users" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Permission Distribution</CardTitle>
                  <CardDescription>Permissions by role</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={userRoles}
                        margin={{
                          top: 20,
                          right: 30,
                          left: 20,
                          bottom: 40,
                        }}
                        layout="vertical"
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" />
                        <YAxis type="category" dataKey="role" width={150} />
                        <Tooltip />
                        <Bar dataKey="permissions" fill="#8884d8" name="Number of Permissions" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Role Management</CardTitle>
                  <div className="flex gap-3">
                    <Button variant="outline" size="sm">
                      <UserPlus className="h-4 w-4 mr-2" />
                      Create Role
                    </Button>
                    <div className="relative w-64">
                      <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <Input
                        placeholder="Search roles..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10"
                      />
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <TableList
                  columns={roleColumns}
                  data={filteredRoles}
                />
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="connections" className="m-0">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Active Connections</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center">
                    <Globe className="h-8 w-8 text-blue-600 mr-3" />
                    <div>
                      <div className="text-2xl font-bold">1,857</div>
                      <p className="text-sm text-gray-500">Current sessions</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Database Connections</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center">
                    <Database className="h-8 w-8 text-green-600 mr-3" />
                    <div>
                      <div className="text-2xl font-bold">358</div>
                      <p className="text-sm text-gray-500">Active queries</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">API Requests</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center">
                    <Server className="h-8 w-8 text-purple-600 mr-3" />
                    <div>
                      <div className="text-2xl font-bold">2,450</div>
                      <p className="text-sm text-gray-500">Requests per minute</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Network Traffic</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center">
                    <Wifi className="h-8 w-8 text-amber-600 mr-3" />
                    <div>
                      <div className="text-2xl font-bold">425 MB/s</div>
                      <p className="text-sm text-gray-500">Current throughput</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle>Network Traffic Monitoring</CardTitle>
                <CardDescription>Real-time network traffic analysis</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={Array.from({ length: 24 }, (_, i) => ({
                        time: i.toString().padStart(2, '0'),
                        incoming: Math.floor(Math.random() * 400) + 200,
                        outgoing: Math.floor(Math.random() * 300) + 150
                      }))}
                      margin={{
                        top: 10,
                        right: 30,
                        left: 0,
                        bottom: 0,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="time" />
                      <YAxis />
                      <Tooltip />
                      <Area type="monotone" dataKey="incoming" stroke="#8884d8" fillOpacity={0.3} fill="#8884d8" name="Incoming (MB/s)" />
                      <Area type="monotone" dataKey="outgoing" stroke="#82ca9d" fillOpacity={0.3} fill="#82ca9d" name="Outgoing (MB/s)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                
                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium mb-2">Network Statistics</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Peak Traffic</span>
                        <span className="font-medium">562 MB/s (09:45 AM)</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Average Load</span>
                        <span className="font-medium">320 MB/s</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Total Data Transferred</span>
                        <span className="font-medium">28.4 TB today</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium mb-2">Top Connections</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Main Campus WiFi</span>
                        <span className="font-medium">245 MB/s</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Student Dormitories</span>
                        <span className="font-medium">185 MB/s</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Administrative Network</span>
                        <span className="font-medium">120 MB/s</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        
        {/* Security Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Security Actions</CardTitle>
            <CardDescription>Quick access to common security operations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Button variant="outline" className="h-auto py-6 flex flex-col items-center">
                <Shield className="h-8 w-8 mb-2 text-blue-600" />
                <span className="text-center">Run Security Scan</span>
              </Button>
              <Button variant="outline" className="h-auto py-6 flex flex-col items-center">
                <Lock className="h-8 w-8 mb-2 text-green-600" />
                <span className="text-center">Update Permissions</span>
              </Button>
              <Button variant="outline" className="h-auto py-6 flex flex-col items-center">
                <RefreshCw className="h-8 w-8 mb-2 text-purple-600" />
                <span className="text-center">Reset Security Tokens</span>
              </Button>
              <Button variant="outline" className="h-auto py-6 flex flex-col items-center">
                <Download className="h-8 w-8 mb-2 text-amber-600" />
                <span className="text-center">Export Security Report</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default SecurityMonitoring;