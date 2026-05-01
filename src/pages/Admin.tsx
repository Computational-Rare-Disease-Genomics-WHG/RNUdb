import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Shield, CheckCircle, XCircle, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import Header from '../components/Header';
import Footer from '../components/Footer';

interface UserRecord {
  github_login: string;
  name: string;
  email: string;
  avatar_url?: string;
  role: string;
  created_at: string;
  updated_at: string;
}

const Admin: React.FC = () => {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const [pendingUsers, setPendingUsers] = useState<UserRecord[]>([]);
  const [allUsers, setAllUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAdmin) {
      navigate('/');
      return;
    }
    loadUsers();
  }, [isAdmin, navigate]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const [pendingRes, allRes] = await Promise.all([
        fetch('/api/users/pending', { credentials: 'include' }),
        fetch('/api/users', { credentials: 'include' }),
      ]);
      if (pendingRes.ok) setPendingUsers(await pendingRes.json());
      if (allRes.ok) setAllUsers(await allRes.json());
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  const approveUser = async (login: string) => {
    try {
      const res = await fetch(`/api/users/${login}/approve`, {
        method: 'POST',
        credentials: 'include',
      });
      if (res.ok) await loadUsers();
    } catch (error) {
      console.error('Error approving user:', error);
    }
  };

  const rejectUser = async (login: string) => {
    try {
      const res = await fetch(`/api/users/${login}/reject`, {
        method: 'POST',
        credentials: 'include',
      });
      if (res.ok) await loadUsers();
    } catch (error) {
      console.error('Error rejecting user:', error);
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100">{role}</Badge>;
      case 'curator':
        return <Badge className="bg-teal-100 text-teal-800 hover:bg-teal-100">{role}</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">{role}</Badge>;
      default:
        return <Badge variant="secondary">{role}</Badge>;
    }
  };

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header showSearch={false} />
      <div className="max-w-7xl mx-auto px-4 py-6 pt-12 flex-1 w-full">
        <div className="flex items-center gap-3 mb-8">
          <Shield className="h-8 w-8 text-teal-600" />
          <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
        </div>

        {loading ? (
          <div className="space-y-8">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-48 w-full" />
          </div>
        ) : (
          <>
            {/* Pending Approvals */}
            <Card className="shadow-sm border-slate-200 mb-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-yellow-600" />
                  Pending Approvals
                  {pendingUsers.length > 0 && (
                    <Badge className="ml-2 bg-yellow-100 text-yellow-800">{pendingUsers.length}</Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {pendingUsers.length === 0 ? (
                  <p className="text-muted-foreground py-4">No pending approval requests.</p>
                ) : (
                  <div className="space-y-4">
                    {pendingUsers.map((user: UserRecord) => (
                      <div
                        key={user.github_login}
                        className="flex items-center justify-between p-4 bg-yellow-50 rounded-xl border border-yellow-200"
                      >
                        <div className="flex items-center gap-4">
                          {user.avatar_url && (
                            <Avatar>
                              <AvatarImage src={user.avatar_url} alt={user.name} />
                              <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                          )}
                          <div>
                            <div className="font-semibold text-foreground">{user.name}</div>
                            <div className="text-sm text-muted-foreground">
                              @{user.github_login} · {user.email}
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">
                              Requested: {new Date(user.created_at).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => approveUser(user.github_login)}
                            className="bg-teal-600 hover:bg-teal-700 text-white"
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => rejectUser(user.github_login)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Reject
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* All Users */}
            <Card className="shadow-sm border-slate-200">
              <CardHeader>
                <CardTitle>All Users ({allUsers.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead>Last Updated</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allUsers.map((user: UserRecord) => (
                      <TableRow key={user.github_login}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            {user.avatar_url && (
                              <Avatar size="sm">
                                <AvatarImage src={user.avatar_url} alt={user.name} />
                                <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                              </Avatar>
                            )}
                            <div>
                              <div className="font-medium text-foreground">{user.name}</div>
                              <div className="text-sm text-muted-foreground">@{user.github_login}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{getRoleBadge(user.role)}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(user.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(user.updated_at).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default Admin;
