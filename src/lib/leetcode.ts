import dbConnect from './mongodb';
import { DailyStat } from '@/models/DailyStat';

const LEETCODE_GRAPHQL = 'https://leetcode.com/graphql';

async function fetchLeetCodeUser(username: string) {
  const query = `
    query getUserProfile($username: String!) {
      matchedUser(username: $username) {
        username
        profile {
          ranking
        }
        submitStatsGlobal {
          acSubmissionNum {
            difficulty
            count
          }
        }
      }
    }
  `;

  const response = await fetch(LEETCODE_GRAPHQL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables: { username } }),
  });

  if (!response.ok) {
    throw new Error(`LeetCode API error: ${response.status}`);
  }

  const data = await response.json();
  return data.data;
}

export async function fetchLeetCodeStats(username: string) {
  try {
    const userStats = await fetchLeetCodeUser(username);
    
    if (!userStats || !userStats.matchedUser) {
      throw new Error(`User "${username}" not found on LeetCode. Please check the username is correct.`);
    }

    const submitStats = userStats.matchedUser.submitStatsGlobal;
    if (!submitStats || !submitStats.acSubmissionNum || submitStats.acSubmissionNum.length === 0) {
      throw new Error(`Could not fetch submission stats for "${username}". The profile may be private.`);
    }
    
    const acNum = submitStats.acSubmissionNum;
    const easy = acNum.find((s: any) => s.difficulty === 'Easy')?.count || 0;
    const medium = acNum.find((s: any) => s.difficulty === 'Medium')?.count || 0;
    const hard = acNum.find((s: any) => s.difficulty === 'Hard')?.count || 0;
    const total = acNum.find((s: any) => s.difficulty === 'All')?.count || 0;
    const ranking = userStats.matchedUser.profile?.ranking || 0;

    return {
      easy,
      medium,
      hard,
      total,
      ranking,
      weightedScore: easy * 1 + medium * 3 + hard * 5,
    };
  } catch (error) {
    console.error(`Error fetching LeetCode stats for ${username}:`, error);
    throw error;
  }
}

export async function updateDailyStatsForUser(userId: string, leetcodeUsername: string) {
  await dbConnect();
  const stats = await fetchLeetCodeStats(leetcodeUsername);
  const today = new Date().toISOString().split('T')[0];

  // Find most recent stat to calculate daily increase (not just yesterday, in case of gaps)
  const lastStat = await DailyStat.findOne({ userId }).sort({ date: -1 });
  
  let dailyIncrease = 0;
  if (lastStat && lastStat.date !== today) {
    dailyIncrease = stats.total - lastStat.total;
  } else if (lastStat && lastStat.date === today) {
    // If we're updating today's stat again, we need the one before it
    const previousStat = await DailyStat.findOne({ userId, date: { $lt: today } }).sort({ date: -1 });
    dailyIncrease = previousStat ? stats.total - previousStat.total : 0;
  }

  const update = {
    ...stats,
    dailyIncrease: dailyIncrease > 0 ? dailyIncrease : 0,
  };

  return await DailyStat.findOneAndUpdate(
    { userId, date: today },
    update,
    { upsert: true, new: true }
  );
}
