import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { RoundStatus } from '@prisma/client';

export async function POST(request: NextRequest) {
  try {
    const previousRound = await prisma.round.findFirst({
      where: { status: RoundStatus.OPEN },
      include: {
        bids: {
          orderBy: { amount: 'desc' },
          take: 1
        }
      }
    });

    if (previousRound) {
      if (previousRound.bids.length > 0) {
        const winningBid = previousRound.bids[0];
        console.log(`Processing Winner: Team ${winningBid.teamName} pays $${winningBid.amount}`);
        
        await prisma.teams.update({
          where: { teamNo: winningBid.teamNo },
          data: {
            budget: { decrement: winningBid.amount }
          }
        });
      }

      await prisma.round.update({
        where: { id: previousRound.id },
        data: { status: RoundStatus.CLOSED, endTime: new Date() }
      });
    }

    await prisma.round.updateMany({
      where: { status: RoundStatus.OPEN },
      data: { status: RoundStatus.CLOSED }
    });

    const whereClause = { rounds: { none: {} } };
    const imageCount = await prisma.itemImage.count({ where: whereClause });

    if (imageCount === 0) {
      return NextResponse.json({ error: 'GAME OVER: All images used!' }, { status: 500 });
    }

    const skip = Math.floor(Math.random() * imageCount);
    const randomImage = await prisma.itemImage.findFirst({
      where: whereClause,
      skip: skip,
      include: { category: true }
    });

    if (!randomImage) return NextResponse.json({ error: 'Selection failed' }, { status: 500 });

    const newRound = await prisma.round.create({
      data: {
        itemImageId: randomImage.id,
        status: RoundStatus.OPEN,
      }
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Round Started',
      round_id: newRound.id,
      active_category: randomImage.category.name,
      active_image_id: randomImage.id
    });

  } catch (error) {
    console.error("Start Round Error:", error);
    return NextResponse.json({ error: 'Failed to start round' }, { status: 500 });
  }
}