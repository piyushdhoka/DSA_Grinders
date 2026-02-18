import { NextResponse } from 'next/server';
import { db } from '@/db/drizzle';
import { users, settings } from '@/db/schema';
import { eq, ne, notLike, and } from 'drizzle-orm';
import { getTodayDate } from '@/lib/utils';
import { sendConfigEmail, sendConfigWhatsApp } from '@/lib/messaging';
import { updateDailyStatsForUser } from '@/lib/leetcode';

/**
 * TIME-SLOT SENDER CRON JOB
 * Runs every 30 minutes to send messages to users whose dailyGrindTime falls in current slot
 * Groups users by roast intensity for efficient batch sending
 */

// Helper function to check if a user's dailyGrindTime falls in current 30-minute slot
function isInCurrentTimeSlot(userTime: string | null): boolean {
  if (!userTime || !userTime.match(/^\d{2}:\d{2}$/)) return false;

  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();

  // Create 30-minute time slots: 00:00-00:30, 00:30-01:00, etc.
  const slotStart = currentMinute < 30 ? 0 : 30;
  const slotEnd = slotStart + 30;

  const [userHour, userMin] = userTime.split(':').map(Number);

  // Check if user's time falls in current slot
  return userHour === currentHour && userMin >= slotStart && userMin < slotEnd;
}

