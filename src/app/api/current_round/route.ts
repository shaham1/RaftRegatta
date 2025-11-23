import { NextRequest, NextResponse } from 'next/server';
import  prisma  from '@/lib/prisma';

export async function GET(request: NextRequest) {

  
  const payload = {
    test: "This is a test"
    };

  return NextResponse.json(payload, { status: 200 });
}