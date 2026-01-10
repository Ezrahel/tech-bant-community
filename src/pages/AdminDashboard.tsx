import React, { useState, useEffect } from 'react';
import { 
  Users, 
  MessageSquare, 
  Star, 
  Shield, 
  Plus, 
  Edit, 
  Trash2, 
  X,
  Crown,
  UserCheck,
  TrendingUp,
  Heart,
  Bookmark,
  Image as ImageIcon,
  Activity,
  Loader2
} from 'lucide-react';
import { adminService, AdminStats, Admin, CreateAdminRequest } from '../services/admin';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [formData, setFormData] = useState<CreateAdminRequest>({
    name: '',
    email: '',
    password: '',
    role: 'admin'
  });
  const { user } = useAuth();

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [statsData, adminsData] = await Promise.all([
        adminService.getDashboardStats(),
        adminService.getAdmins()
      ]);
      setStats(statsData);
      setAdmins(adminsData);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setCreateLoading(true);
      await adminService.createAdmin(formData);
      setShowCreateModal(false);
      setFormData({ name: '', email: '', password: '', role: 'admin' });
      await loadDashboardData();
      toast.success('Admin created successfully!');
    } catch (error: any) {
      console.error('Failed to create admin:', error);
      toast.error(error.message || 'Failed to create admin. Please try again.');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleUpdateRole = async (adminId: string, newRole: 'admin' | 'super_admin') => {
    if (user?.id === adminId) {
      toast.error("You cannot change your own role.");
      return;
    }
    try {
      await adminService.updateAdminRole(adminId, newRole);
      await loadDashboardData();
      toast.success('Admin role updated successfully!');
    } catch (error: any) {
      console.error('Failed to update admin role:', error);
      toast.error(error.message || 'Failed to update admin role. Please try again.');
    }
  };

  const handleDeleteAdmin = async (adminId: string) => {
    if (user?.id === adminId) {
      toast.error("You cannot delete your own admin account.");
      return;
    }
    if (window.confirm('Are you sure you want to delete this admin? This action cannot be undone.')) {
      try {
        await adminService.deleteAdmin(adminId);
        await loadDashboardData();
        toast.success('Admin deleted successfully!');
      } catch (error: any) {
        console.error('Failed to delete admin:', error);
        toast.error(error.message || 'Failed to delete admin. Please try again.');
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-white animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="border-b border-gray-800 bg-black/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
              <p className="text-gray-400">Manage the Nothing Community platform</p>
            </div>
            <div className="flex items-center space-x-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                user?.role === 'super_admin' ? 'bg-red-500' : 'bg-blue-500'
              }`}>
                <Crown className="w-4 h-4 text-white" />
              </div>
              <span className="text-sm font-medium">
                {user?.role === 'super_admin' ? 'Super Admin' : 'Admin'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6 hover:bg-gray-900/70 transition-colors">
            <div className="flex items-center justify-between mb-4">
              <Users className="w-8 h-8 text-blue-400" />
              <span className="text-2xl font-bold font-nothing">{stats?.total_users || 0}</span>
            </div>
            <h3 className="text-lg font-semibold mb-1">Total Users</h3>
            <p className="text-gray-400 text-sm">Community members</p>
            {stats && stats.active_users > 0 && (
              <div className="mt-3 flex items-center space-x-2 text-xs text-green-400">
                <Activity className="w-3 h-3" />
                <span>{stats.active_users} active (30 days)</span>
              </div>
            )}
          </div>

          <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6 hover:bg-gray-900/70 transition-colors">
            <div className="flex items-center justify-between mb-4">
              <MessageSquare className="w-8 h-8 text-green-400" />
              <span className="text-2xl font-bold font-nothing">{stats?.total_posts || 0}</span>
            </div>
            <h3 className="text-lg font-semibold mb-1">Total Posts</h3>
            <p className="text-gray-400 text-sm">Community discussions</p>
            {stats && stats.new_posts_today > 0 && (
              <div className="mt-3 flex items-center space-x-2 text-xs text-green-400">
                <TrendingUp className="w-3 h-3" />
                <span>+{stats.new_posts_today} today</span>
              </div>
            )}
          </div>

          <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6 hover:bg-gray-900/70 transition-colors">
            <div className="flex items-center justify-between mb-4">
              <Star className="w-8 h-8 text-purple-400" />
              <span className="text-2xl font-bold font-nothing">{stats?.total_comments || 0}</span>
            </div>
            <h3 className="text-lg font-semibold mb-1">Total Comments</h3>
            <p className="text-gray-400 text-sm">User interactions</p>
            {stats && stats.new_comments_today > 0 && (
              <div className="mt-3 flex items-center space-x-2 text-xs text-green-400">
                <TrendingUp className="w-3 h-3" />
                <span>+{stats.new_comments_today} today</span>
              </div>
            )}
          </div>

          <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6 hover:bg-gray-900/70 transition-colors">
            <div className="flex items-center justify-between mb-4">
              <Shield className="w-8 h-8 text-red-400" />
              <span className="text-2xl font-bold font-nothing">{stats?.total_admins || 0}</span>
            </div>
            <h3 className="text-lg font-semibold mb-1">Total Admins</h3>
            <p className="text-gray-400 text-sm">Platform moderators</p>
          </div>
        </div>

        {/* Additional Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6 hover:bg-gray-900/70 transition-colors">
            <div className="flex items-center justify-between mb-4">
              <TrendingUp className="w-8 h-8 text-yellow-400" />
              <span className="text-2xl font-bold font-nothing">{stats?.new_users_today || 0}</span>
            </div>
            <h3 className="text-lg font-semibold mb-1">New Users Today</h3>
            <p className="text-gray-400 text-sm">Recent signups</p>
          </div>

          <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6 hover:bg-gray-900/70 transition-colors">
            <div className="flex items-center justify-between mb-4">
              <Heart className="w-8 h-8 text-pink-400" />
              <span className="text-2xl font-bold font-nothing">{stats?.total_likes || 0}</span>
            </div>
            <h3 className="text-lg font-semibold mb-1">Total Likes</h3>
            <p className="text-gray-400 text-sm">Post & comment likes</p>
          </div>

          <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6 hover:bg-gray-900/70 transition-colors">
            <div className="flex items-center justify-between mb-4">
              <Bookmark className="w-8 h-8 text-orange-400" />
              <span className="text-2xl font-bold font-nothing">{stats?.total_bookmarks || 0}</span>
            </div>
            <h3 className="text-lg font-semibold mb-1">Total Bookmarks</h3>
            <p className="text-gray-400 text-sm">Saved posts</p>
          </div>

          <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6 hover:bg-gray-900/70 transition-colors">
            <div className="flex items-center justify-between mb-4">
              <ImageIcon className="w-8 h-8 text-cyan-400" />
              <span className="text-2xl font-bold font-nothing">{stats?.total_media || 0}</span>
            </div>
            <h3 className="text-lg font-semibold mb-1">Total Media</h3>
            <p className="text-gray-400 text-sm">Uploaded files</p>
          </div>
        </div>

        {/* Admin Management */}
        <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold font-nothing">Admin Management</h2>
              <p className="text-gray-400 text-sm mt-1">Create and manage admin accounts</p>
            </div>
            {user?.role === 'super_admin' && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center space-x-2 bg-white text-black px-4 py-2 rounded-full hover:bg-gray-200 transition-colors text-sm font-medium"
              >
                <Plus className="w-4 h-4" />
                <span>Create Admin</span>
              </button>
            )}
          </div>

          {admins.length === 0 ? (
            <div className="text-center py-12">
              <Shield className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">No admins found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {admins.map((admin) => (
              <div key={admin.id} className="bg-gray-800/50 border border-gray-700 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      admin.role === 'super_admin' ? 'bg-red-500' : 'bg-blue-500'
                    }`}>
                      {admin.role === 'super_admin' ? (
                        <Crown className="w-5 h-5 text-white" />
                      ) : (
                        <Shield className="w-5 h-5 text-white" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="font-semibold">{admin.name}</h3>
                        {admin.is_verified && (
                          <UserCheck className="w-4 h-4 text-blue-400" />
                        )}
                      </div>
                      <p className="text-gray-400 text-sm">{admin.email}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      admin.role === 'super_admin' 
                        ? 'bg-red-900/30 text-red-400' 
                        : 'bg-blue-900/30 text-blue-400'
                    }`}>
                      {admin.role === 'super_admin' ? 'Super Admin' : 'Admin'}
                    </span>
                    
                    {(user?.role === 'super_admin' && admin.role !== 'super_admin') && (
                      <>
                        <button
                          onClick={() => handleUpdateRole(admin.id, 'super_admin')}
                          className="p-2 text-gray-400 hover:text-yellow-400 transition-colors"
                          title="Promote to Super Admin"
                        >
                          <Crown className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteAdmin(admin.id)}
                          className="p-2 text-gray-400 hover:text-red-400 transition-colors"
                          title="Delete Admin"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                    {admin.role === 'super_admin' && user?.role === 'super_admin' && user?.id !== admin.id && (
                      <button
                        onClick={() => handleUpdateRole(admin.id, 'admin')}
                        className="p-2 text-gray-400 hover:text-blue-400 transition-colors"
                        title="Demote to Admin"
                      >
                        <Shield className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create Admin Modal */}
      {showCreateModal && user?.role === 'super_admin' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowCreateModal(false)}>
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold font-nothing">Create Admin Account</h3>
                <p className="text-gray-400 text-sm mt-1">Add a new administrator to the platform</p>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-2 text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAdmin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-gray-600 transition-colors"
                  placeholder="Enter full name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-gray-600 transition-colors"
                  placeholder="Enter email address"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Password
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-gray-600 transition-colors"
                  placeholder="Enter password"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Role
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as 'admin' | 'super_admin' })}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-gray-600 transition-colors"
                >
                  <option value="admin">Admin</option>
                  <option value="super_admin">Super Admin</option>
                </select>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-3 bg-gray-800 border border-gray-700 text-white rounded-xl hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createLoading}
                  className="flex-1 px-4 py-3 bg-white text-black rounded-xl hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {createLoading ? 'Creating...' : 'Create Admin'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;