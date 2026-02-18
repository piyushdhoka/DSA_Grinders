import { NextResponse } from 'next/server';

const MAIN_APP_URL = process.env.MAIN_APP_URL || 'http://localhost:3000';
const CRON_SECRET = process.env.CRON_SECRET || 'BcndjbeihGgdw9hed';

/**
 * Proxy for /api/cron/pre-generate on the main app
 * Avoids CORS issues by making the request server-side
 */
export async function GET() {
  try {
    const response = await fetch(`${MAIN_APP_URL}/api/cron/pre-generate`, {
      headers: {
        'Authorization': `Bearer ${CRON_SECRET}`
      }
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: `Failed to reach main app at ${MAIN_APP_URL}: ${error instanceof Error ? error.message : 'Network error'}`
      },
      { status: 502 }
    );
  }
}
