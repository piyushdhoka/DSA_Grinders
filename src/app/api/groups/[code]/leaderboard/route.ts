import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/db/drizzle';
import { groups, groupMembers, users } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

export const GET = requireAuth(async (req: NextRequest, user, context) => {
    try {
        const { code } = (context as { params: Promise<{ code: string }> }).params ?
            await (context as { params: Promise<{ code: string }> }).params :
            { code: '' };

        if (!code) {
            return NextResponse.json({ error: 'Group code is required' }, { status: 400 });
        }

        // Verify group exists
        const [group] = await db.select().from(groups).where(eq(groups.code, code)).limit(1);
        if (!group) {
            return NextResponse.json({ error: 'Group not found' }, { status: 404 });
        }

        // Verify user is a member of THIS group via join table
        const [isMember] = await db.select()
            .from(groupMembers)
            .where(and(
                eq(groupMembers.userId, user.id),
                eq(groupMembers.groupId, group.id)
            ))
            .limit(1);

        if (!isMember && user.role !== 'admin') {
            return NextResponse.json({ error: 'You are not a member of this group' }, { status: 403 });
        }

        // Fetch all members of this group with their stats via join table
        const members = await db.select({
            id: users.id,
            name: users.name,
            email: users.email,
            leetcodeUsername: users.leetcodeUsername,
            gfgUsername: users.gfgUsername,
            github: users.github,
            linkedin: users.linkedin,
            todayPoints: users.todayPoints,
            easy: users.easySolved,
            medium: users.mediumSolved,
            hard: users.hardSolved,
            totalProblems: users.totalSolved,
            gfgSolved: users.gfgSolved,
            gfgScore: users.gfgScore,
            ranking: users.ranking,
            avatar: users.avatar,
            country: users.country,
            streak: users.streak,
            lastSubmission: users.lastSubmission,
            recentProblems: users.recentProblems,
            lastUpdated: users.lastStatUpdate,
        })
            .from(groupMembers)
            .innerJoin(users, eq(groupMembers.userId, users.id))
            .where(eq(groupMembers.groupId, group.id));

        // Transform and sort
        const leaderboardData = members.map(m => {
            const easy = m.easy || 0;
            const medium = m.medium || 0;
            const hard = m.hard || 0;
            const totalScore = easy * 1 + medium * 3 + hard * 6;

            return {
                ...m,
                totalScore,
                rank: 0,
            };
        });

        const searchParams = new URL(req.url).searchParams;
        const type = searchParams.get('type') || 'daily';

        if (type === 'daily') {
            leaderboardData.sort((a, b) => (b.todayPoints || 0) - (a.todayPoints || 0) || b.totalScore - a.totalScore);
        } else {
            leaderboardData.sort((a, b) => b.totalScore - a.totalScore || (b.todayPoints || 0) - (a.todayPoints || 0));
        }

        leaderboardData.forEach((entry, index) => {
            entry.rank = index + 1;
        });

        // Collect activities from group members
        let activities: any[] = [];
        const seventyTwoHoursAgo = Math.floor(Date.now() / 1000) - (3 * 24 * 60 * 60);

        leaderboardData.forEach(m => {
            const problems = Array.isArray(m.recentProblems) ? m.recentProblems : [];
            problems.forEach((p: any) => {
                if (Number(p.timestamp) >= seventyTwoHoursAgo) {
                    activities.push({
                        ...p,
                        userName: m.name,
                        leetcodeUsername: m.leetcodeUsername,
                        avatar: m.avatar
                    });
                }
            });
        });

        activities.sort((a, b) => Number(b.timestamp) - Number(a.timestamp));
        activities = activities.slice(0, 50);

        return NextResponse.json({
            groupName: group.name,
            groupCode: group.code,
            leaderboard: leaderboardData,
            activities
        });

    } catch (error: any) {
        console.error('Error fetching group leaderboard:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
});
