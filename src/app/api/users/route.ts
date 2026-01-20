import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { User } from '@/models/User';
import { updateDailyStatsForUser } from '@/lib/leetcode';

export async function POST(req: Request) {
  try {
    const { name, leetcodeUsername } = await req.json();
    if (!name || !leetcodeUsername) {
      return NextResponse.json({ error: 'Name and LeetCode username are required' }, { status: 400 });
    }

    await dbConnect();
    
    let user = await User.findOne({ leetcodeUsername });
    if (user) {
      return NextResponse.json({ error: 'User already exists' }, { status: 400 });
    }

    user = await User.create({ name, leetcodeUsername });
    
    // Fetch initial stats
    try {
      await updateDailyStatsForUser(user._id, user.leetcodeUsername);
    } catch (error) {
      // If LeetCode fetch fails, delete the user and return error
      await User.findByIdAndDelete(user._id);
      throw error;
    }
    
    return NextResponse.json(user);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
