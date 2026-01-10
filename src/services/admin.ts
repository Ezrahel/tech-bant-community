// Admin service using Go backend API
import { apiClient } from '../lib/api';

export interface AdminStats {
  total_users: number;
  total_posts: number;
  total_comments: number;
  total_admins: number;
  active_users: number;
  new_users_today: number;
  new_posts_today: number;
  new_comments_today: number;
  total_likes: number;
  total_bookmarks: number;
  total_media: number;
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

export interface GetAdminsParams {
  limit?: number;
  offset?: number;
}

class AdminService {
  // Get dashboard statistics
  async getDashboardStats(): Promise<AdminStats> {
    return apiClient.get<AdminStats>('/admin/stats');
  }

  // Get all admins
  async getAdmins(params: GetAdminsParams = {}): Promise<Admin[]> {
    const queryParams = new URLSearchParams();
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.offset) queryParams.append('offset', params.offset.toString());

    const query = queryParams.toString();
    const response = await apiClient.get<{ admins: Admin[] }>(
      `/admin/admins${query ? `?${query}` : ''}`
    );
    return response.admins || [];
  }

  // Create new admin (super admin only)
  async createAdmin(adminData: CreateAdminRequest): Promise<Admin> {
    return apiClient.post<Admin>('/admin/admins', adminData);
  }

  // Update admin role (super admin only)
  async updateAdminRole(
    adminId: string,
    role: 'admin' | 'super_admin'
  ): Promise<Admin> {
    return apiClient.put<Admin>(`/admin/admins/${adminId}/role`, { role });
  }

  // Delete admin (super admin only)
  async deleteAdmin(adminId: string): Promise<void> {
    await apiClient.delete(`/admin/admins/${adminId}`);
  }
}

export const adminService = new AdminService();
