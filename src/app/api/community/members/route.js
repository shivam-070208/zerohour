import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';

export async function GET(request) {
    try {
        const user = await verifyAuth(request);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const communityId = searchParams.get('communityId');

        if (!communityId) {
            return NextResponse.json(
                { error: 'Community ID is required' },
                { status: 400 }
            );
        }

        const community = await prisma.community.findUnique({
            where: { id: communityId },
        });

        if (!community) {
            return NextResponse.json(
                { error: 'Community not found' },
                { status: 404 }
            );
        }

        const members = await prisma.member.findMany({
            where: { communityId },
            include: {
                community: {
                    select: { id: true, name: true },
                },
            },
            orderBy: { joinedAt: 'desc' },
        });

        if (members.length === 0) {
            return NextResponse.json(
                { error: 'No members found' },
                { status: 404 }
            );
        }

        return NextResponse.json({ members }, { status: 200 });
    } catch (error) {
        console.error('Error fetching community members:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}