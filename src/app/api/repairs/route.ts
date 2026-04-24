import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

function generateRepairCode(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `REP-${timestamp.slice(-4)}${random}`;
}

export async function GET(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const where: Record<string, unknown> = {};

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { code: { contains: search } },
        { customer: { name: { contains: search } } },
        { device: { contains: search } },
        { imei: { contains: search } },
      ];
    }

    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      db.repairOrder.findMany({
        where,
        include: {
          customer: true,
          parts: {
            include: {
              product: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      db.repairOrder.count({ where }),
    ]);

    return NextResponse.json({ data, total, page, limit });
  } catch (error) {
    console.error('Repairs list error:', error);
    return NextResponse.json(
      { error: 'Error al obtener reparaciones' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const body = await request.json();
    const {
      customerId,
      device,
      brand,
      imei,
      issue,
      diagnosis,
      priority,
      costEstimate,
      estimatedReady,
      notes,
    } = body;

    if (!customerId || !device || !issue) {
      return NextResponse.json(
        { error: 'Cliente, dispositivo y problema son requeridos' },
        { status: 400 }
      );
    }

    const code = generateRepairCode();

    const repair = await db.repairOrder.create({
      data: {
        code,
        customerId,
        userId: user.id,
        userName: user.name,
        device,
        brand: brand || null,
        imei: imei || null,
        issue,
        diagnosis: diagnosis || null,
        priority: priority || 'normal',
        costEstimate: costEstimate || 0,
        estimatedReady: estimatedReady ? new Date(estimatedReady) : null,
        notes: notes || null,
      },
      include: {
        customer: true,
        parts: {
          include: {
            product: true,
          },
        },
      },
    });

    return NextResponse.json(repair, { status: 201 });
  } catch (error) {
    console.error('Create repair error:', error);
    return NextResponse.json(
      { error: 'Error al crear reparación' },
      { status: 500 }
    );
  }
}
