import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Camera } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import AppShell from '../components/layout/AppShell';
import Avatar from '../components/ui/Avatar';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import SkeletonLoader from '../components/ui/SkeletonLoader';
import useAuthStore from '../store/authStore';
import { getCategory } from '../utils/categories';

const API_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:5000';

export default function ProfilePage() {
  const { user, accessToken, updateUser } = useAuthStore();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: user?.name || '', bio: user?.bio || '' });
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    axios.get(`${API_URL}/api/users/me/stats`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      withCredentials: true,
    })
      .then(({ data }) => setStats(data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [accessToken]);

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('avatar', file);
    formData.append('name', form.name);

    try {
      const { data } = await axios.patch(`${API_URL}/api/users/profile`, formData, {
        headers: { Authorization: `Bearer ${accessToken}` },
        withCredentials: true,
      });
      updateUser(data.data);
      toast.success('Avatar updated');
    } catch {
      toast.error('Failed to update avatar');
    }
  };

  const handleProfileSave = async () => {
    setSaving(true);
    try {
      const { data } = await axios.patch(
        `${API_URL}/api/users/profile`,
        { name: form.name, bio: form.bio },
        { headers: { Authorization: `Bearer ${accessToken}` }, withCredentials: true }
      );
      updateUser(data.data);
      toast.success('Profile updated');
    } catch {
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async () => {
    const errs = {};
    if (!passwordForm.currentPassword) errs.current = 'Required';
    if (!passwordForm.newPassword || passwordForm.newPassword.length < 6) errs.new = 'Min 6 characters';
    if (passwordForm.newPassword !== passwordForm.confirm) errs.confirm = 'Passwords do not match';
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    try {
      await axios.patch(
        `${API_URL}/api/users/change-password`,
        { currentPassword: passwordForm.currentPassword, newPassword: passwordForm.newPassword },
        { headers: { Authorization: `Bearer ${accessToken}` }, withCredentials: true }
      );
      toast.success('Password changed');
      setPasswordForm({ currentPassword: '', newPassword: '', confirm: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password');
    }
  };

  const topCategory = stats?.top_category ? getCategory(stats.top_category) : null;

  return (
    <AppShell>
      <div className="min-h-screen bg-background pt-8 pb-24 px-4">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center gap-4 mb-8">
            <Link to="/app/map" className="text-gray-400 hover:text-white">
              <ArrowLeft size={20} />
            </Link>
            <h1 className="font-heading text-2xl font-bold">Profile</h1>
          </div>

          <div className="bg-surface border border-border rounded-2xl p-6 mb-6">
            <div className="flex flex-col items-center mb-6">
              <div className="relative">
                <Avatar src={user?.avatar} name={user?.name} size="lg" />
                <label className="absolute bottom-0 right-0 w-8 h-8 bg-accent rounded-full flex items-center justify-center cursor-pointer">
                  <Camera size={14} className="text-black" />
                  <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                </label>
              </div>
              <p className="font-heading font-semibold mt-3">{user?.name}</p>
              <p className="text-sm text-gray-500">{user?.email}</p>
            </div>

            <div className="space-y-4">
              <Input
                label="Name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
              <div>
                <label className="block text-sm text-gray-400 mb-1.5">Bio</label>
                <textarea
                  value={form.bio}
                  onChange={(e) => setForm({ ...form, bio: e.target.value })}
                  rows={3}
                  className="w-full bg-input border border-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-accent resize-none"
                />
              </div>
              <Button variant="primary" onClick={handleProfileSave} loading={saving} className="w-full">
                Save Profile
              </Button>
            </div>
          </div>

          <div className="bg-surface border border-border rounded-2xl p-6 mb-6">
            <h2 className="font-heading font-semibold mb-4">Stats</h2>
            {loading ? (
              <SkeletonLoader className="h-16 w-full" count={2} />
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-input rounded-lg">
                  <p className="text-2xl font-bold text-accent">{stats?.reports_count || 0}</p>
                  <p className="text-xs text-gray-500">Reports Submitted</p>
                </div>
                <div className="p-3 bg-input rounded-lg">
                  <p className="text-2xl font-bold text-safe">{stats?.routes_computed || 0}</p>
                  <p className="text-xs text-gray-500">Routes Computed</p>
                </div>
                <div className="p-3 bg-input rounded-lg">
                  <p className="text-2xl font-bold">{stats?.reputation || 0}</p>
                  <p className="text-xs text-gray-500">Reputation Score</p>
                </div>
                <div className="p-3 bg-input rounded-lg">
                  {topCategory ? (
                    <Badge variant="accent">{topCategory.label}</Badge>
                  ) : (
                    <p className="text-sm text-gray-500">—</p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">Most Reported Category</p>
                </div>
              </div>
            )}
          </div>

          <div className="bg-surface border border-border rounded-2xl p-6">
            <h2 className="font-heading font-semibold mb-4">Change Password</h2>
            <div className="space-y-4">
              <Input
                label="Current Password"
                type="password"
                value={passwordForm.currentPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                error={errors.current}
              />
              <Input
                label="New Password"
                type="password"
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                error={errors.new}
              />
              <Input
                label="Confirm New Password"
                type="password"
                value={passwordForm.confirm}
                onChange={(e) => setPasswordForm({ ...passwordForm, confirm: e.target.value })}
                error={errors.confirm}
              />
              <Button variant="ghost" onClick={handlePasswordChange} className="w-full">
                Update Password
              </Button>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
