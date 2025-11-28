import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { RoundStatus } from '@prisma/client';

export const dynamic = 'force-dynamic';

export async function GET() {

  // add administatoro authentication

  try {
    const currentRound = await prisma.round.findFirst({
        where: { status: RoundStatus.OPEN }
    });

    if (!currentRound) {
       return NextResponse.json([], { status: 200 });
    }

    const bids = await prisma.bid.findMany({
      where: { roundId: currentRound.id },
      orderBy: { id: 'desc' }
    });
    
    return NextResponse.json(bids, { status: 200 });

  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
  }
}
