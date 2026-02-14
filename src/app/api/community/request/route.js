import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

function base64UrlDecode(input) {
    input = input.replace(/-/g, '+').replace(/_/g, '/');
    const pad = input.length % 4;
    if (pad) input += '='.repeat(4 - pad);
    return Buffer.from(input, 'base64').toString('utf8');
}

function extractUserIdFromToken(token) {
    if (!token) return null;
    try {
        if (token.includes('.')) {
            const parts = token.split('.');
            if (parts.length >= 2) {
                const payload = JSON.parse(base64UrlDecode(parts[1]));
                return payload.sub || payload.userId || payload.id || null;
            }
        }
    } catch (err) {
        // fallthrough
    }
    // dev fallback: treat raw token as userId
    return token || null;
}

export async function POST(request) {
    try {
        const body = await request.json().catch(() => null);
        const communityId = body?.communityId;

        if (!communityId || typeof communityId !== 'string') {
            return NextResponse.json({ message: 'communityId is required' }, { status: 400 });
        }

        const authHeader = request.headers.get('authorization') || '';
        if (!authHeader.toLowerCase().startsWith('bearer ')) {
            return NextResponse.json({ message: 'Unauthorized - missing Bearer token' }, { status: 401 });
        }

        const token = authHeader.slice(7).trim();
        const userId = extractUserIdFromToken(token);
        if (!userId) {
            return NextResponse.json({ message: 'Unauthorized - invalid token' }, { status: 401 });
        }

        // ensure community exists
        const community = await prisma.community.findUnique({ where: { id: communityId } });
        if (!community) {
            return NextResponse.json({ message: 'Community not found' }, { status: 404 });
        }

        // prevent duplicate pending request
        const existing = await prisma.communityRequest.findFirst({
            where: { userId, communityId, status: 'PENDING' },
        });

        if (existing) {
            return NextResponse.json({ message: 'A pending request already exists for this user and community' }, { status: 400 });
        }

        const created = await prisma.communityRequest.create({
            data: { userId, communityId, status: 'PENDING' },
            select: { id: true, userId: true, communityId: true, status: true, requestedAt: true },
        });

        return NextResponse.json({ message: 'Request sent successfully', request: created }, { status: 201 });
    } catch (err) {
        console.error('POST /api/community/request error:', err);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}
