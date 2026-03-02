"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Bell, Send, Users, User, Car, CheckCircle2 } from "lucide-react";

interface Broadcast {
  id: string;
  title: string;
  message: string;
  sentAt: string;
  status: 'sent' | 'failed';
}

export default function BroadcastMessages() {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [recentBroadcasts, setRecentBroadcasts] = useState<Broadcast[]>([
    {
      id: '1',
      title: 'Welcome to LinkCab',
      message: 'We are excited to announce our new update with improved carpooling features!',
      sentAt: new Date(Date.now() - 86400000).toISOString(),
      status: 'sent'
    }
  ]);

  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) return;

    setIsSending(true);

    // Simulate sending delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    const newBroadcast: Broadcast = {
      id: Math.random().toString(36).substring(7),
      title,
      message,
      sentAt: new Date().toISOString(),
      status: 'sent'
    };

    setRecentBroadcasts([newBroadcast, ...recentBroadcasts]);
    setTitle('');
    setMessage('');
    setIsSending(false);
    setShowSuccess(true);
    
    // Hide success message after 3 seconds
    setTimeout(() => {
      setShowSuccess(false);
    }, 3000);
  };

  // Removed audience helper functions

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Broadcast Messages</h1>
          <p className="text-gray-500 mt-1">Send push notifications and alerts to your users.</p>
        </div>
        <Badge variant="secondary" className="px-3 py-1 text-sm bg-yellow-100 text-yellow-800 border-yellow-200">
          <Bell className="h-4 w-4 mr-2 inline" />
          {recentBroadcasts.length} Sent
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Compose Form */}
        <Card className="lg:col-span-2 shadow-sm border-gray-200">
          <CardHeader className="border-b bg-gray-50/50 pb-4">
            <CardTitle className="flex items-center text-lg">
              <Send className="w-5 h-5 mr-2 text-yellow-500" />
              Compose Message
            </CardTitle>
            <CardDescription>
              Create a new notification to be sent immediately.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleSendBroadcast} className="space-y-6">
              
              {/* Message Details */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Message Title</label>
                  <Input 
                    placeholder="e.g. Server Maintenance Notice" 
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="border-gray-300 focus:border-yellow-400 focus:ring-yellow-400"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Message Content</label>
                  <Textarea 
                    placeholder="Type your broadcast message here..." 
                    className="min-h-[150px] border-gray-300 focus:border-yellow-400 focus:ring-yellow-400 resize-y"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    required
                  />
                  <p className="text-xs text-gray-400 text-right">
                    {message.length} characters
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t">
                <Button 
                  type="submit" 
                  disabled={isSending || showSuccess || !title.trim() || !message.trim()}
                  className={`w-full py-6 text-lg transition-all duration-500 ease-in-out ${
                    showSuccess 
                      ? 'bg-green-500 hover:bg-green-600 text-white scale-[1.02]' 
                      : 'bg-black hover:bg-gray-800 text-white'
                  }`}
                >
                  {isSending ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Sending...
                    </span>
                  ) : showSuccess ? (
                    <span className="flex items-center animate-in zoom-in duration-300">
                      <CheckCircle2 className="w-6 h-6 mr-2 animate-bounce" />
                      Broadcast Sent Successfully!
                    </span>
                  ) : (
                    <span className="flex items-center">
                      <Send className="w-5 h-5 mr-2" />
                      Send Broadcast Now
                    </span>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* History Sidebar */}
        <div className="space-y-6">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center">
            <Bell className="w-5 h-5 mr-2 text-gray-500" />
            Recent Broadcasts
          </h2>
          
          <div className="space-y-4">
            {recentBroadcasts.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-100">
                <p className="text-gray-500 text-sm">No broadcasts sent yet.</p>
              </div>
            ) : (
              recentBroadcasts.map((broadcast) => (
                <Card key={broadcast.id} className="shadow-sm border-gray-200">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <Badge variant="outline" className="text-xs bg-gray-50">
                        <span className="flex items-center text-gray-600">
                          <Users className="h-3 w-3 mr-1" />
                          All Users
                        </span>
                      </Badge>
                      <span className="flex items-center text-xs text-green-600 font-medium">
                        <CheckCircle2 className="w-3 h-3 mr-1" /> Sent
                      </span>
                    </div>
                    <h3 className="font-semibold text-gray-900 line-clamp-1 mb-1">
                      {broadcast.title}
                    </h3>
                    <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                      {broadcast.message}
                    </p>
                    <p className="text-xs text-gray-400">
                      {new Date(broadcast.sentAt).toLocaleString()}
                    </p>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
