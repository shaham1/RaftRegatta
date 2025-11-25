import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { RoundStatus } from '@prisma/client';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const apiKey = request.headers.get('x-auction-key');
  if (!apiKey) {
    return NextResponse.json({ error: 'Missing X-Auction-Key' }, { status: 401 });
  }

  try {
    const currentRound = await prisma.round.findFirst({
      where: { status: RoundStatus.OPEN },
      include: { itemImage: true } 
    });

    if (!currentRound) {
      return NextResponse.json({ message: "No round active" }, { status: 404 });
    }

    let imageDataParsed = null;
    if (currentRound.itemImage?.imageData) {
      try {
        imageDataParsed = JSON.parse(currentRound.itemImage.imageData);
      } catch (e) {
        console.error("Failed to parse image data JSON", e);
        return NextResponse.json({ error: 'Corrupt image data in DB' }, { status: 500 });
      }
    }

    return NextResponse.json({
      round_id: currentRound.id.toString(),
      image_data: imageDataParsed, 
      start_time: currentRound.startTime,
      status: currentRound.status
    }, { status: 200 });

  } catch (error) {
    console.error("Current Round Error:", error);
    return NextResponse.json({ error: 'Server Error' }, { status: 500 });
  }
}
