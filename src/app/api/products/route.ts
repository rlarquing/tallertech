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
    const search = searchParams.get('search') || '';
    const categoryId = searchParams.get('categoryId') || '';
    const type = searchParams.get('type') || '';
    const lowStock = searchParams.get('lowStock') === 'true';
    const active = searchParams.get('active');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const where: Record<string, unknown> = {};

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { sku: { contains: search } },
        { brand: { contains: search } },
        { model: { contains: search } },
      ];
    }

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (type) {
      where.type = type;
    }

    if (lowStock) {
      where.quantity = { lte: db.product.fields.minStock ? 0 : 0 };
      // Use raw approach for low stock filter
    }

    if (active !== null && active !== '') {
      where.active = active === 'true';
    }

    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      db.product.findMany({
        where,
        include: {
          category: true,
          supplier: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      db.product.count({ where }),
    ]);

    // If lowStock filter, filter in JS since Prisma SQLite doesn't support field comparisons easily
    let filteredData = data;
    if (lowStock) {
      filteredData = data.filter((p) => p.quantity <= p.minStock);
    }

    return NextResponse.json({
      data: filteredData,
      total: lowStock ? filteredData.length : total,
      page,
      limit,
    });
  } catch (error) {
    console.error('Products list error:', error);
    return NextResponse.json(
      { error: 'Error al obtener productos' },
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
      name,
      sku,
      description,
      categoryId,
      supplierId,
      costPrice,
      salePrice,
      quantity,
      minStock,
      unit,
      type,
      brand,
      model,
      location,
    } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'El nombre del producto es requerido' },
        { status: 400 }
      );
    }

    // Check unique SKU
    if (sku) {
      const existingSku = await db.product.findUnique({ where: { sku } });
      if (existingSku) {
        return NextResponse.json(
          { error: 'Ya existe un producto con ese SKU' },
          { status: 400 }
        );
      }
    }

    const product = await db.product.create({
      data: {
        name,
        sku: sku || null,
        description: description || null,
        categoryId: categoryId || null,
        supplierId: supplierId || null,
        costPrice: costPrice || 0,
        salePrice: salePrice || 0,
        quantity: quantity || 0,
        minStock: minStock || 5,
        unit: unit || 'unidad',
        type: type || 'product',
        brand: brand || null,
        model: model || null,
        location: location || null,
      },
      include: {
        category: true,
        supplier: true,
      },
    });

    // Create initial stock movement if quantity > 0
    if (quantity && quantity > 0) {
      await db.stockMovement.create({
        data: {
          productId: product.id,
          type: 'in',
          quantity: quantity,
          reason: 'Stock inicial',
          userId: user.id,
          userName: user.name,
        },
      });
    }

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error('Create product error:', error);
    return NextResponse.json(
      { error: 'Error al crear producto' },
      { status: 500 }
    );
  }
}
