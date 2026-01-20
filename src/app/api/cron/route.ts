import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { User } from '@/models/User';
import { updateDailyStatsForUser } from '@/lib/leetcode';

export async function GET(req: Request) {
  // Simple auth check for Vercel Cron
  const authHeader = req.headers.get('authorization');
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    await dbConnect();
    const users = await User.find({});
    
    const results = [];
    for (const user of users) {
      try {
        await updateDailyStatsForUser(user._id, user.leetcodeUsername);
        results.push({ username: user.leetcodeUsername, success: true });
      } catch (error: any) {
        results.push({ username: user.leetcodeUsername, success: false, error: error.message });
      }
    }
    
    return NextResponse.json({ message: 'Cron job completed', results });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
