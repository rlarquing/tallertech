import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const { id } = await params;
    const repair = await db.repairOrder.findUnique({
      where: { id },
      include: {
        customer: true,
        parts: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!repair) {
      return NextResponse.json(
        { error: 'Reparación no encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json(repair);
  } catch (error) {
    console.error('Get repair error:', error);
    return NextResponse.json(
      { error: 'Error al obtener reparación' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    const existing = await db.repairOrder.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: 'Reparación no encontrada' },
        { status: 404 }
      );
    }

    // Set timestamps based on status changes
    const updateData: Record<string, unknown> = {
      ...(body.device !== undefined && { device: body.device }),
      ...(body.brand !== undefined && { brand: body.brand || null }),
      ...(body.imei !== undefined && { imei: body.imei || null }),
      ...(body.issue !== undefined && { issue: body.issue }),
      ...(body.diagnosis !== undefined && { diagnosis: body.diagnosis || null }),
      ...(body.solution !== undefined && { solution: body.solution || null }),
      ...(body.status !== undefined && { status: body.status }),
      ...(body.priority !== undefined && { priority: body.priority }),
      ...(body.costEstimate !== undefined && { costEstimate: body.costEstimate }),
      ...(body.laborCost !== undefined && { laborCost: body.laborCost }),
      ...(body.partsCost !== undefined && { partsCost: body.partsCost }),
      ...(body.totalCost !== undefined && { totalCost: body.totalCost }),
      ...(body.paymentMethod !== undefined && { paymentMethod: body.paymentMethod }),
      ...(body.paid !== undefined && { paid: body.paid }),
      ...(body.estimatedReady !== undefined && { estimatedReady: body.estimatedReady ? new Date(body.estimatedReady) : null }),
      ...(body.notes !== undefined && { notes: body.notes || null }),
    };

    if (body.status === 'completed' && existing.status !== 'completed') {
      updateData.completedAt = new Date();
    }
    if (body.status === 'delivered' && existing.status !== 'delivered') {
      updateData.deliveredAt = new Date();
      updateData.paid = true;
    }

    const repair = await db.repairOrder.update({
      where: { id },
      data: updateData,
      include: {
        customer: true,
        parts: {
          include: {
            product: true,
          },
        },
      },
    });

    return NextResponse.json(repair);
  } catch (error) {
    console.error('Update repair error:', error);
    return NextResponse.json(
      { error: 'Error al actualizar reparación' },
      { status: 500 }
    );
  }
}
