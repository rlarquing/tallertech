import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

function generateSaleCode(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `VEN-${timestamp.slice(-4)}${random}`;
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
    const dateFrom = searchParams.get('dateFrom') || '';
    const dateTo = searchParams.get('dateTo') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const where: Record<string, unknown> = {};

    if (status) {
      where.status = status;
    }

    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) {
        (where.createdAt as Record<string, unknown>).gte = new Date(dateFrom);
      }
      if (dateTo) {
        const to = new Date(dateTo);
        to.setHours(23, 59, 59, 999);
        (where.createdAt as Record<string, unknown>).lte = to;
      }
    }

    if (search) {
      where.OR = [
        { code: { contains: search } },
        { customer: { name: { contains: search } } },
      ];
    }

    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      db.sale.findMany({
        where,
        include: {
          customer: true,
          items: {
            include: {
              product: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      db.sale.count({ where }),
    ]);

    return NextResponse.json({ data, total, page, limit });
  } catch (error) {
    console.error('Sales list error:', error);
    return NextResponse.json(
      { error: 'Error al obtener ventas' },
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
    const { customerId, items, discount, tax, paymentMethod, notes } = body;

    if (!items || items.length === 0) {
      return NextResponse.json(
        { error: 'La venta debe tener al menos un item' },
        { status: 400 }
      );
    }

    const code = generateSaleCode();

    // Calculate totals
    let subtotal = 0;
    for (const item of items) {
      const itemTotal = (item.unitPrice || 0) * (item.quantity || 1) - (item.discount || 0);
      subtotal += itemTotal;
    }

    const discountAmount = discount || 0;
    const taxAmount = tax || 0;
    const total = subtotal - discountAmount + taxAmount;

    // Use transaction to create sale and update inventory
    const sale = await db.$transaction(async (tx) => {
      // Create sale
      const newSale = await tx.sale.create({
        data: {
          code,
          customerId: customerId || null,
          userId: user.id,
          userName: user.name,
          subtotal,
          discount: discountAmount,
          tax: taxAmount,
          total,
          paymentMethod: paymentMethod || 'efectivo',
          notes: notes || null,
          items: {
            create: items.map((item: { productId?: string; name: string; quantity: number; unitPrice: number; discount?: number; type?: string }) => ({
              productId: item.productId || null,
              name: item.name,
              quantity: item.quantity || 1,
              unitPrice: item.unitPrice || 0,
              discount: item.discount || 0,
              total: (item.unitPrice || 0) * (item.quantity || 1) - (item.discount || 0),
              type: item.type || 'product',
            })),
          },
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

      // Decrement product quantities and create stock movements
      for (const item of items) {
        if (item.productId) {
          const product = await tx.product.findUnique({
            where: { id: item.productId },
          });

          if (product) {
            if (product.quantity < (item.quantity || 1)) {
              throw new Error(`Stock insuficiente para ${product.name}. Disponible: ${product.quantity}`);
            }

            await tx.product.update({
              where: { id: item.productId },
              data: { quantity: product.quantity - (item.quantity || 1) },
            });

            await tx.stockMovement.create({
              data: {
                productId: item.productId,
                type: 'out',
                quantity: item.quantity || 1,
                reason: 'Venta',
                reference: code,
                userId: user.id,
                userName: user.name,
              },
            });
          }
        }
      }

      return newSale;
    });

    return NextResponse.json(sale, { status: 201 });
  } catch (error) {
    console.error('Create sale error:', error);
    const message = error instanceof Error ? error.message : 'Error al crear venta';
    return NextResponse.json(
      { error: message },
      { status: message.includes('Stock insuficiente') ? 400 : 500 }
    );
  }
}
