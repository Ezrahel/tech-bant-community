import { NextRequest } from 'next/server';
import { errorResponse } from '@/lib/api-helpers';

// POST /admin/users/[id]/promote - Deprecated. Use PUT /admin/users/[id] or PUT /admin/admins/[id]/role instead.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    void req;
    void params;
    return errorResponse('This route is deprecated. Use PUT /api/v1/admin/users/[id] with a role, or PUT /api/v1/admin/admins/[id]/role for existing admins.', 410);
}
