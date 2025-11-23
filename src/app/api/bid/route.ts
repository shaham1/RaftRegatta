import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  console.log("PING RECEIVED from Colab!");

  const body = await request.json();
  console.log("Payload:", body);

  return NextResponse.json({ 
    message: "Connection successful!", 
    received_data: body 
  }, { status: 200 });
}