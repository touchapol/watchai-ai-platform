import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { name, displayName, description } = body;

        const model = await prisma.aiModel.update({
            where: { id },
            data: {
                name,
                displayName,
                description: description || null,
            },
        });

        return NextResponse.json(model);
    } catch (error) {
        console.error('Error updating model:', error);
        return NextResponse.json(
            { error: 'Failed to update model' },
            { status: 500 }
        );
    }
}
