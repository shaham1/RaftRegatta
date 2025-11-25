import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { RoundStatus } from '@prisma/client'; 

export async function POST(request: NextRequest) {
  try {
    let categoryId: number | undefined;
    try {
      const body = await request.json();
      if (body.category_id) categoryId = parseInt(body.category_id);
    } catch (e) {}

    await prisma.round.updateMany({
      where: { status: RoundStatus.OPEN }, 
      data: { status: RoundStatus.CLOSED, endTime: new Date() }
    });

    const whereClause = categoryId ? { categoryId: categoryId } : {};

    const imageCount = await prisma.itemImage.count({ where: whereClause });

    if (imageCount === 0) {
      return NextResponse.json({ 
        error: categoryId 
          ? `No images found for Category ID ${categoryId}` 
          : 'No images found in database' 
      }, { status: 500 });
    }

    const skip = Math.floor(Math.random() * imageCount);
    const randomImage = await prisma.itemImage.findFirst({
      where: whereClause,
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
      message: categoryId ? `Round Started for ${randomImage.category.name}` : 'Random Round Started',
      round_id: newRound.id,
      active_category: randomImage.category.name,
      active_image_id: randomImage.id
    });

  } catch (error) {
    console.error("Start Round Error:", error);
    return NextResponse.json({ error: 'Failed to start round' }, { status: 500 });
  }
}