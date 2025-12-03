import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma, RoundStatus } from '@prisma/client';

const MINIMUM_BIDS: Record<string, number> = {
  "bamboo": 5000,
  "barrel": 3000,
  "tyre_tube": 4000,
  "string_rope": 1000,
  "jute_rope": 2000,
  "ladder": 5000,
  "oars": 6500,
  "default": 10 
};

export async function POST(request: NextRequest) {
  try {
    const apiKey = request.headers.get('x-auction-key');
    const body = await request.json();
    const bidAmount = parseFloat(body.amount);
    const predictedItem = body.item; 

    if (!apiKey) return NextResponse.json({ error: 'Missing Key' }, { status: 401 });
    if (isNaN(bidAmount) || bidAmount <= 0) return NextResponse.json({ error: 'Invalid Amount' }, { status: 400 });
    if (!predictedItem) return NextResponse.json({ error: 'Missing Item Prediction' }, { status: 400 });

    const team = await prisma.teams.findUnique({ where: { apiKey } });
    if (!team) return NextResponse.json({ error: 'Invalid API Key' }, { status: 403 });

    if (team.budget < bidAmount) {
        return NextResponse.json({ 
            error: `Insufficient Funds. You have $${team.budget}, but tried to bid $${bidAmount}.` 
        }, { status: 400 });
    }

    const currentRound = await prisma.round.findFirst({
      where: { status: RoundStatus.OPEN },
      include: {
        itemImage: {
          include: {
            category: true 
          }
        }
      }
    });

    if (!currentRound) return NextResponse.json({ error: 'No round open' }, { status: 400 });
    
    if (!currentRound.itemImage?.category) {
         return NextResponse.json({ error: 'System Error: Data missing' }, { status: 500 });
    }

    const trueName = currentRound.itemImage.category.name;

    if (predictedItem.trim().toLowerCase() !== trueName.trim().toLowerCase()) {
      return NextResponse.json({ 
        error: `Incorrect Prediction. You guessed '${predictedItem}', but the item is a '${trueName}'.` 
      }, { status: 400 });
    }

    const normalizedItemName = trueName.trim().toLowerCase();
    
    const requiredMinBid = MINIMUM_BIDS[normalizedItemName] || MINIMUM_BIDS["default"];
    
    if (bidAmount < requiredMinBid) {
        return NextResponse.json({ 
            error: `Bid Too Low. The minimum bid for '${trueName}' is strictly set to $${requiredMinBid}.` 
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

    return NextResponse.json({ success: true, bid_id: newBid.id }, { status: 200 });

  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'You have already placed a bid in this round.' }, { status: 400 });
    }
    console.error(error);
    return NextResponse.json({ error: 'Server Error' }, { status: 500 });
  }
}
