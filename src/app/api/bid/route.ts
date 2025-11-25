import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma'; 
import { Prisma } from '@prisma/client';

export async function POST(request: NextRequest) {
  try {
    const apiKey = request.headers.get('x-auction-key');
    const body = await request.json();
    const bidAmount = parseFloat(body.amount);
    const predictedItem = body.item; 

    if (!apiKey) {
      return NextResponse.json({ error: 'Missing API Key' }, { status: 401 });
    }
    if (isNaN(bidAmount)) {
      return NextResponse.json({ error: 'Invalid Amount' }, { status: 400 });
    }
    if (!predictedItem) {
      return NextResponse.json({ error: 'Missing item prediction' }, { status: 400 });
    }

    const team = await prisma.teams.findUnique({
      where: { apiKey: apiKey },
    });

    if (!team) {
      return NextResponse.json({ error: 'Invalid API Key' }, { status: 403 });
    }

    const currentRound = await prisma.round.findFirst({
      where: { status: 'OPEN' },
      include: {
        itemImage: {
          include: {
            category: true
          }
        }
      }
    });

    if (!currentRound) {
      return NextResponse.json({ error: 'No round is currently open' }, { status: 400 });
    }

    const trueName = currentRound.itemImage?.category?.name;

    if (!trueName) {
      console.error("DB Error: Item has no category name");
      return NextResponse.json({ error: 'System Error: Validating item failed.' }, { status: 500 });
    }

    const isValid = predictedItem.trim().toLowerCase() === trueName.trim().toLowerCase();

    if (!isValid) {
      return NextResponse.json({ 
        error: `Incorrect Prediction. You guessed '${predictedItem}', but the item is a '${trueName}'.` 
      }, { status: 400 });
    }

    const newBid = await prisma.bid.create({
      data: {
        amount: bidAmount,
        roundId: currentRound.id,
        teamNo: team.teamNo,
        teamName: team.teamName,
        item: predictedItem 
      },
    });

    return NextResponse.json({ 
      success: true, 
      bid_id: newBid.id,
      message: "Correct prediction! Bid accepted."
    }, { status: 200 });

  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'You have already placed a bid in this round.' }, { status: 400 });
    }
    console.error("Bid Error:", error);
    return NextResponse.json({ error: 'Server Error' }, { status: 500 });
  }
}