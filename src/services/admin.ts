const API_BASE_URL = 'http://localhost:8080/api/v1';

export interface AdminStats {
  total_users: number;
  total_posts: number;
  total_comments: number;
  total_admins: number;
}

export interface CreateAdminRequest {
  name: string;
  email: string;
  password: string;
  role: 'admin' | 'super_admin';
}

export interface Admin {
  id: string;
  name: string;
  email: string;
  role: string;
  is_admin: boolean;
  is_verified: boolean;
  created_at: string;
}

export const adminService = {
  // Get dashboard statistics
  async getDashboardStats(): Promise<AdminStats> {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/stats`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch dashboard stats');
      }

      return await response.json();
    } catch (error) {
      console.error('Dashboard stats error:', error);
      throw error;
    }
  },

  // Get all admins
  async getAdmins(): Promise<Admin[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/admins`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch admins');
      }

      const data = await response.json();
      return data.admins || [];
    } catch (error) {
      console.error('Get admins error:', error);
      throw error;
    }
  },

  // Create new admin
  async createAdmin(adminData: CreateAdminRequest): Promise<Admin> {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/admins`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(adminData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create admin');
      }

      return await response.json();
    } catch (error) {
      console.error('Create admin error:', error);
      throw error;
    }
  },

  // Update admin role
  async updateAdminRole(adminId: string, role: 'admin' | 'super_admin'): Promise<Admin> {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/admins/${adminId}/role`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update admin role');
      }

      return await response.json();
    } catch (error) {
      console.error('Update admin role error:', error);
      throw error;
    }
  },

  // Delete admin
  async deleteAdmin(adminId: string): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/admins/${adminId}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete admin');
      }
    } catch (error) {
      console.error('Delete admin error:', error);
      throw error;
    }
  },
};