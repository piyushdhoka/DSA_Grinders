import { NextResponse, NextRequest } from 'next/server';
import { db } from '@/db/drizzle';
import { users } from '@/db/schema';
import { ne, notLike } from 'drizzle-orm';
import { getRateLimitHeaders, checkRateLimit, getClientIdentifier, RATE_LIMITS } from '@/lib/rateLimit';
import { updateDailyStatsForUser } from '@/lib/leetcode';

// Simple in-memory cache
interface CacheEntry {
  data: any;
  timestamp: number;
}

// Separate caches for 'daily' and 'all_time'
const cache: Record<string, CacheEntry> = {};
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export async function GET(request: NextRequest) {
  const clientId = getClientIdentifier(request);
  const rateLimitResult = checkRateLimit(clientId, RATE_LIMITS.LEADERBOARD);

  if (!rateLimitResult.allowed) {
    return new NextResponse(
      JSON.stringify({ error: 'Too many requests. Please try again later.' }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          ...getRateLimitHeaders(rateLimitResult),
        },
      }
    );
  }

  try {
    const searchParams = new URL(request.url).searchParams;
    const type = searchParams.get('type') || 'daily';
    const cacheKey = `leaderboard_${type}`;

    // Check cache
    const cached = cache[cacheKey];
    if (cached && (Date.now() - cached.timestamp < CACHE_TTL)) {
      return new NextResponse(JSON.stringify(cached.data), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'X-Cache': 'HIT',
          ...getRateLimitHeaders(rateLimitResult),
        },
      });
    }

    // Fetch all users with their current stats from the users table
    const allUsers = await db.select({
      id: users.id,
      name: users.name,
      email: users.email,
      leetcodeUsername: users.leetcodeUsername,
      gfgUsername: users.gfgUsername,
      github: users.github,
      linkedin: users.linkedin,
      todayPoints: users.todayPoints,
      easy: users.easySolved,
      medium: users.mediumSolved,
      hard: users.hardSolved,
      totalProblems: users.totalSolved,
      gfgSolved: users.gfgSolved,
      gfgScore: users.gfgScore,
      ranking: users.ranking,
      avatar: users.avatar,
      country: users.country,
      streak: users.streak,
      lastSubmission: users.lastSubmission,
      recentProblems: users.recentProblems,
      lastUpdated: users.lastStatUpdate,
    })
      .from(users)
      .where(ne(users.role, 'admin'));

    // SWR Pattern: Identify stale users (older than 1 hour) to refresh in background
    const STALE_THRESHOLD = 3600 * 1000; // 1 hour
    const nowTs = Date.now();

    const staleUsers = allUsers
      .filter(u => !u.leetcodeUsername.startsWith('pending_'))
      .filter(u => {
        if (!u.lastUpdated) return true;
        return (nowTs - new Date(u.lastUpdated).getTime()) > STALE_THRESHOLD;
      })
      .sort((a, b) => {
        // Refresh most stale users first (null lastUpdated comes first)
        const timeA = a.lastUpdated ? new Date(a.lastUpdated).getTime() : 0;
        const timeB = b.lastUpdated ? new Date(b.lastUpdated).getTime() : 0;
        return timeA - timeB;
      })
      .slice(0, 3); // Small batch to keep response snappy

    // Trigger background refreshes
    staleUsers.forEach(u =>
      updateDailyStatsForUser(u.id, u.leetcodeUsername).catch(err =>
        console.error(`SWR Background Refresh failed for ${u.leetcodeUsername}:`, err)
      )
    );

    // Filter out pending users and transform
    const leaderboardData = allUsers
      .filter(u => !u.leetcodeUsername.startsWith('pending_'))
      .map(u => {
        const easy = u.easy || 0;
        const medium = u.medium || 0;
        const hard = u.hard || 0;
        const totalScore = easy * 1 + medium * 3 + hard * 6;

        return {
          ...u,
          totalScore,
          rank: 0,
        };
      });

    // Sort based on type
    if (type === 'daily') {
      leaderboardData.sort((a, b) => (b.todayPoints || 0) - (a.todayPoints || 0) || b.totalScore - a.totalScore);
    } else {
      leaderboardData.sort((a, b) => b.totalScore - a.totalScore || (b.todayPoints || 0) - (a.todayPoints || 0));
    }

    // Add rank
    leaderboardData.forEach((entry, index) => {
      entry.rank = index + 1;
    });

    // Collect recent activities from all users' recentProblems JSON
    let activities: any[] = [];
    const seventyTwoHoursAgo = Math.floor(Date.now() / 1000) - (3 * 24 * 60 * 60);

    leaderboardData.forEach(user => {
      const problems = Array.isArray(user.recentProblems) ? user.recentProblems : [];
      problems.forEach((p: any) => {
        const problemTs = Number(p.timestamp);
        if (problemTs >= seventyTwoHoursAgo) {
          activities.push({
            ...p,
            userName: user.name,
            leetcodeUsername: user.leetcodeUsername,
            avatar: user.avatar
          });
        }
      });
    });

    // Sort activities by timestamp descending
    activities.sort((a, b) => Number(b.timestamp) - Number(a.timestamp));
    activities = activities.slice(0, 50);

    const responseData = {
      entries: leaderboardData,
      activities
    };

    // Update cache
    cache[cacheKey] = {
      data: responseData,
      timestamp: Date.now()
    };

    return new NextResponse(JSON.stringify(responseData), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'X-Cache': 'MISS',
        ...getRateLimitHeaders(rateLimitResult),
      },
    });

  } catch (error) {
    const message = error instanceof Error ? error.message : 'An unexpected error occurred';
    console.error('Leaderboard error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
