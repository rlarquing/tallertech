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
    const sale = await db.sale.findUnique({
      where: { id },
      include: {
        customer: true,
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!sale) {
      return NextResponse.json(
        { error: 'Venta no encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json(sale);
  } catch (error) {
    console.error('Get sale error:', error);
    return NextResponse.json(
      { error: 'Error al obtener venta' },
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

    const existing = await db.sale.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: 'Venta no encontrada' },
        { status: 404 }
      );
    }

    // If cancelling a sale, restore inventory
    if (body.status === 'cancelled' && existing.status !== 'cancelled') {
      await db.$transaction(async (tx) => {
        const saleItems = await tx.saleItem.findMany({
          where: { saleId: id },
        });

        for (const item of saleItems) {
          if (item.productId) {
            const product = await tx.product.findUnique({
              where: { id: item.productId },
            });
            if (product) {
              await tx.product.update({
                where: { id: item.productId },
                data: { quantity: product.quantity + item.quantity },
              });

              await tx.stockMovement.create({
                data: {
                  productId: item.productId,
                  type: 'return',
                  quantity: item.quantity,
                  reason: `Cancelación de venta ${existing.code}`,
                  reference: existing.code,
                  userId: user.id,
                  userName: user.name,
                },
              });
            }
          }
        }

        await tx.sale.update({
          where: { id },
          data: { status: 'cancelled' },
        });
      });

      return NextResponse.json({ message: 'Venta cancelada y stock restaurado' });
    }

    const sale = await db.sale.update({
      where: { id },
      data: {
        ...(body.status !== undefined && { status: body.status }),
        ...(body.paymentMethod !== undefined && { paymentMethod: body.paymentMethod }),
        ...(body.notes !== undefined && { notes: body.notes }),
      },
      include: {
        customer: true,
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    return NextResponse.json(sale);
  } catch (error) {
    console.error('Update sale error:', error);
    return NextResponse.json(
      { error: 'Error al actualizar venta' },
      { status: 500 }
    );
  }
}
