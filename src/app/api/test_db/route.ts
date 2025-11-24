import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // 1. Try to count teams. This forces a database connection.
    const teamCount = await prisma.teams.count();
    
    // 2. Try to find the team with key "123456" specifically
    const myTeam = await prisma.teams.findUnique({
        where: { apiKey: "123456" }
    });

    return NextResponse.json({ 
      status: "Database Connected", 
      team_count: teamCount,
      found_your_key: !!myTeam, // true/false
      env_check: process.env.POSTGRES_URL ? "URL Found" : "URL MISSING"
    }, { status: 200 });

  } catch (error: any) {
    console.error("DB Connection Test Failed:", error);
    return NextResponse.json({ 
      status: "Connection Failed", 
      error: error.message 
    }, { status: 500 });
  }
}