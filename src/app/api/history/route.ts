import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const history = await prisma.bid.findMany({
      where: {
        round: {
          status: 'CLOSED'
        }
      },

      include: {
        round: false
      }
    });

    return NextResponse.json(history, { status: 200 });

  } catch (error) {
    console.error("History API Error:", error);
    return NextResponse.json({ error: 'Failed to fetch history' }, { status: 500 });
  }
}
