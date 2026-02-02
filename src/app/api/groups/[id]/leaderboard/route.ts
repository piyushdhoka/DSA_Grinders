import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/db/drizzle';
import { groups, groupMembers, users, dailyStats, settings } from '@/db/schema';
import { eq, and, desc, sql } from 'drizzle-orm';
import { getTodayDate } from '@/lib/utils';

export const GET = requireAuth(async (req: NextRequest, user, context) => {
    try {
        const { id: groupIdStr } = (context as { params: Promise<{ id: string }> }).params ?
            await (context as { params: Promise<{ id: string }> }).params :
            { id: '' };
        const groupId = parseInt(groupIdStr);

        if (isNaN(groupId)) {
            return NextResponse.json({ error: 'Invalid group ID' }, { status: 400 });
        }

        // Verify group exists
        const [group] = await db.select().from(groups).where(eq(groups.id, groupId)).limit(1);
        if (!group) {
            return NextResponse.json({ error: 'Group not found' }, { status: 404 });
        }

        // Manual admin cannot access group leaderboard
        if (typeof user.id === 'string') {
            return NextResponse.json({ error: 'Manual admin cannot access group leaderboard' }, { status: 403 });
        }

        // Verify user is a member
        const [isMember] = await db.select().from(groupMembers).where(and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, user.id))).limit(1);
        if (!isMember) {
            return NextResponse.json({ error: 'You are not a member of this group' }, { status: 403 });
        }

        const today = getTodayDate();

        // Optimized query to fetch all members and their stats in a single go
        const result = await db.execute(sql`
            WITH latest_stats AS (
                SELECT DISTINCT ON (user_id) 
                    user_id,
                    date,
                    easy,
                    medium,
                    hard,
                    total,
                    ranking,
                    avatar,
                    country,
                    streak,
                    last_submission,
                    recent_problems
                FROM daily_stats
                ORDER BY user_id, date DESC
            ),
            today_stats AS (
                SELECT user_id, today_points
                FROM daily_stats
                WHERE date = ${today}
            )
            SELECT 
                u.id,
                u.name,
                u.email,
                u.leetcode_username as "leetcodeUsername",
                u.github,
                u.linkedin,
                COALESCE(t.today_points, 0) as "todayPoints",
                COALESCE(l.easy, 0) as easy,
                COALESCE(l.medium, 0) as medium,
                COALESCE(l.hard, 0) as hard,
                COALESCE(l.total, 0) as "totalProblems",
                COALESCE(l.ranking, 0) as ranking,
                COALESCE(l.avatar, '') as avatar,
                COALESCE(l.country, '') as country,
                COALESCE(l.streak, 0) as streak,
                l.last_submission as "lastSubmission",
                l.recent_problems as "recentProblems"
            FROM group_members gm
            JOIN users u ON gm.user_id = u.id
            LEFT JOIN latest_stats l ON u.id = l.user_id
            LEFT JOIN today_stats t ON u.id = t.user_id
            WHERE gm.group_id = ${groupId}
        `);

        // Transform and sort leaderboard
        const leaderboard = (result.rows as any[]).map((row) => {
            const easy = Number(row.easy) || 0;
            const medium = Number(row.medium) || 0;
            const hard = Number(row.hard) || 0;
            const totalScore = easy * 1 + medium * 3 + hard * 6;

            return {
                id: row.id,
                name: row.name,
                email: row.email,
                leetcodeUsername: row.leetcodeUsername,
                todayPoints: Number(row.todayPoints) || 0,
                totalScore,
                totalProblems: Number(row.totalProblems) || 0,
                easy,
                medium,
                hard,
                ranking: Number(row.ranking) || 0,
                avatar: row.avatar || '',
                country: row.country || '',
                streak: Number(row.streak) || 0,
                lastSubmission: row.lastSubmission || null,
                recentProblems: row.recentProblems || [],
                github: row.github || null,
                linkedin: row.linkedin || null,
                rank: 0,
            };
        });

        // Sort based on type
        const searchParams = new URL(req.url).searchParams;
        const type = searchParams.get('type') || 'daily';

        if (type === 'daily') {
            leaderboard.sort((a, b) => b.todayPoints - a.todayPoints || b.totalScore - a.totalScore);
        } else {
            leaderboard.sort((a, b) => b.totalScore - a.totalScore || b.todayPoints - a.todayPoints);
        }

        // Add rank
        leaderboard.forEach((entry, index) => {
            entry.rank = index + 1;
        });

        // 1. Fetch AI roast for the day
        let dailyRoast = null;
        try {
            const [s] = await db.select({ aiRoast: settings.aiRoast }).from(settings).limit(1);
            if (s?.aiRoast && (s.aiRoast as any).date === today) {
                dailyRoast = s.aiRoast;
            }
        } catch (e) {
            console.error('Failed to fetch daily roast for group leaderboard:', e);
        }

        // 2. Fetch community-wide activities for the last 3 days
        let activities: any[] = [];
        try {
            const threeDaysAgo = new Date();
            threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
            const threeDaysAgoStr = threeDaysAgo.toISOString().split('T')[0];

            const recentStats = await db.execute(sql`
                SELECT 
                    u.name as "userName",
                    u.leetcode_username as "leetcodeUsername",
                    ds.avatar,
                    ds.recent_problems as "recentProblems"
                FROM daily_stats ds
                JOIN users u ON ds.user_id = u.id
                JOIN group_members gm ON u.id = gm.user_id
                WHERE gm.group_id = ${groupId}
                    AND ds.date >= ${threeDaysAgoStr}
                    AND u.role != 'admin'
                    AND u.leetcode_username NOT LIKE 'pending_%'
                ORDER BY ds.date DESC
                LIMIT 50
            `);

            const seenIds = new Set<string>();
            const nowTs = Math.floor(Date.now() / 1000);
            const seventyTwoHoursAgo = nowTs - (3 * 24 * 60 * 60);

            (recentStats.rows as any[]).forEach(row => {
                const problems = Array.isArray(row.recentProblems) ? row.recentProblems : [];
                problems.forEach((p: any) => {
                    const problemTs = Number(p.timestamp);
                    if (!seenIds.has(p.id) && problemTs >= seventyTwoHoursAgo) {
                        seenIds.add(p.id);
                        activities.push({
                            ...p,
                            userName: row.userName,
                            leetcodeUsername: row.leetcodeUsername,
                            avatar: row.avatar
                        });
                    }
                });
            });

            activities.sort((a, b) => Number(b.timestamp) - Number(a.timestamp));
            activities = activities.slice(0, 30);
        } catch (e) {
            console.error('Failed to fetch activities for group leaderboard:', e);
        }

        return NextResponse.json({
            groupName: group.name,
            groupCode: group.code,
            leaderboard,
            dailyRoast,
            activities
        });

    } catch (error: any) {
        console.error('Error fetching group leaderboard:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
});
