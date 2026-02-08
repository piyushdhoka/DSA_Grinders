import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { updateDailyStatsForUser } from '@/lib/leetcode';

export async function POST(req: NextRequest) {
    try {
        const user = await getCurrentUser(req);

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (user.id === 'manual_admin') {
            return NextResponse.json({ message: 'Admin stats not available' });
        }

        // Update stats for the current regular user
        // user.id is now a UUID string
        const regularUser = user as { id: string; leetcodeUsername: string };
        const stat = await updateDailyStatsForUser(regularUser.id, regularUser.leetcodeUsername);

        return NextResponse.json({
            message: 'Stats refreshed',
            todayPoints: stat.todayPoints,
            total: stat.total,
        });
    } catch (error: any) {
        console.error('Refresh error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
