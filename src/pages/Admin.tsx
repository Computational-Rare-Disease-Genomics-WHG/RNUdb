import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Shield, CheckCircle, XCircle, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';

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
  const [pendingUsers, setPendingUsers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
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

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-8">
          <Shield className="h-8 w-8 text-teal-600" />
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600 mx-auto mb-4"></div>
            <div className="text-gray-600">Loading users...</div>
          </div>
        ) : (
          <>
            {/* Pending Approvals */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-8">
              <div className="flex items-center gap-2 mb-6">
                <Users className="h-5 w-5 text-yellow-600" />
                <h2 className="text-xl font-semibold text-gray-900">
                  Pending Approvals {pendingUsers.length > 0 && (}
                  <span className="text-yellow-600 ml-2">({pendingUsers.length})</span>
                  {)}
                </h2>
              </div>

              {pendingUsers.length === 0 ? (
                <p className="text-gray-500 py-4">No pending approval requests.</p>
              ) : (
                <div className="space-y-4">
                  {pendingUsers.map((user: UserRecord) => (
                    <div
                      key={user.github_login}
                      className="flex items-center justify-between p-4 bg-yellow-50 rounded-xl border border-yellow-200"
                    >
                      <div className="flex items-center gap-4">
                        {user.avatar_url && (
                          <img src={user.avatar_url} alt={user.name} className="w-10 h-10 rounded-full" />
                        )}
                        <div>
                          <div className="font-semibold text-gray-900">{user.name}</div>
                          <div className="text-sm text-gray-600">
                            @{user.github_login} · {user.email}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
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
                          className="border-red-300 text-red-600 hover:bg-red-50"
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* All Users */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">All Users ({allUsers.length})</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">User</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Role</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Joined</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Last Updated</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allUsers.map((user: UserRecord) => (
                      <tr key={user.github_login} className="border-b border-slate-100">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            {user.avatar_url && (
                              <img src={user.avatar_url} alt={user.name} className="w-8 h-8 rounded-full" />
                            )}
                            <div>
                              <div className="font-medium text-gray-900">{user.name}</div>
                              <div className="text-sm text-gray-600">@{user.github_login}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            user.role === 'admin' 
                              ? 'bg-purple-100 text-purple-800'
                              : user.role === 'curator'
                              ? 'bg-teal-100 text-teal-800'
                              : user.role === 'pending'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {user.role}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600">
                          {new Date(user.created_at).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600">
                          {new Date(user.updated_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Admin;
