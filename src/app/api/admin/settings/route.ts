import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/drizzle';
import { settings } from '@/db/schema';
import { requireAdmin } from '@/lib/auth';
import { eq } from 'drizzle-orm';

export const GET = requireAdmin(async (req: NextRequest) => {
    try {
        let [currentSettings] = await db.select().from(settings).limit(1);

        // If no settings exist yet, create default entry
        if (!currentSettings) {
            [currentSettings] = await db.insert(settings).values({
                automationEnabled: true,
                emailAutomationEnabled: true,
                whatsappAutomationEnabled: true,
                maxDailyEmails: 100,
                maxDailyWhatsapp: 100,
            }).returning();
        }

        return NextResponse.json({ settings: currentSettings });
    } catch (error: any) {
        console.error('Admin settings fetch error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
});

export const PUT = requireAdmin(async (req: NextRequest) => {
    try {
        const body = await req.json();
        const {
            automationEnabled,
            emailAutomationEnabled,
            whatsappAutomationEnabled,
            maxDailyEmails,
            maxDailyWhatsapp,
            skipWeekends,
            skipHolidays
        } = body;

        let [currentSettings] = await db.select().from(settings).limit(1);

        if (!currentSettings) {
            [currentSettings] = await db.insert(settings).values({
                automationEnabled: automationEnabled ?? true,
                emailAutomationEnabled: emailAutomationEnabled ?? true,
                whatsappAutomationEnabled: whatsappAutomationEnabled ?? true,
                maxDailyEmails: maxDailyEmails ?? 100,
                maxDailyWhatsapp: maxDailyWhatsapp ?? 100,
                skipWeekends: skipWeekends ?? false,
                skipHolidays: skipHolidays ?? false,
            }).returning();
        } else {
            [currentSettings] = await db.update(settings)
                .set({
                    automationEnabled,
                    emailAutomationEnabled,
                    whatsappAutomationEnabled,
                    maxDailyEmails,
                    maxDailyWhatsapp,
                    skipWeekends,
                    skipHolidays,
                    updatedAt: new Date(),
                })
                .where(eq(settings.id, currentSettings.id))
                .returning();
        }

        return NextResponse.json({ settings: currentSettings, message: 'Settings updated successfully' });
    } catch (error: any) {
        console.error('Admin settings update error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
});
