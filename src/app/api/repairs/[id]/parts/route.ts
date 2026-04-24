import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

export async function POST(
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
    const { productId, name, quantity, unitPrice } = body;

    if (!name || !quantity || !unitPrice) {
      return NextResponse.json(
        { error: 'Nombre, cantidad y precio unitario son requeridos' },
        { status: 400 }
      );
    }

    const repair = await db.repairOrder.findUnique({ where: { id } });
    if (!repair) {
      return NextResponse.json(
        { error: 'Reparación no encontrada' },
        { status: 404 }
      );
    }

    const total = quantity * unitPrice;

    // Use transaction to add part and decrement inventory
    const part = await db.$transaction(async (tx) => {
      const newPart = await tx.repairPart.create({
        data: {
          repairOrderId: id,
          productId: productId || null,
          name,
          quantity,
          unitPrice,
          total,
        },
        include: {
          product: true,
        },
      });

      // Decrement product quantity if productId provided
      if (productId) {
        const product = await tx.product.findUnique({
          where: { id: productId },
        });

        if (product) {
          if (product.quantity < quantity) {
            throw new Error(`Stock insuficiente para ${product.name}. Disponible: ${product.quantity}`);
          }

          await tx.product.update({
            where: { id: productId },
            data: { quantity: product.quantity - quantity },
          });

          await tx.stockMovement.create({
            data: {
              productId,
              type: 'out',
              quantity,
              reason: 'Reparación',
              reference: repair.code,
              userId: user.id,
              userName: user.name,
            },
          });
        }
      }

      // Update repair parts cost and total
      const allParts = await tx.repairPart.findMany({
        where: { repairOrderId: id },
      });
      const partsCost = allParts.reduce((sum, p) => sum + p.total, 0);

      await tx.repairOrder.update({
        where: { id },
        data: {
          partsCost,
          totalCost: repair.laborCost + partsCost,
        },
      });

      return newPart;
    });

    return NextResponse.json(part, { status: 201 });
  } catch (error) {
    console.error('Add repair part error:', error);
    const message = error instanceof Error ? error.message : 'Error al agregar parte';
    return NextResponse.json(
      { error: message },
      { status: message.includes('Stock insuficiente') ? 400 : 500 }
    );
  }
}
