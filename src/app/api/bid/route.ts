import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';


export async function POST(request: NextRequest) {
  try {
    console.log("Bid Request Received");

    const apiKey = request.headers.get('x-auction-key');
    const body = await request.json();
    const bidAmount = parseFloat(body.amount);

    if (!apiKey) return NextResponse.json({ error: 'Missing API Key' }, { status: 401 });
    if (isNaN(bidAmount)) return NextResponse.json({ error: 'Invalid Amount' }, { status: 400 });

    const team = await prisma.teams.findUnique({
      where: { apiKey: apiKey },
    });

    if (!team) {
      console.log("Invalid Key:", apiKey);
      return NextResponse.json({ error: 'Invalid API Key' }, { status: 403 });
    }

    const currentRound = await prisma.round.findFirst({
      where: { status: 'OPEN' },
    });

    if (!currentRound) {
      return NextResponse.json({ error: 'No round is currently open' }, { status: 400 });
    }

    const newBid = await prisma.bid.create({
      data: {
          roundId: currentRound.id,
          teamNo: team.teamNo,
          teamName: team.teamName,
          item: "Unkown",
          amount: bidAmount,
      },
    });

    console.log(`Bid Accepted: Team ${team.teamNo} bid $${bidAmount}`);
    
    return NextResponse.json({ 
      success: true, 
      bid_id: newBid.id 
    }, { status: 200 });

  } catch (error: any) {

    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'You have already placed a bid in this round.' }, { status: 400 });
    }
    console.error("Server Error:", error);
    return NextResponse.json({ error: 'Server Error' }, { status: 500 });
  }
}
