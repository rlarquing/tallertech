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
    const product = await db.product.findUnique({
      where: { id },
      include: {
        category: true,
        supplier: true,
        stockMoves: {
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
      },
    });

    if (!product) {
      return NextResponse.json(
        { error: 'Producto no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json(product);
  } catch (error) {
    console.error('Get product error:', error);
    return NextResponse.json(
      { error: 'Error al obtener producto' },
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

    const existing = await db.product.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: 'Producto no encontrado' },
        { status: 404 }
      );
    }

    // Check unique SKU if changing
    if (body.sku && body.sku !== existing.sku) {
      const skuExists = await db.product.findUnique({ where: { sku: body.sku } });
      if (skuExists) {
        return NextResponse.json(
          { error: 'Ya existe un producto con ese SKU' },
          { status: 400 }
        );
      }
    }

    const product = await db.product.update({
      where: { id },
      data: {
        ...(body.name !== undefined && { name: body.name }),
        ...(body.sku !== undefined && { sku: body.sku || null }),
        ...(body.description !== undefined && { description: body.description || null }),
        ...(body.categoryId !== undefined && { categoryId: body.categoryId || null }),
        ...(body.supplierId !== undefined && { supplierId: body.supplierId || null }),
        ...(body.costPrice !== undefined && { costPrice: body.costPrice }),
        ...(body.salePrice !== undefined && { salePrice: body.salePrice }),
        ...(body.quantity !== undefined && { quantity: body.quantity }),
        ...(body.minStock !== undefined && { minStock: body.minStock }),
        ...(body.unit !== undefined && { unit: body.unit }),
        ...(body.type !== undefined && { type: body.type }),
        ...(body.brand !== undefined && { brand: body.brand || null }),
        ...(body.model !== undefined && { model: body.model || null }),
        ...(body.location !== undefined && { location: body.location || null }),
        ...(body.active !== undefined && { active: body.active }),
      },
      include: {
        category: true,
        supplier: true,
      },
    });

    return NextResponse.json(product);
  } catch (error) {
    console.error('Update product error:', error);
    return NextResponse.json(
      { error: 'Error al actualizar producto' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const { id } = await params;

    const existing = await db.product.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: 'Producto no encontrado' },
        { status: 404 }
      );
    }

    // Soft delete
    await db.product.update({
      where: { id },
      data: { active: false },
    });

    return NextResponse.json({ message: 'Producto desactivado exitosamente' });
  } catch (error) {
    console.error('Delete product error:', error);
    return NextResponse.json(
      { error: 'Error al eliminar producto' },
      { status: 500 }
    );
  }
}
