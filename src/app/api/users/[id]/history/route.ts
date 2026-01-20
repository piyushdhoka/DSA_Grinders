import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { DailyStat } from '@/models/DailyStat';

export async function GET(req: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    await dbConnect();
    const stats = await DailyStat.find({ userId: params.id }).sort({ date: 1 });
    return NextResponse.json(stats);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