// Helper function to process users in batches with concurrent sending
async function processUsersByIntensity(
  userList: any[],
  intensity: string,
  message: any,
  shouldSendEmails: boolean,
  shouldSendWhatsApp: boolean
): Promise<any> {
  const BATCH_SIZE = 10;

  const results = {
    processed: 0,
    emailsSent: 0,
    whatsappSent: 0,
    errors: [] as string[]
  };

  console.log(`\nProcessing ${userList.length} users with ${intensity} intensity...`);

  for (let i = 0; i < userList.length; i += BATCH_SIZE) {
    const batch = userList.slice(i, i + BATCH_SIZE);
    console.log(`Processing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(userList.length / BATCH_SIZE)} (${batch.length} users)`);

    const batchPromises = batch.map(async (user: any) => {
      try {
        const personalizedMessage = message.fullMessage?.replace(/\[NAME\]/g, user.name.split(' ')[0]);

        const userResults: {
          email: { success: boolean; skipped?: boolean; error?: string };
          whatsapp: { success: boolean; skipped?: boolean; error?: string };
          statsUpdate: { success: boolean };
        } = {
          email: { success: false, skipped: true },
          whatsapp: { success: false, skipped: true },
          statsUpdate: { success: false }
        };

        // Update stats (non-blocking)
        try {
          await updateDailyStatsForUser(user.id, user.leetcodeUsername);
          userResults.statsUpdate = { success: true };
        } catch (error) {
          console.error(`Stats update failed for ${user.email}:`, error);
        }

        // Send email if enabled
        if (shouldSendEmails) {
          try {
            const emailResult = await sendConfigEmail(user, undefined, undefined, personalizedMessage);
            userResults.email = emailResult;
            if (emailResult.success) results.emailsSent++;
          } catch (error) {
            userResults.email = { success: false, error: error instanceof Error ? error.message : 'Email failed' };
          }
        }

        // Send WhatsApp if enabled and user has phone
        if (shouldSendWhatsApp && user.phoneNumber) {
          try {
            const whatsappResult = await sendConfigWhatsApp(user, undefined, undefined, personalizedMessage);
            userResults.whatsapp = whatsappResult;
            if (whatsappResult.success) results.whatsappSent++;
          } catch (error) {
            userResults.whatsapp = { success: false, error: error instanceof Error ? error.message : 'WhatsApp failed' };
          }
        }

        results.processed++;
        return userResults;

      } catch (error) {
        const errorMsg = `User ${user.email}: ${error instanceof Error ? error.message : 'Processing failed'}`;
        results.errors.push(errorMsg);
        console.error(errorMsg);
        return null;
      }
    });

    await Promise.allSettled(batchPromises);

    if (i + BATCH_SIZE < userList.length) {
      console.log('Waiting 1 second before next batch...');
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  console.log(`Completed ${intensity}: ${results.emailsSent} emails, ${results.whatsappSent} WhatsApp`);
  return results;
}

export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const today = getTodayDate();
    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    console.log(`\nTime-slot sender started at ${currentTime}`);

    // Get automation settings and pre-generated messages
    const [s] = await db.select().from(settings).limit(1);
    if (!s) {
      return NextResponse.json({ error: 'Settings not found' }, { status: 404 });
    }

    if (!s.automationEnabled) {
      return NextResponse.json({ message: 'Automation disabled', automationEnabled: false });
    }

    // Get pre-generated messages
    const aiMessages = s.aiRoast as any;
    if (!aiMessages || aiMessages.date !== today) {
      return NextResponse.json({
        message: 'No pre-generated messages found for today. Run pre-generation first.',
        date: today,
        hasMessages: false
      });
    }

    const availableIntensities = ['mild', 'medium', 'savage'].filter(intensity =>
      aiMessages[intensity] && aiMessages[intensity].fullMessage
    );

    if (availableIntensities.length === 0) {
      return NextResponse.json({
        message: 'No valid pre-generated messages available',
        date: today,
        availableIntensities: 0
      });
    }

    console.log(`Available message intensities: ${availableIntensities.join(', ')}`);

    // Get all users who should receive messages
    const allUsers = await db.select().from(users)
      .where(
        and(
          ne(users.role, 'admin'),
          notLike(users.leetcodeUsername, 'pending_%'),
          eq(users.onboardingCompleted, true)
        )
      );

    // Filter users whose dailyGrindTime falls in current 30-minute slot
    const usersInTimeSlot = allUsers.filter(user =>
      user.dailyGrindTime && isInCurrentTimeSlot(user.dailyGrindTime)
    );

    if (usersInTimeSlot.length === 0) {
      const slotLabel = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes() < 30 ? '00' : '30'}-${now.getMinutes() < 30 ? now.getHours().toString().padStart(2, '0') + ':30' : (now.getHours() + 1).toString().padStart(2, '0') + ':00'}`;
      return NextResponse.json({
        message: 'No users scheduled for current time slot',
        currentTime,
        timeSlot: slotLabel,
        totalUsers: allUsers.length,
        usersInSlot: 0
      });
    }

    console.log(`Found ${usersInTimeSlot.length} users in current time slot`);

    // Group users by roast intensity
    const usersByIntensity: { [key: string]: any[] } = {
      mild: [],
      medium: [],
      savage: []
    };

    usersInTimeSlot.forEach(user => {
      const intensity = user.roastIntensity || 'medium';
      if (usersByIntensity[intensity]) {
        usersByIntensity[intensity].push(user);
      } else {
        usersByIntensity.medium.push(user);
      }
    });

    console.log('Users by intensity:');
    Object.entries(usersByIntensity).forEach(([intensity, intensityUsers]) => {
      if (intensityUsers.length > 0) {
        console.log(`  ${intensity}: ${intensityUsers.length} users`);
      }
    });

    // Process each intensity group separately
    const allResults: any = {
      totalProcessed: 0,
      totalEmailsSent: 0,
      totalWhatsappSent: 0,
      byIntensity: {} as any,
      errors: [] as string[]
    };

    const shouldSendEmails = s.emailAutomationEnabled;
    const shouldSendWhatsApp = s.whatsappAutomationEnabled;

    for (const intensity of availableIntensities) {
      const usersForIntensity = usersByIntensity[intensity] || [];

      if (usersForIntensity.length === 0) {
        console.log(`Skipping ${intensity}: no users`);
        continue;
      }

      const message = aiMessages[intensity];
      if (!message || !message.fullMessage) {
        console.log(`Skipping ${intensity}: no message available`);
        continue;
      }

      try {
        const results = await processUsersByIntensity(
          usersForIntensity,
          intensity,
          message,
          shouldSendEmails ?? false,
          shouldSendWhatsApp ?? false
        );

        allResults.byIntensity[intensity] = results;
        allResults.totalProcessed += results.processed;
        allResults.totalEmailsSent += results.emailsSent;
        allResults.totalWhatsappSent += results.whatsappSent;
        allResults.errors.push(...results.errors);

      } catch (error) {
        const errorMsg = `Failed to process ${intensity} intensity: ${error instanceof Error ? error.message : 'Unknown error'}`;
        allResults.errors.push(errorMsg);
        console.error(errorMsg);
      }
    }

    // Update settings with sent counts
    await db.update(settings)
      .set({
        emailsSentToday: (s.emailsSentToday || 0) + allResults.totalEmailsSent,
        whatsappSentToday: (s.whatsappSentToday || 0) + allResults.totalWhatsappSent,
        lastEmailSent: allResults.totalEmailsSent > 0 ? new Date() : s.lastEmailSent,
        lastWhatsappSent: allResults.totalWhatsappSent > 0 ? new Date() : s.lastWhatsappSent,
        updatedAt: new Date()
      })
      .where(eq(settings.id, s.id));

    const slotLabel = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes() < 30 ? '00' : '30'}-${now.getMinutes() < 30 ? now.getHours().toString().padStart(2, '0') + ':30' : (now.getHours() + 1).toString().padStart(2, '0') + ':00'}`;

    const summary = {
      currentTime,
      timeSlot: slotLabel,
      usersInSlot: usersInTimeSlot.length,
      processed: allResults.totalProcessed,
      emailsSent: allResults.totalEmailsSent,
      whatsappSent: allResults.totalWhatsappSent,
      intensitiesProcessed: Object.keys(allResults.byIntensity),
      errorCount: allResults.errors.length
    };

    console.log(`\nTime-slot sender completed:`, summary);

    return NextResponse.json({
      message: 'Time-slot sending completed',
      summary,
      detailed: allResults.byIntensity,
      errors: allResults.errors.length > 0 ? allResults.errors.slice(0, 5) : undefined
    });

  } catch (error) {
    console.error('Time-slot sender error:', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Time-slot sender failed'
    }, { status: 500 });
  }
}
