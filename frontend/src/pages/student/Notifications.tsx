import React, { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { notifications } from '@/data/mockData';
import NotificationItem from '@/components/dashboard/NotificationItem';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle } from 'lucide-react';

const Notifications: React.FC = () => {
  const { toast } = useToast();
  const [readNotifications, setReadNotifications] = useState<string[]>([]);
  
  // Filter notifications
  const unreadNotifications = notifications.filter(n => !n.read && !readNotifications.includes(n.id));
  const readNotificationsList = notifications.filter(n => n.read || readNotifications.includes(n.id));
  
  // Mark a notification as read
  const markAsRead = (id: string) => {
    if (!readNotifications.includes(id)) {
      setReadNotifications(prev => [...prev, id]);
    }
  };
  
  // Mark all notifications as read
  const markAllAsRead = () => {
    const newReadIds = notifications
      .filter(n => !n.read && !readNotifications.includes(n.id))
      .map(n => n.id);
      
    setReadNotifications(prev => [...prev, ...newReadIds]);
    
    toast({
      title: "Notifications marked as read",
      description: `${newReadIds.length} notifications marked as read.`,
    });
  };
  
  // Get notification icon color based on type
  const getNotificationTypeColor = (type: string) => {
    switch (type) {
      case 'info':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'success':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'error':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-800">Notifications</h2>
          <Button variant="outline" onClick={markAllAsRead} disabled={unreadNotifications.length === 0}>
            <CheckCircle className="h-4 w-4 mr-2" />
            Mark All as Read
          </Button>
        </div>
        
        <Tabs defaultValue="unread" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="unread">
              Unread
              {unreadNotifications.length > 0 && (
                <Badge variant="secondary" className="ml-2 bg-primary/10 text-primary">
                  {unreadNotifications.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="all">All</TabsTrigger>
          </TabsList>
          
          {/* Unread Notifications */}
          <TabsContent value="unread">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-medium">Unread Notifications</CardTitle>
              </CardHeader>
              <CardContent>
                {unreadNotifications.length > 0 ? (
                  <div className="divide-y divide-gray-200">
                    {unreadNotifications.map((notification) => (
                      <div 
                        key={notification.id} 
                        className="hover:bg-gray-50 transition-colors cursor-pointer"
                        onClick={() => markAsRead(notification.id)}
                      >
                        <NotificationItem notification={notification} />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <CheckCircle className="h-12 w-12 mx-auto text-gray-400" />
                    <p className="mt-4">You have no unread notifications.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* All Notifications */}
          <TabsContent value="all">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-medium">All Notifications</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Group notifications by date */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-gray-500 uppercase">Today</h3>
                    <Card>
                      <CardContent className="p-0">
                        <div className="divide-y divide-gray-200">
                          {notifications.slice(0, 2).map((notification) => (
                            <div 
                              key={notification.id} 
                              className={`hover:bg-gray-50 transition-colors ${
                                readNotifications.includes(notification.id) || notification.read 
                                  ? 'opacity-75' 
                                  : ''
                              }`}
                              onClick={() => markAsRead(notification.id)}
                            >
                              <NotificationItem notification={notification} />
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                  
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-gray-500 uppercase">Earlier</h3>
                    <Card>
                      <CardContent className="p-0">
                        <div className="divide-y divide-gray-200">
                          {notifications.slice(2).map((notification) => (
                            <div 
                              key={notification.id} 
                              className={`hover:bg-gray-50 transition-colors ${
                                readNotifications.includes(notification.id) || notification.read 
                                  ? 'opacity-75' 
                                  : ''
                              }`}
                              onClick={() => markAsRead(notification.id)}
                            >
                              <NotificationItem notification={notification} />
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        
        {/* Notification Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-medium">Notification Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="font-medium">Email Notifications</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label htmlFor="email-assignments" className="text-sm text-gray-700">
                      Assignment updates
                    </label>
                    <input 
                      id="email-assignments" 
                      type="checkbox" 
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" 
                      defaultChecked
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <label htmlFor="email-grades" className="text-sm text-gray-700">
                      Grade publications
                    </label>
                    <input 
                      id="email-grades" 
                      type="checkbox" 
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" 
                      defaultChecked
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <label htmlFor="email-announcements" className="text-sm text-gray-700">
                      Course announcements
                    </label>
                    <input 
                      id="email-announcements" 
                      type="checkbox" 
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" 
                      defaultChecked
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <label htmlFor="email-messages" className="text-sm text-gray-700">
                      Direct messages
                    </label>
                    <input 
                      id="email-messages" 
                      type="checkbox" 
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" 
                      defaultChecked
                    />
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <h3 className="font-medium">System Notifications</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label htmlFor="system-deadlines" className="text-sm text-gray-700">
                      Upcoming deadlines
                    </label>
                    <input 
                      id="system-deadlines" 
                      type="checkbox" 
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" 
                      defaultChecked
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <label htmlFor="system-activity" className="text-sm text-gray-700">
                      Account activity
                    </label>
                    <input 
                      id="system-activity" 
                      type="checkbox" 
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" 
                      defaultChecked
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <label htmlFor="system-reminders" className="text-sm text-gray-700">
                      Class reminders
                    </label>
                    <input 
                      id="system-reminders" 
                      type="checkbox" 
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" 
                      defaultChecked
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <label htmlFor="system-enrollment" className="text-sm text-gray-700">
                      Enrollment updates
                    </label>
                    <input 
                      id="system-enrollment" 
                      type="checkbox" 
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" 
                      defaultChecked
                    />
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-6 flex justify-end">
              <Button>Save Preferences</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Notifications;
