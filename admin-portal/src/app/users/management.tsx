"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Users,
  UserPlus,
  Search,
  Filter,
  MoreVertical,
  Shield,
  UserCheck,
  UserX,
  Edit,
  Trash2,
  Eye,
  Mail,
  Phone,
  Calendar
} from "lucide-react";
import { ProtectedRoute } from "@/components/protected-route";

interface User {
  id: string;
  email: string;
  fullName: string;
  role: 'super_admin' | 'admin' | 'manager' | 'sales_rep' | 'support_agent';
  status: 'active' | 'suspended' | 'pending';
  department: string;
  lastLogin: string;
  createdAt: string;
  phone?: string;
  permissions: string[];
}

const ROLES = {
  super_admin: { label: 'Super Admin', color: 'bg-red-100 text-red-800', permissions: ['all'] },
  admin: { label: 'Admin', color: 'bg-orange-100 text-orange-800', permissions: ['users', 'settings', 'reports'] },
  manager: { label: 'Manager', color: 'bg-blue-100 text-blue-800', permissions: ['team', 'reports'] },
  sales_rep: { label: 'Sales Rep', color: 'bg-green-100 text-green-800', permissions: ['leads', 'deals'] },
  support_agent: { label: 'Support Agent', color: 'bg-purple-100 text-purple-800', permissions: ['tickets', 'knowledge_base'] },
};

const DEPARTMENTS = ['Management', 'Sales', 'Support', 'IT', 'Marketing', 'Operations'];

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');

  // Demo data for development
  useEffect(() => {
    const demoUsers: User[] = [
      {
        id: '1',
        email: 'admin@linkcab.in',
        fullName: 'Admin User',
        role: 'super_admin',
        status: 'active',
        department: 'Management',
        lastLogin: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(),
        phone: '+91 98765 43210',
        permissions: ['all']
      },
      {
        id: '2',
        email: 'john.manager@linkcab.in',
        fullName: 'John Manager',
        role: 'manager',
        status: 'active',
        department: 'Sales',
        lastLogin: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        createdAt: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString(),
        phone: '+91 87654 32109',
        permissions: ['team', 'reports']
      },
      {
        id: '3',
        email: 'sarah.sales@linkcab.in',
        fullName: 'Sarah Sales',
        role: 'sales_rep',
        status: 'active',
        department: 'Sales',
        lastLogin: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
        phone: '+91 76543 21098',
        permissions: ['leads', 'deals']
      },
      {
        id: '4',
        email: 'mike.support@linkcab.in',
        fullName: 'Mike Support',
        role: 'support_agent',
        status: 'suspended',
        department: 'Support',
        lastLogin: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
        phone: '+91 65432 10987',
        permissions: ['tickets', 'knowledge_base']
      },
      {
        id: '5',
        email: 'lisa.admin@linkcab.in',
        fullName: 'Lisa Admin',
        role: 'admin',
        status: 'pending',
        department: 'IT',
        lastLogin: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        phone: '+91 54321 09876',
        permissions: ['users', 'settings', 'reports']
      }
    ];

    setUsers(demoUsers);
    setLoading(false);
  }, []);

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = selectedRole === 'all' || user.role === selectedRole;
    const matchesStatus = selectedStatus === 'all' || user.status === selectedStatus;
    const matchesDepartment = selectedDepartment === 'all' || user.department === selectedDepartment;

    return matchesSearch && matchesRole && matchesStatus && matchesDepartment;
  });

  const handleStatusChange = (userId: string, newStatus: 'active' | 'suspended' | 'pending') => {
    setUsers(prev => prev.map(user =>
      user.id === userId ? { ...user, status: newStatus } : user
    ));
  };

  const handleRoleChange = (userId: string, newRole: keyof typeof ROLES) => {
    setUsers(prev => prev.map(user =>
      user.id === userId ? {
        ...user,
        role: newRole,
        permissions: ROLES[newRole].permissions
      } : user
    ));
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="p-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
            <div className="h-96 bg-gray-200 rounded"></div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="p-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-black">User & Role Management</h1>
          <Button className="bg-yellow-400 hover:bg-yellow-500 text-black">
            <UserPlus className="h-4 w-4 mr-2" />
            Add User
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="border-gray-200 shadow-md">
            <CardContent className="p-6">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-blue-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Users</p>
                  <p className="text-2xl font-bold text-black">{users.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-200 shadow-md">
            <CardContent className="p-6">
              <div className="flex items-center">
                <UserCheck className="h-8 w-8 text-green-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Active Users</p>
                  <p className="text-2xl font-bold text-black">
                    {users.filter(u => u.status === 'active').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-200 shadow-md">
            <CardContent className="p-6">
              <div className="flex items-center">
                <UserX className="h-8 w-8 text-red-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Suspended</p>
                  <p className="text-2xl font-bold text-black">
                    {users.filter(u => u.status === 'suspended').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-200 shadow-md">
            <CardContent className="p-6">
              <div className="flex items-center">
                <Shield className="h-8 w-8 text-yellow-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Admins</p>
                  <p className="text-2xl font-bold text-black">
                    {users.filter(u => u.role === 'admin' || u.role === 'super_admin').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="border-gray-200 shadow-md mb-6">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  {Object.entries(ROLES).map(([key, value]) => (
                    <SelectItem key={key} value={key}>{value.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>

              <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  {DEPARTMENTS.map(dept => (
                    <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card className="border-gray-200 shadow-md">
          <CardHeader>
            <CardTitle className="text-black">Users</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-black">User</TableHead>
                  <TableHead className="text-black">Role</TableHead>
                  <TableHead className="text-black">Department</TableHead>
                  <TableHead className="text-black">Status</TableHead>
                  <TableHead className="text-black">Last Login</TableHead>
                  <TableHead className="text-black">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium text-black">{user.fullName}</p>
                        <p className="text-sm text-gray-600">{user.email}</p>
                        {user.phone && (
                          <p className="text-xs text-gray-500 flex items-center mt-1">
                            <Phone className="h-3 w-3 mr-1" />
                            {user.phone}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={ROLES[user.role].color}>
                        {ROLES[user.role].label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-gray-700">{user.department}</TableCell>
                    <TableCell>
                      <Select
                        value={user.status}
                        onValueChange={(value: 'active' | 'suspended' | 'pending') =>
                          handleStatusChange(user.id, value)
                        }
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue>
                            <Badge variant="secondary" className={
                              user.status === 'active' ? 'bg-green-100 text-green-800' :
                                user.status === 'suspended' ? 'bg-red-100 text-red-800' :
                                  'bg-yellow-100 text-yellow-800'
                            }>
                              {user.status}
                            </Badge>
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="suspended">Suspended</SelectItem>
                          <SelectItem value="pending">Pending</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-gray-700">
                      {new Date(user.lastLogin).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </ProtectedRoute>
  );
}
