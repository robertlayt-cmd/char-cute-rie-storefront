import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import AdminLayout from '@/components/admin/AdminLayout';
import AdminGuard from '@/components/admin/AdminGuard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, Mail, Shield, User, UserPlus, ExternalLink, Pencil, ChevronLeft, ChevronRight } from 'lucide-react';
import { createPageUrl } from '@/utils';
import { Link } from 'react-router-dom';

export default function AdminUsers() {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('user');
  const [inviting, setInviting] = useState(false);
  const [inviteMsg, setInviteMsg] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const queryClient = useQueryClient();

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => base44.entities.User.list('-created_date', 100),
  });

  const updateRole = useMutation({
    mutationFn: ({ id, role }) => base44.entities.User.update(id, { role }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-users'] }),
  });

  const handleInvite = async () => {
    if (!inviteEmail) return;
    setInviting(true);
    setInviteMsg('');
    try {
      await base44.users.inviteUser(inviteEmail, inviteRole);
      setInviteMsg('Invitation sent to ' + inviteEmail);
      setInviteEmail('');
    } catch (e) {
      setInviteMsg('Error: ' + e.message);
    }
    setInviting(false);
  };

  const filtered = users.filter(u => {
    const matchesSearch = u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const totalPages = Math.ceil(filtered.length / pageSize);
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  return (
    <AdminGuard>
      <AdminLayout currentPage="AdminUsers">
        <div className="max-w-5xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white">User Management</h1>
            <p className="text-zinc-400">Manage customer accounts and admin access</p>
          </div>

          {/* Invite */}
          <Card className="bg-zinc-900 border-zinc-800 mb-8">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-pink-400" />
                Invite User
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-3 flex-wrap">
                <Input
                  placeholder="Email address"
                  value={inviteEmail}
                  onChange={e => setInviteEmail(e.target.value)}
                  className="bg-zinc-800 border-zinc-700 text-white flex-1 min-w-48"
                />
                <Select value={inviteRole} onValueChange={setInviteRole}>
                  <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white w-36">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-800 border-zinc-700">
                    <SelectItem value="user" className="text-white focus:bg-zinc-700">Customer</SelectItem>
                    <SelectItem value="admin" className="text-white focus:bg-zinc-700">Admin</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={handleInvite} disabled={inviting} className="bg-pink-500 hover:bg-pink-600">
                  {inviting ? 'Sending…' : 'Send Invite'}
                </Button>
              </div>
              {inviteMsg && <p className="mt-3 text-sm text-zinc-300">{inviteMsg}</p>}
            </CardContent>
          </Card>

          {/* Search + Filters */}
          <div className="flex flex-wrap gap-3 mb-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <Input
                placeholder="Search by name or email…"
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}
                className="pl-10 bg-zinc-900 border-zinc-700 text-white"
              />
            </div>
            <Select value={roleFilter} onValueChange={v => { setRoleFilter(v); setPage(1); }}>
              <SelectTrigger className="w-36 bg-zinc-900 border-zinc-700 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-zinc-800 border-zinc-700">
                <SelectItem value="all" className="text-white focus:bg-zinc-700">All Roles</SelectItem>
                <SelectItem value="user" className="text-white focus:bg-zinc-700">User</SelectItem>
                <SelectItem value="admin" className="text-white focus:bg-zinc-700">Admin</SelectItem>
              </SelectContent>
            </Select>
            <Select value={String(pageSize)} onValueChange={v => { setPageSize(Number(v)); setPage(1); }}>
              <SelectTrigger className="w-36 bg-zinc-900 border-zinc-700 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-zinc-800 border-zinc-700">
                <SelectItem value="10" className="text-white focus:bg-zinc-700">10 per page</SelectItem>
                <SelectItem value="20" className="text-white focus:bg-zinc-700">20 per page</SelectItem>
                <SelectItem value="50" className="text-white focus:bg-zinc-700">50 per page</SelectItem>
                <SelectItem value="100" className="text-white focus:bg-zinc-700">100 per page</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Users List */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="p-0">
              {isLoading ? (
                <p className="text-zinc-400 text-center py-12">Loading…</p>
              ) : filtered.length === 0 ? (
                <p className="text-zinc-400 text-center py-12">No users found</p>
              ) : (
                <div className="divide-y divide-zinc-800">
                  {paginated.map(user => (
                    <div key={user.id} className="flex items-center gap-4 p-4">
                      {user.profile_image_url ? (
                        <img src={user.profile_image_url} className="w-10 h-10 rounded-full object-cover" alt="" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-zinc-700 flex items-center justify-center">
                          <User className="w-5 h-5 text-zinc-400" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-medium truncate">{user.full_name || '—'}</p>
                        <p className="text-zinc-400 text-sm truncate flex items-center gap-1">
                          <Mail className="w-3 h-3" />{user.email}
                        </p>
                        {user.business_name && (
                          <p className="text-pink-400 text-xs mt-0.5">{user.business_name}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge className={user.role === 'admin' ? 'bg-pink-500/20 text-pink-400 border-pink-500/30' : 'bg-zinc-700 text-zinc-300'}>
                          {user.role === 'admin' ? <><Shield className="w-3 h-3 mr-1" />Admin</> : 'Customer'}
                        </Badge>
                        <Select
                          value={user.role || 'user'}
                          onValueChange={(val) => updateRole.mutate({ id: user.id, role: val })}
                        >
                          <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white w-32 h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-zinc-800 border-zinc-700">
                            <SelectItem value="user" className="text-white focus:bg-zinc-700 text-xs">Customer</SelectItem>
                            <SelectItem value="admin" className="text-white focus:bg-zinc-700 text-xs">Admin</SelectItem>
                          </SelectContent>
                        </Select>
                        <Link to={`${createPageUrl('Profile')}?userId=${user.id}`}>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 hover:text-white" title="View/Edit Profile">
                            <Pencil className="w-4 h-4" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-zinc-400 text-sm">{filtered.length} users · page {page} of {totalPages}</p>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 hover:text-white" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1).map((p, idx, arr) => (
                  <React.Fragment key={p}>
                    {idx > 0 && arr[idx - 1] !== p - 1 && <span className="text-zinc-600">…</span>}
                    <Button
                      variant="ghost"
                      size="icon"
                      className={`h-8 w-8 text-sm ${page === p ? 'bg-pink-500 text-white' : 'text-zinc-400 hover:text-white'}`}
                      onClick={() => setPage(p)}
                    >
                      {p}
                    </Button>
                  </React.Fragment>
                ))}
                <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 hover:text-white" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </AdminLayout>
    </AdminGuard>
  );
}