import React, { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Search, 
  PlusCircle, 
  Send, 
  Paperclip, 
  MoreVertical,
  ChevronLeft
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Mock data for conversations - educational focus
const conversations = [
  {
    id: '1',
    name: 'Dr. Robert Chen',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
    lastMessage: "I'm available for academic consultation to discuss your database normalization project.",
    time: '10:30 AM',
    unread: true,
    role: 'Professor, Database Systems'
  },
  {
    id: '2',
    name: 'Prof. Sarah Johnson',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
    lastMessage: 'Your recursive sorting algorithm implementation demonstrates excellent understanding of the course material.',
    time: 'Yesterday',
    unread: false,
    role: 'Professor, Algorithms & Data Structures'
  },
  {
    id: '3',
    name: 'Academic Advising',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
    lastMessage: 'Your curriculum plan for next semester aligns well with your degree requirements and educational goals.',
    time: '2 days ago',
    unread: false,
    role: 'Student Support Services'
  },
  {
    id: '4',
    name: 'Dr. Michelle Wong',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
    lastMessage: 'Please submit your educational UI prototype with accessibility features by Friday for review.',
    time: '3 days ago',
    unread: false,
    role: 'Professor, Human-Computer Interaction'
  },
  {
    id: '5',
    name: 'Library Resources',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
    lastMessage: 'The academic research materials you requested on advanced database design are available for pickup.',
    time: '1 week ago',
    unread: false,
    role: 'University Services'
  }
];

// Mock messages for a conversation - educational content
const mockMessages = [
  {
    id: '1',
    sender: 'Dr. Robert Chen',
    content: "Hello Jane, I've reviewed your database design project draft for the student information system. Your work shows good understanding of the concepts.",
    time: '10:15 AM',
    isSelf: false
  },
  {
    id: '2',
    sender: 'Dr. Robert Chen',
    content: 'Your entity-relationship diagram looks promising, but I suggest improving the Student-Course relationship. Remember what we learned about normalization - consider using a junction table to properly represent this many-to-many relationship as covered in chapter 4.',
    time: '10:18 AM',
    isSelf: false
  },
  {
    id: '3',
    sender: 'Jane Smith',
    content: "Thank you for the educational feedback, Dr. Chen. I'll implement a StudentCourses junction table with student_id and course_id as foreign keys to follow database design best practices we discussed in class.",
    time: '10:22 AM',
    isSelf: true
  },
  {
    id: '4',
    sender: 'Dr. Robert Chen',
    content: 'Excellent approach. For your learning, also ensure your Enrollments table follows Third Normal Form (3NF) to eliminate transitive dependencies. This will make your database more efficient for the academic records system. Reference the textbook examples on page 142.',
    time: '10:25 AM',
    isSelf: false
  },
  {
    id: '5',
    sender: 'Jane Smith',
    content: "I'll apply the normalization principles we covered in class. Would you be available during your office hours tomorrow to review my revised educational database design and academic record module?",
    time: '10:28 AM',
    isSelf: true
  },
  {
    id: '6',
    sender: 'Dr. Robert Chen',
    content: "Yes, I'm available for academic consultation from 2-4pm in room CS-201. Feel free to bring your updated ER diagram and we can discuss how it aligns with the course learning objectives and curriculum standards.",
    time: '10:30 AM',
    isSelf: false
  }
];

const Messages: React.FC = () => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedConversation, setSelectedConversation] = useState<string | null>('1');
  const [newMessage, setNewMessage] = useState('');
  const [messages, setMessages] = useState(mockMessages);
  const [showMobileConversation, setShowMobileConversation] = useState(false);
  
  // Filter conversations based on search term
  const filteredConversations = conversations.filter(convo => 
    convo.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    convo.lastMessage.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  // Get the selected conversation details
  const currentConversation = conversations.find(convo => convo.id === selectedConversation);
  
  // Send new message
  const sendMessage = () => {
    if (newMessage.trim() === '') return;
    
    const newMsg = {
      id: Date.now().toString(),
      sender: 'Jane Smith',
      content: newMessage,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isSelf: true
    };
    
    setMessages([...messages, newMsg]);
    setNewMessage('');
    
    // Simulate a response after 1 second
    setTimeout(() => {
      const response = {
        id: (Date.now() + 1).toString(),
        sender: currentConversation?.name || 'Unknown',
        content: "Thank you for your academic inquiry. I've received your message and will respond with educational guidance shortly. Please review the course materials in the meantime.",
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isSelf: false
      };
      
      setMessages(prev => [...prev, response]);
    }, 1000);
  };
  
  // Handle selecting a conversation
  const handleSelectConversation = (id: string) => {
    setSelectedConversation(id);
    setShowMobileConversation(true);
  };
  
  // Create a new conversation
  const createNewConversation = () => {
    toast({
      title: "Feature coming soon",
      description: "The ability to start new conversations will be available in a future update.",
    });
  };

  return (
    <DashboardLayout>
      <div className="h-[calc(100vh-150px)] flex flex-col">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Messages</h2>
        </div>
        
        <div className="flex-1 overflow-hidden">
          <Card className="flex h-full overflow-hidden">
            {/* Conversations List - hidden on mobile when a conversation is selected */}
            <div 
              className={`border-r w-full md:w-1/3 flex flex-col ${
                showMobileConversation ? 'hidden md:flex' : 'flex'
              }`}
            >
              <CardHeader className="py-4 px-4 border-b">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-medium">Conversations</CardTitle>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={createNewConversation} 
                    className="text-primary hover:text-primary/80"
                  >
                    <PlusCircle className="h-5 w-5" />
                  </Button>
                </div>
                <div className="relative mt-2">
                  <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <Input 
                    placeholder="Search messages" 
                    className="pl-10" 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </CardHeader>
              
              <div className="flex-1 overflow-y-auto">
                {filteredConversations.length > 0 ? (
                  <div className="divide-y divide-gray-200">
                    {filteredConversations.map((convo) => (
                      <div 
                        key={convo.id} 
                        className={`p-4 cursor-pointer hover:bg-gray-50 ${
                          selectedConversation === convo.id ? 'bg-primary/5' : ''
                        }`}
                        onClick={() => handleSelectConversation(convo.id)}
                      >
                        <div className="flex items-start gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={convo.avatar} alt={convo.name} />
                            <AvatarFallback>{convo.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <h3 className="font-medium text-gray-900 truncate">{convo.name}</h3>
                              <p className="text-xs text-gray-500">{convo.time}</p>
                            </div>
                            <p className="text-sm text-gray-500 truncate">{convo.lastMessage}</p>
                          </div>
                          {convo.unread && (
                            <div className="h-2 w-2 bg-primary rounded-full"></div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-gray-500">No conversations found</p>
                  </div>
                )}
              </div>
            </div>
            
            {/* Message Area */}
            <div 
              className={`flex-1 flex flex-col ${
                !showMobileConversation ? 'hidden md:flex' : 'flex'
              }`}
            >
              {selectedConversation ? (
                <>
                  {/* Conversation Header */}
                  <CardHeader className="py-4 px-4 border-b flex-shrink-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {/* Back button (visible on mobile only) */}
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="md:hidden" 
                          onClick={() => setShowMobileConversation(false)}
                        >
                          <ChevronLeft className="h-5 w-5" />
                        </Button>
                        
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={currentConversation?.avatar} alt={currentConversation?.name} />
                          <AvatarFallback>{currentConversation?.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <CardTitle className="text-base font-medium">{currentConversation?.name}</CardTitle>
                          <p className="text-xs text-gray-500">{currentConversation?.role}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" className="text-gray-500 hover:text-gray-700">
                          <MoreVertical className="h-5 w-5" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  
                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.map((message) => (
                      <div 
                        key={message.id} 
                        className={`flex items-start gap-3 ${
                          message.isSelf ? 'flex-row-reverse' : ''
                        }`}
                      >
                        {!message.isSelf && (
                          <Avatar className="h-8 w-8 flex-shrink-0">
                            <AvatarImage src={currentConversation?.avatar} alt={message.sender} />
                            <AvatarFallback>{message.sender.charAt(0)}</AvatarFallback>
                          </Avatar>
                        )}
                        <div 
                          className={`rounded-lg p-3 max-w-[80%] ${
                            message.isSelf 
                              ? 'bg-primary text-white'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          <p className="text-sm">{message.content}</p>
                          <p 
                            className={`text-xs mt-1 ${
                              message.isSelf ? 'text-primary-foreground/80' : 'text-gray-500'
                            }`}
                          >
                            {message.time}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Message Input */}
                  <CardContent className="p-4 border-t bg-white">
                    <div className="flex items-end gap-2">
                      <Button variant="ghost" size="icon" className="text-gray-500 hover:text-gray-700">
                        <Paperclip className="h-5 w-5" />
                      </Button>
                      <Textarea 
                        placeholder="Type a message..."
                        className="flex-1 resize-none"
                        rows={1}
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            sendMessage();
                          }
                        }}
                      />
                      <Button 
                        size="icon" 
                        className="text-white bg-primary hover:bg-primary/90"
                        onClick={sendMessage}
                        disabled={newMessage.trim() === ''}
                      >
                        <Send className="h-5 w-5" />
                      </Button>
                    </div>
                  </CardContent>
                </>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center p-6">
                    <div className="h-12 w-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4">
                      <Send className="h-6 w-6" />
                    </div>
                    <h3 className="text-lg font-medium">Your Messages</h3>
                    <p className="text-sm text-gray-500 mt-2 max-w-md">
                      Select a conversation to view messages or start a new conversation.
                    </p>
                    <Button 
                      className="mt-4"
                      onClick={createNewConversation}
                    >
                      <PlusCircle className="h-4 w-4 mr-2" />
                      New Conversation
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Messages;
