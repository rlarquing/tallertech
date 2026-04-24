import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId') || '';
    const type = searchParams.get('type') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const where: Record<string, unknown> = {};

    if (productId) {
      where.productId = productId;
    }

    if (type) {
      where.type = type;
    }

    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      db.stockMovement.findMany({
        where,
        include: {
          product: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      db.stockMovement.count({ where }),
    ]);

    return NextResponse.json({ data, total, page, limit });
  } catch (error) {
    console.error('Stock movements list error:', error);
    return NextResponse.json(
      { error: 'Error al obtener movimientos de stock' },
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
    const { productId, type, quantity, reason, reference } = body;

    if (!productId || !type || !quantity) {
      return NextResponse.json(
        { error: 'Producto, tipo y cantidad son requeridos' },
        { status: 400 }
      );
    }

    if (!['in', 'out', 'adjustment', 'return'].includes(type)) {
      return NextResponse.json(
        { error: 'Tipo inválido. Use: in, out, adjustment, return' },
        { status: 400 }
      );
    }

    const movement = await db.$transaction(async (tx) => {
      const product = await tx.product.findUnique({
        where: { id: productId },
      });

      if (!product) {
        throw new Error('Producto no encontrado');
      }

      // Update product quantity based on movement type
      let newQuantity = product.quantity;
      switch (type) {
        case 'in':
          newQuantity = product.quantity + quantity;
          break;
        case 'out':
          newQuantity = product.quantity - quantity;
          if (newQuantity < 0) {
            throw new Error(`Stock insuficiente. Disponible: ${product.quantity}`);
          }
          break;
        case 'adjustment':
          newQuantity = quantity; // Set to exact value
          break;
        case 'return':
          newQuantity = product.quantity + quantity;
          break;
      }

      await tx.product.update({
        where: { id: productId },
        data: { quantity: newQuantity },
      });

      const stockMovement = await tx.stockMovement.create({
        data: {
          productId,
          type,
          quantity,
          reason: reason || null,
          reference: reference || null,
          userId: user.id,
          userName: user.name,
        },
        include: {
          product: true,
        },
      });

      return stockMovement;
    });

    return NextResponse.json(movement, { status: 201 });
  } catch (error) {
    console.error('Create stock movement error:', error);
    const message = error instanceof Error ? error.message : 'Error al crear movimiento de stock';
    return NextResponse.json(
      { error: message },
      { status: message.includes('Stock insuficiente') || message.includes('no encontrado') ? 400 : 500 }
    );
  }
}
