import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/drizzle';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { requireAdmin } from '@/lib/auth';
import { updateDailyStatsForUser } from '@/lib/leetcode';

export const POST = requireAdmin(async (req: NextRequest) => {
    try {
        const body = await req.json();
        const { userId } = body;

        if (!userId) {
            return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
        }

        // Fetch user to get username
        const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        if (user.leetcodeUsername.startsWith('pending_')) {
            return NextResponse.json({ error: 'Cannot sync pending user' }, { status: 400 });
        }

        // Trigger sync
        const result = await updateDailyStatsForUser(user.id, user.leetcodeUsername);

        return NextResponse.json({
            success: true,
            message: 'User stats synced successfully',
            data: result
        });

    } catch (error: any) {
        console.error('Admin sync error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
});
