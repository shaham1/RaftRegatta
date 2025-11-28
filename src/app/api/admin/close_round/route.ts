import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { RoundStatus } from '@prisma/client';

export async function POST() {

  // add administrator authentication

  try {
    const result = await prisma.round.updateMany({
      where: { status: RoundStatus.OPEN },
      data: { 
        status: RoundStatus.CLOSED, 
        endTime: new Date() 
      }
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Round Closed Successfully',
      updated_count: result.count
    });

  } catch (error) {
    console.error("Close Round Error:", error);
    return NextResponse.json({ error: 'Failed to close round' }, { status: 500 });
  }
}