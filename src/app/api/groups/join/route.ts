import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, AuthUser } from '@/lib/auth';
import { db } from '@/db/drizzle';
import { groups, groupMembers } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

export const POST = requireAuth(async (req: NextRequest, user: AuthUser) => {
    try {
        const { code } = await req.json();

        if (!code) {
            return NextResponse.json({ error: 'Group code is required' }, { status: 400 });
        }

        const normalizedCode = code.toUpperCase();

        // Find group by code
        const [group] = await db.select().from(groups).where(eq(groups.code, normalizedCode)).limit(1);

        if (!group) {
            return NextResponse.json({ error: 'Invalid group code' }, { status: 404 });
        }

        // Check if already a member of this specific group
        const [existingMembership] = await db.select()
            .from(groupMembers)
            .where(and(
                eq(groupMembers.userId, Number(user.id)),
                eq(groupMembers.groupId, group.id)
            ))
            .limit(1);

        if (existingMembership) {
            return NextResponse.json({ error: 'You are already a member of this group' }, { status: 400 });
        }

        // Add user to group via join table (supports multi-group membership)
        await db.insert(groupMembers).values({
            userId: Number(user.id),
            groupId: group.id,
        });

        return NextResponse.json({
            success: true,
            message: `Successfully joined ${group.name}`,
            group
        });

    } catch (error: any) {
        console.error('Error joining group:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
});
