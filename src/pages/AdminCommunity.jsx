import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import AdminLayout from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Search, CheckCircle, XCircle, Clock, Save, Loader2, Globe, Eye, X } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const statusColors = {
  enabled: 'bg-green-500/20 text-green-400 border-green-500/30',
  disabled: 'bg-red-500/20 text-red-400 border-red-500/30',
  pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
};

const statusIcons = {
  enabled: CheckCircle,
  disabled: XCircle,
  pending: Clock,
};

export default function AdminCommunity() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  const { data: settings, isLoading: settingsLoading } = useQuery({
    queryKey: ['admin-settings'],
    queryFn: async () => {
      const all = await base44.entities.StoreSettings.list();
      return all[0] || {};
    },
  });

  const { data: users = [], isLoading: usersLoading } = useQuery({
    queryKey: ['community-users'],
    queryFn: async () => {
      const all = await base44.entities.User.list();
      return all.filter(u => u.business_name && u.business_name.trim() !== '');
    },
  });

  const handleToggleCommunity = async (enabled) => {
    if (!settings?.id) return;
    await base44.entities.StoreSettings.update(settings.id, { community_enabled: enabled });
    queryClient.invalidateQueries(['admin-settings']);
    toast.success(enabled ? 'Community section enabled' : 'Community section disabled');
  };

  const handleSaveTitle = async () => {
    if (!settings?.id) return;
    setIsSavingSettings(true);
    await base44.entities.StoreSettings.update(settings.id, { community_title: settings.community_title || 'Community' });
    queryClient.invalidateQueries(['admin-settings']);
    toast.success('Title saved!');
    setIsSavingSettings(false);
  };

  const handleUserStatus = async (user, newStatus) => {
    const snapshot = JSON.stringify({
      business_name: user.business_name,
      description: user.description,
      profile_image_url: user.profile_image_url,
      banner_image_url: user.banner_image_url,
      website_url: user.website_url,
      tiktok_url: user.tiktok_url,
      instagram_url: user.instagram_url,
      facebook_url: user.facebook_url,
    });

    await base44.entities.User.update(user.id, {
      community_status: newStatus,
      community_profile_snapshot: newStatus === 'enabled' ? snapshot : user.community_profile_snapshot,
    });
    queryClient.invalidateQueries(['community-users']);
    toast.success(`User ${newStatus === 'enabled' ? 'approved' : 'disabled'} for community`);
  };

  const filteredUsers = users.filter(u => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      u.business_name?.toLowerCase().includes(q) ||
      u.full_name?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q)
    );
  });

  // Detect if profile changed since approval (pending re-review)
  const hasProfileChanged = (user) => {
    if (user.community_status !== 'enabled' || !user.community_profile_snapshot) return false;
    try {
      const snap = JSON.parse(user.community_profile_snapshot);
      return (
        snap.business_name !== user.business_name ||
        snap.description !== user.description ||
        snap.profile_image_url !== user.profile_image_url ||
        snap.banner_image_url !== user.banner_image_url ||
        snap.website_url !== user.website_url
      );
    } catch {
      return false;
    }
  };

  if (settingsLoading) {
    return (
      <AdminLayout currentPage="AdminCommunity">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-pink-500" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout currentPage="AdminCommunity">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-white">Community</h1>
          <p className="text-zinc-400 mt-1">Manage community member listings shown on the homepage</p>
        </div>

        {/* Settings Card */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-pink-400" />
              Community Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Enable Toggle */}
            <div className="flex items-center justify-between bg-zinc-800 rounded-lg p-4">
              <div>
                <p className="text-zinc-200 text-sm font-medium">Enable Community Section</p>
                <p className="text-zinc-500 text-xs mt-0.5">Show the community section on the homepage</p>
              </div>
              <Switch
                checked={settings?.community_enabled === true}
                onCheckedChange={handleToggleCommunity}
              />
            </div>

            {/* Section Title */}
            <div className="flex gap-3 items-end">
              <div className="flex-1">
                <Label className="text-zinc-200">Section Title</Label>
                <Input
                  value={settings?.community_title || 'Community'}
                  onChange={(e) => queryClient.setQueryData(['admin-settings'], old => ({ ...old, community_title: e.target.value }))}
                  className="bg-zinc-800 border-zinc-600 text-white mt-1"
                  placeholder="Community"
                />
              </div>
              <Button onClick={handleSaveTitle} disabled={isSavingSettings} className="bg-pink-500 hover:bg-pink-600">
                {isSavingSettings ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Users List */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <CardTitle className="text-white">Members with Business Profiles</CardTitle>
              <div className="relative w-64">
                <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <Input
                  placeholder="Search members..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 bg-zinc-800 border-zinc-700 text-white"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {usersLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-pink-500" />
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
                <p className="text-zinc-500">No users with a business name found</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredUsers.map((user) => {
                  const changed = hasProfileChanged(user);
                  const StatusIcon = statusIcons[user.community_status || 'pending'];
                  return (
                    <div key={user.id} className="flex items-center gap-4 bg-zinc-800 rounded-xl p-4">
                      {/* Avatar */}
                      <div className="w-12 h-12 rounded-xl bg-zinc-700 flex-shrink-0 overflow-hidden">
                        {user.profile_image_url ? (
                          <img src={user.profile_image_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-lg font-bold text-zinc-500">
                            {user.business_name?.[0] || '?'}
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-semibold text-sm truncate">{user.business_name}</p>
                        <p className="text-zinc-400 text-xs truncate">{user.full_name} · {user.email}</p>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          {user.website_url && (
                            <a href={user.website_url} target="_blank" rel="noopener noreferrer" className="text-pink-400 text-xs flex items-center gap-1 hover:text-pink-300">
                              <Globe className="w-3 h-3" /> Website
                            </a>
                          )}
                          {changed && (
                            <span className="text-xs text-yellow-400 bg-yellow-500/10 border border-yellow-500/30 px-2 py-0.5 rounded-full">
                              ⚠ Profile updated – re-review needed
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Status Badge */}
                      <Badge className={`border text-xs flex items-center gap-1 ${statusColors[user.community_status || 'pending']}`}>
                        <StatusIcon className="w-3 h-3" />
                        {user.community_status || 'pending'}
                      </Badge>

                      {/* Actions */}
                      <div className="flex gap-2 flex-shrink-0">
                        {user.community_status !== 'enabled' && (
                          <Button
                            size="sm"
                            onClick={() => handleUserStatus(user, 'enabled')}
                            className="bg-green-600 hover:bg-green-700 text-white text-xs h-8"
                          >
                            Enable
                          </Button>
                        )}
                        {user.community_status !== 'disabled' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleUserStatus(user, 'disabled')}
                            className="border-red-500/50 text-red-400 hover:bg-red-500/10 text-xs h-8"
                          >
                            Disable
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}