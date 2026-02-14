import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import CommunityJoinRequest from '@/models/CommunityJoinRequest';
import Community from '@/models/Community';
import { verifyAuth } from '@/lib/auth';

export async function POST(req, { params }) {
    try {
        await connectDB();

        const { requestId } = params;
        const { status } = await req.json();

        // Verify authentication
        const user = await verifyAuth(req);
        if (!user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Validate status
        if (!['APPROVED', 'REJECTED'].includes(status)) {
            return NextResponse.json(
                { error: 'Invalid status value' },
                { status: 400 }
            );
        }

        // Find the request
        const joinRequest = await CommunityJoinRequest.findById(requestId);
        if (!joinRequest) {
            return NextResponse.json(
                { error: 'Request not found' },
                { status: 404 }
            );
        }

        // Verify user is community leader
        const community = await Community.findById(joinRequest.communityId);
        if (community.leaderId.toString() !== user._id.toString()) {
            return NextResponse.json(
                { error: 'Unauthorized action' },
                { status: 403 }
            );
        }

        // Update request status
        joinRequest.status = status;
        await joinRequest.save();

        return NextResponse.json(
            { message: `Request ${status.toLowerCase()} successfully` },
            { status: 200 }
        );
    } catch (error) {
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}