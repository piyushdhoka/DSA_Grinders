import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/db/drizzle';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';

export const POST = requireAuth(async (req: NextRequest, user: any) => {
    try {
        const body = await req.json();
        const { leetcodeUsername, phoneNumber, github, linkedin, gfgUsername, roastIntensity, onboardingCompleted } = body;

        console.log('Onboarding data:', { userId: user.id, leetcodeUsername, phoneNumber, github, linkedin, gfgUsername });

        // Build update object
        const updateData: any = {
            phoneNumber,
            onboardingCompleted: onboardingCompleted ?? true
        };

        // Only update leetcodeUsername if provided and not already set properly
        if (leetcodeUsername && user.leetcodeUsername?.startsWith('pending_')) {
            updateData.leetcodeUsername = leetcodeUsername;
        }

        // Update optional fields
        if (github !== undefined) updateData.github = github || 'pending';
        if (linkedin !== undefined) updateData.linkedin = linkedin || null;
        if (gfgUsername !== undefined) updateData.gfgUsername = gfgUsername || null;
        if (roastIntensity !== undefined) updateData.roastIntensity = roastIntensity || 'medium';

        // Update user with onboarding data
        const [updatedUser] = await db
            .update(users)
            .set(updateData)
            .where(eq(users.id, user.id))
            .returning();

        if (!updatedUser) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, user: updatedUser });
    } catch (error: any) {
        console.error('Onboarding error:', error);

        // Handle duplicate username error
        if (error?.code === '23505' && error?.constraint === 'users_leetcode_username_unique') {
            return NextResponse.json({ error: 'This LeetCode username is already taken by another user' }, { status: 409 });
        }

        return NextResponse.json({ error: 'Failed to complete onboarding' }, { status: 500 });
    }
});
