import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { RoundStatus } from '@prisma/client';

export async function POST() {
  try {
    const activeRound = await prisma.round.findFirst({
      where: { status: RoundStatus.OPEN },
      include: {
        bids: {
          orderBy: { amount: 'desc' },
          take: 1
        }
      }
    });

    if (!activeRound) {
      return NextResponse.json({ message: 'No open rounds to close.' }, { status: 200 });
    }

    let msg = "No bids.";

    if (activeRound.bids.length > 0) {
      const winningBid = activeRound.bids[0];
      
      await prisma.teams.update({
        where: { teamNo: winningBid.teamNo },
        data: {
          budget: { decrement: winningBid.amount }
        }
      });
      msg = `Winner: ${winningBid.teamName} (-$${winningBid.amount})`;
    }

    await prisma.round.update({
      where: { id: activeRound.id },
      data: { status: RoundStatus.CLOSED, endTime: new Date() }
    });

    return NextResponse.json({ 
      success: true, 
      message: `Round Closed. ${msg}`
    });

  } catch (error) {
    console.error("Close Round Error:", error);
    return NextResponse.json({ error: 'Failed to close round' }, { status: 500 });
  }
}