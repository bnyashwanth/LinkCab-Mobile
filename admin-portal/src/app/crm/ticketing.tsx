"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Eye, MessageSquare, Clock, CheckCircle, AlertTriangle, User, Send, Filter } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface Ticket {
  id: string;
  ticket_number: string;
  user_id: string;
  type: 'no_show' | 'payment_dispute' | 'harassment' | 'spam' | 'inappropriate_content' | 'app_crash' | 'other';
  title: string;
  description: string;
  status: 'open' | 'in_progress' | 'escalated' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'critical';
  category: 'safety' | 'payment' | 'technical' | 'behavioral' | 'general';
  assigned_to?: string;
  created_at: string;
  updated_at: string;
  resolved_at?: string;
  user?: {
    full_name: string;
    email: string;
    phone: string;
  };
  related_announcement_id?: string;
  related_user_id?: string;
  chat_logs?: ChatMessage[];
}

interface ChatMessage {
  id: string;
  sender_id: string;
  receiver_id: string;
  message: string;
  timestamp: string;
  read: boolean;
  sender?: {
    full_name: string;
  };
}

interface TicketResponse {
  message: string;
  status: 'open' | 'in_progress' | 'escalated' | 'resolved' | 'closed';
  assigned_to?: string;
}

export default function TicketingSystem() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [filteredTickets, setFilteredTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [responseMessage, setResponseMessage] = useState('');
  const [showResponseModal, setShowResponseModal] = useState(false);

  useEffect(() => {
    const fetchTickets = async () => {
      try {
        const { data, error } = await supabase
          .from('support_tickets')
          .select(`
            *,
            user:user_id (
              full_name,
              email,
              phone
            )
          `)
          .order('created_at', { ascending: false });

        if (error) throw error;

        setTickets(data || []);
        setFilteredTickets(data || []);
      } catch (error) {
        console.error('Error fetching tickets:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTickets();
  }, []);

  useEffect(() => {
    let filtered = tickets;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(ticket =>
        ticket.ticket_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.user?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(ticket => ticket.status === statusFilter);
    }

    // Apply priority filter
    if (priorityFilter !== 'all') {
      filtered = filtered.filter(ticket => ticket.priority === priorityFilter);
    }

    setFilteredTickets(filtered);
  }, [searchTerm, statusFilter, priorityFilter, tickets]);

  const fetchChatLogs = async (ticket: Ticket) => {
    if (!ticket.related_announcement_id && !ticket.related_user_id) return;

    try {
      let chatQuery = supabase.from('chat_messages').select('*');

      if (ticket.related_user_id) {
        // Fetch chat between user and reported user
        chatQuery = chatQuery.or(`(sender_id.eq.${ticket.user_id},receiver_id.eq.${ticket.related_user_id}),(sender_id.eq.${ticket.related_user_id},receiver_id.eq.${ticket.user_id})`);
      }

      const { data: chatLogs } = await chatQuery.order('timestamp', { ascending: false });

      if (chatLogs) {
        setSelectedTicket({
          ...ticket,
          chat_logs: chatLogs
        });
      } else {
        setSelectedTicket(ticket);
      }
    } catch (error) {
      console.error('Error fetching chat logs:', error);
      setSelectedTicket(ticket);
    }
  };

  const handleTicketAction = async (ticketId: string, response: TicketResponse) => {
    try {
      // Update ticket status
      const { error: updateError } = await supabase
        .from('support_tickets')
        .update({
          status: response.status,
          assigned_to: response.assigned_to,
          updated_at: new Date().toISOString(),
          resolved_at: response.status === 'resolved' ? new Date().toISOString() : null
        })
        .eq('id', ticketId);

      if (updateError) throw updateError;

      // Add response to ticket history
      if (response.message) {
        await supabase
          .from('ticket_responses')
          .insert({
            ticket_id: ticketId,
            message: response.message,
            responder_type: 'admin',
            created_at: new Date().toISOString()
          });
      }

      // Refresh tickets
      const updatedTickets = tickets.map(ticket =>
        ticket.id === ticketId
          ? { ...ticket, status: response.status, assigned_to: response.assigned_to }
          : ticket
      );
      setTickets(updatedTickets);

      alert('Ticket updated successfully');
      setShowResponseModal(false);
      setResponseMessage('');
    } catch (error) {
      console.error('Error updating ticket:', error);
      alert('Failed to update ticket');
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'no_show':
        return <Badge variant="outline">No Show</Badge>;
      case 'payment_dispute':
        return <Badge className="bg-yellow-100 text-yellow-800">Payment</Badge>;
      case 'harassment':
        return <Badge variant="destructive">Harassment</Badge>;
      case 'spam':
        return <Badge variant="secondary">Spam</Badge>;
      case 'inappropriate_content':
        return <Badge className="bg-orange-100 text-orange-800">Inappropriate</Badge>;
      case 'app_crash':
        return <Badge className="bg-red-100 text-red-800">App Crash</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open':
        return <Badge className="bg-blue-100 text-blue-800">Open</Badge>;
      case 'in_progress':
        return <Badge className="bg-yellow-100 text-yellow-800">In Progress</Badge>;
      case 'escalated':
        return <Badge variant="destructive">Escalated</Badge>;
      case 'resolved':
        return <Badge className="bg-green-100 text-green-800">Resolved</Badge>;
      case 'closed':
        return <Badge variant="secondary">Closed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'critical':
        return <Badge variant="destructive">Critical</Badge>;
      case 'high':
        return <Badge className="bg-red-100 text-red-800">High</Badge>;
      case 'medium':
        return <Badge className="bg-yellow-100 text-yellow-800">Medium</Badge>;
      case 'low':
        return <Badge className="bg-blue-100 text-blue-800">Low</Badge>;
      default:
        return <Badge variant="outline">{priority}</Badge>;
    }
  };

  // Calculate stats
  const openTickets = tickets.filter(t => t.status === 'open').length;
  const inProgressTickets = tickets.filter(t => t.status === 'in_progress').length;
  const escalatedTickets = tickets.filter(t => t.status === 'escalated').length;
  const resolvedToday = tickets.filter(t => 
    t.status === 'resolved' && 
    new Date(t.resolved_at || '').toDateString() === new Date().toDateString()
  ).length;

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Ticketing & Dispute Resolution</h1>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Open Tickets</CardTitle>
            <MessageSquare className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{openTickets}</div>
            <p className="text-xs text-gray-500 mt-1">Awaiting response</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">In Progress</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{inProgressTickets}</div>
            <p className="text-xs text-gray-500 mt-1">Being investigated</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Escalated</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{escalatedTickets}</div>
            <p className="text-xs text-gray-500 mt-1">Require escalation</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Resolved Today</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{resolvedToday}</div>
            <p className="text-xs text-gray-500 mt-1">Successfully resolved</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Filters</span>
            <div className="flex space-x-4">
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search tickets..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="all">All Status</option>
                <option value="open">Open</option>
                <option value="in_progress">In Progress</option>
                <option value="escalated">Escalated</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="all">All Priority</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </CardTitle>
        </CardHeader>
      </Card>

      {/* Tickets Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Support Tickets</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredTickets.length === 0 ? (
            <div className="text-center py-8">
              <MessageSquare className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-500">
                {searchTerm || statusFilter !== 'all' || priorityFilter !== 'all' 
                  ? 'No tickets found matching your filters' 
                  : 'No tickets found'}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ticket #</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTickets.map((ticket) => (
                  <TableRow key={ticket.id}>
                    <TableCell className="font-mono text-sm">
                      {ticket.ticket_number}
                    </TableCell>
                    <TableCell className="font-medium">
                      <div>
                        <div className="font-semibold">{ticket.title}</div>
                        <div className="text-sm text-gray-500 max-w-xs truncate">
                          {ticket.description}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{ticket.user?.full_name || 'Unknown User'}</div>
                        <div className="text-sm text-gray-500">{ticket.user?.email}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getTypeBadge(ticket.type)}
                    </TableCell>
                    <TableCell>
                      {getPriorityBadge(ticket.priority)}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(ticket.status)}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {new Date(ticket.created_at).toLocaleDateString()}
                        <div className="text-xs text-gray-500">
                          {new Date(ticket.created_at).toLocaleTimeString()}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => fetchChatLogs(ticket)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                        {ticket.status === 'open' && (
                          <Button
                            size="sm"
                            onClick={() => {
                              setSelectedTicket(ticket);
                              setShowResponseModal(true);
                            }}
                          >
                            <Send className="h-4 w-4 mr-1" />
                            Respond
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Ticket Detail Modal */}
      {selectedTicket && !showResponseModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-2xl font-bold">Ticket #{selectedTicket.ticket_number}</h2>
                <p className="text-gray-500">{selectedTicket.title}</p>
              </div>
              <div className="flex items-center space-x-2">
                {getPriorityBadge(selectedTicket.priority)}
                {getStatusBadge(selectedTicket.status)}
                <Button variant="ghost" size="sm" onClick={() => setSelectedTicket(null)}>
                  ×
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Ticket Details */}
              <div>
                <Card>
                  <CardHeader>
                    <CardTitle>Ticket Details</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <span className="text-sm text-gray-500">Description</span>
                        <p className="font-medium">{selectedTicket.description}</p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-500">Type</span>
                        <p>{getTypeBadge(selectedTicket.type)}</p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-500">Category</span>
                        <p className="font-medium capitalize">{selectedTicket.category}</p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-500">Reported By</span>
                        <div>
                          <p className="font-medium">{selectedTicket.user?.full_name}</p>
                          <p className="text-sm text-gray-500">{selectedTicket.user?.email}</p>
                          <p className="text-sm text-gray-500">{selectedTicket.user?.phone}</p>
                        </div>
                      </div>
                      <div>
                        <span className="text-sm text-gray-500">Created</span>
                        <p className="font-medium">{new Date(selectedTicket.created_at).toLocaleString()}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Actions */}
                <Card className="mt-4">
                  <CardHeader>
                    <CardTitle>Actions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {selectedTicket.status === 'open' && (
                        <Button
                          onClick={() => setShowResponseModal(true)}
                          className="w-full"
                        >
                          <Send className="h-4 w-4 mr-1" />
                          Respond to Ticket
                        </Button>
                      )}
                      {selectedTicket.status === 'in_progress' && (
                        <Button
                          onClick={() => handleTicketAction(selectedTicket.id, {
                            message: 'Ticket resolved successfully',
                            status: 'resolved'
                          })}
                          className="w-full bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Mark as Resolved
                        </Button>
                      )}
                      {selectedTicket.status === 'open' && (
                        <Button
                          onClick={() => handleTicketAction(selectedTicket.id, {
                            message: 'Ticket escalated to senior support',
                            status: 'escalated'
                          })}
                          variant="outline"
                          className="w-full"
                        >
                          <AlertTriangle className="h-4 w-4 mr-1" />
                          Escalate Ticket
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Chat Logs */}
              <div>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <MessageSquare className="h-5 w-5 mr-2" />
                      Contextual Chat Logs
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {selectedTicket.chat_logs && selectedTicket.chat_logs.length > 0 ? (
                      <div className="space-y-3 max-h-96 overflow-y-auto">
                        {selectedTicket.chat_logs.map((message) => (
                          <div
                            key={message.id}
                            className={`flex items-start space-x-3 p-3 rounded-lg ${
                              message.sender_id === selectedTicket.user_id
                                ? 'bg-blue-50'
                                : 'bg-gray-50'
                            }`}
                          >
                            <div className="flex-shrink-0">
                              <User className="h-4 w-4 text-gray-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <p className="text-sm font-medium">
                                  {message.sender?.full_name || 'Unknown User'}
                                </p>
                                <span className="text-xs text-gray-500">
                                  {new Date(message.timestamp).toLocaleString()}
                                </span>
                              </div>
                              <p className="text-sm text-gray-700 mt-1">{message.message}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <MessageSquare className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                        <p className="text-gray-500">No chat logs available for this ticket</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Response Modal */}
      {showResponseModal && selectedTicket && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">Respond to Ticket #{selectedTicket.ticket_number}</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Response Message</label>
                <Textarea
                  value={responseMessage}
                  onChange={(e) => setResponseMessage(e.target.value)}
                  placeholder="Enter your response..."
                  rows={4}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Update Status</label>
                <select
                  value={selectedTicket.status}
                  onChange={(e) => setSelectedTicket({...selectedTicket, status: e.target.value as any})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="open">Open</option>
                  <option value="in_progress">In Progress</option>
                  <option value="escalated">Escalated</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <Button variant="outline" onClick={() => setShowResponseModal(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => handleTicketAction(selectedTicket.id, {
                  message: responseMessage,
                  status: selectedTicket.status
                })}
              >
                <Send className="h-4 w-4 mr-1" />
                Send Response
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
