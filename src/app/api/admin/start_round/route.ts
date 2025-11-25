import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { RoundStatus } from '@prisma/client';

export async function POST(request: NextRequest) {
  try {
    await prisma.round.updateMany({
      where: { status: RoundStatus.OPEN },
      data: { status: RoundStatus.CLOSED, endTime: new Date() }
    });

    const imageCount = await prisma.itemImage.count();
    
    if (imageCount === 0) {
      return NextResponse.json({ error: 'No images found in database' }, { status: 500 });
    }

    const skip = Math.floor(Math.random() * imageCount);
    
    const randomImage = await prisma.itemImage.findFirst({
      skip: skip,
      include: { category: true } 
    });

    if (!randomImage) {
      return NextResponse.json({ error: 'Image selection failed' }, { status: 500 });
    }

    const newRound = await prisma.round.create({
      data: {
        itemImageId: randomImage.id,
        status: RoundStatus.OPEN,
      }
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Random Round Started',
      round_id: newRound.id,
      active_category: randomImage.category.name,
      active_image_id: randomImage.id
    });

  } catch (error) {
    console.error("Start Round Error:", error);
    return NextResponse.json({ error: 'Failed to start round' }, { status: 500 });
  }
}