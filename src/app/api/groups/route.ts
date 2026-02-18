import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, AuthUser } from '@/lib/auth';
import { db } from '@/db/drizzle';
import { groups, groupMembers, users } from '@/db/schema';
import { eq, desc, sql } from 'drizzle-orm';

// Generate a random 6-character alphanumeric code
function generateGroupCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

// GET: List all groups the current user is a member of (with member counts)
export const GET = requireAuth(async (req: NextRequest, user: AuthUser) => {
    try {
        // Fetch all groups the user is a member of via the join table
        const userGroups = await db.select({
            id: groups.id,
            code: groups.code,
            name: groups.name,
            description: groups.description,
            owner: groups.owner,
            createdAt: groups.createdAt,
            ownerName: users.name,
        })
            .from(groupMembers)
            .innerJoin(groups, eq(groupMembers.groupId, groups.id))
            .leftJoin(users, eq(groups.owner, users.id))
            .where(eq(groupMembers.userId, Number(user.id)))
            .orderBy(desc(groups.createdAt));

        // Get member counts for each group
        const groupIds = userGroups.map(g => g.id);

        let memberCounts: Record<string, number> = {};
        if (groupIds.length > 0) {
            const counts = await db.select({
                groupId: groupMembers.groupId,
                count: sql<number>`count(*)::int`
            })
                .from(groupMembers)
                .groupBy(groupMembers.groupId);

            counts.forEach(c => {
                memberCounts[c.groupId] = c.count;
            });
        }

        // Merge member counts into response
        const groupsWithCounts = userGroups.map(g => ({
            ...g,
            memberCount: memberCounts[g.id] || 0,
            isOwner: g.owner === user.id,
        }));

        return NextResponse.json({ groups: groupsWithCounts });
    } catch (error: any) {
        console.error('Error fetching groups:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
});

// POST: Create a new group
export const POST = requireAuth(async (req: NextRequest, user: AuthUser) => {
    try {
        const { name, description } = await req.json();

        if (!name) {
            return NextResponse.json({ error: 'Group name is required' }, { status: 400 });
        }

        // Generate unique code
        let code = generateGroupCode();
        let isUnique = false;
        let attempts = 0;

        while (!isUnique && attempts < 10) {
            const [existing] = await db.select().from(groups).where(eq(groups.code, code)).limit(1);
            if (!existing) {
                isUnique = true;
            } else {
                code = generateGroupCode();
                attempts++;
            }
        }

        if (!isUnique) {
            throw new Error('Failed to generate unique group code. Please try again.');
        }

        // Create group and add creator as first member
        const group = await db.transaction(async (tx) => {
            const [newGroup] = await tx.insert(groups).values({
                name,
                code,
                description,
                owner: user.id as number,
            }).returning();

            // Add creator to group_members join table
            await tx.insert(groupMembers).values({
                userId: Number(user.id),
                groupId: newGroup.id,
            });

            return newGroup;
        });

        return NextResponse.json({
            group: { ...group, memberCount: 1, isOwner: true },
            message: 'Group created successfully. You have been added as a member.'
        });

    } catch (error: any) {
        console.error('Error creating group:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
});
