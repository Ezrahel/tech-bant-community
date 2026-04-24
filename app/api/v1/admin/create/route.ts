import { NextRequest } from 'next/server';
import { errorResponse } from '@/lib/api-helpers';

// POST /admin/create - Deprecated. Use POST /admin/admins instead.
export async function POST(req: NextRequest) {
    void req;
    return errorResponse('This route is deprecated. Use POST /api/v1/admin/admins instead.', 410);
}
