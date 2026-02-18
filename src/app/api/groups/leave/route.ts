import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, AuthUser } from '@/lib/auth';
import { db } from '@/db/drizzle';
import { groups, groupMembers, users } from '@/db/schema';
import { eq, and, sql } from 'drizzle-orm';

export const POST = requireAuth(async (req: NextRequest, user: AuthUser) => {
    try {
        const { groupId } = await req.json();

        if (!groupId) {
            return NextResponse.json({ error: 'Group ID is required' }, { status: 400 });
        }

        // Check if user is a member of this group
        const [membership] = await db.select()
            .from(groupMembers)
            .where(and(
                eq(groupMembers.userId, Number(user.id)),
                eq(groupMembers.groupId, groupId)
            ))
            .limit(1);

        if (!membership) {
            return NextResponse.json({ error: 'You are not a member of this group' }, { status: 400 });
        }

        // Check if user is the owner of the group
        const [group] = await db.select().from(groups).where(eq(groups.id, groupId)).limit(1);

        if (!group) {
            return NextResponse.json({ error: 'Group not found' }, { status: 404 });
        }

        if (group.owner === user.id) {
            // Count remaining members
            const [memberCount] = await db.select({ count: sql<number>`count(*)::int` })
                .from(groupMembers)
                .where(eq(groupMembers.groupId, groupId));

            if ((memberCount?.count || 0) > 1) {
                return NextResponse.json({
                    error: 'You are the owner. Transfer ownership or delete the group instead.'
                }, { status: 400 });
            }

            // If owner is the only member, delete the group entirely
            await db.transaction(async (tx) => {
                await tx.delete(groupMembers).where(eq(groupMembers.groupId, groupId));
                await tx.delete(groups).where(eq(groups.id, groupId));
            });

            return NextResponse.json({
                success: true,
                message: 'Group deleted (you were the only member)',
                groupDeleted: true
            });
        }

        // Regular member leaving
        await db.delete(groupMembers)
            .where(and(
                eq(groupMembers.userId, Number(user.id)),
                eq(groupMembers.groupId, groupId)
            ));

        return NextResponse.json({
            success: true,
            message: `Successfully left ${group.name}`
        });

    } catch (error: any) {
        console.error('Error leaving group:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
});
