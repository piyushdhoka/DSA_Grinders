import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { User } from '@/models/User';
import { DailyStat } from '@/models/DailyStat';

export async function GET() {
  try {
    await dbConnect();
    const users = await User.find({});
    
    const leaderboard = [];
    for (const user of users) {
      const latestStat = await DailyStat.findOne({ userId: user._id }).sort({ date: -1 });
      if (latestStat) {
        leaderboard.push({
          id: user._id,
          name: user.name,
          leetcodeUsername: user.leetcodeUsername,
          easy: latestStat.easy,
          medium: latestStat.medium,
          hard: latestStat.hard,
          total: latestStat.total,
          ranking: latestStat.ranking,
          weightedScore: latestStat.weightedScore,
          dailyIncrease: latestStat.dailyIncrease,
          date: latestStat.date,
        });
      }
    }
    
    return NextResponse.json(leaderboard);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
