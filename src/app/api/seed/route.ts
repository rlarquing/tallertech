import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { hashPassword } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const force = searchParams.get('force') === 'true';

    // Check if already seeded
    const userCount = await db.user.count();
    if (userCount > 0 && !force) {
      return NextResponse.json(
        { error: 'La base de datos ya tiene datos. Use ?force=true para reiniciar.' },
        { status: 400 }
      );
    }

    // If force reset, delete all existing data in correct order
    if (force && userCount > 0) {
      await db.$transaction([
        db.stockMovement.deleteMany(),
        db.repairPart.deleteMany(),
        db.repairOrder.deleteMany(),
        db.saleItem.deleteMany(),
        db.sale.deleteMany(),
        db.expense.deleteMany(),
        db.customer.deleteMany(),
        db.product.deleteMany(),
        db.category.deleteMany(),
        db.supplier.deleteMany(),
        db.setting.deleteMany(),
        db.auditLog.deleteMany(),
        db.workshopUser.deleteMany(),
        db.workshop.deleteMany(),
        db.user.deleteMany(),
      ]);
    }

    // Create default admin user
    const admin = await db.user.create({
      data: {
        email: 'admin@tallertech.com',
        name: 'Administrador',
        password: hashPassword('admin123'),
        role: 'admin',
      },
    });

    const employee = await db.user.create({
      data: {
        email: 'empleado@tallertech.com',
        name: 'Carlos García',
        password: hashPassword('empleado123'),
        role: 'employee',
      },
    });

    // Create default workshop
    const workshop = await db.workshop.create({
      data: {
        name: 'TallerTech Principal',
        slug: 'tallertech-principal',
        description: 'Taller principal de reparación de celulares',
        address: 'Av. Siempre Viva 742, Buenos Aires',
        phone: '+54 11 5555-9999',
        email: 'info@tallertech.com',
        currency: 'ARS',
        timezone: 'America/Havana',
      },
    });

    // Add admin as owner of the default workshop
    await db.workshopUser.create({
      data: {
        workshopId: workshop.id,
        userId: admin.id,
        role: 'owner',
      },
    });

    // Add employee as employee of the default workshop
    await db.workshopUser.create({
      data: {
        workshopId: workshop.id,
        userId: employee.id,
        role: 'employee',
      },
    });

    const workshopId = workshop.id;

    // Create categories
    const categories = await Promise.all([
      db.category.create({ data: { workshopId, name: 'Pantallas', description: 'Pantallas y displays para celulares', type: 'part' } }),
      db.category.create({ data: { workshopId, name: 'Baterías', description: 'Baterías de reemplazo', type: 'part' } }),
      db.category.create({ data: { workshopId, name: 'Cables y Conectores', description: 'Cables flex, conectores de carga', type: 'part' } }),
      db.category.create({ data: { workshopId, name: 'Carcasas', description: 'Carcasas y marcos', type: 'part' } }),
      db.category.create({ data: { workshopId, name: 'Cámaras', description: 'Módulos de cámara', type: 'part' } }),
      db.category.create({ data: { workshopId, name: 'Accesorios', description: 'Fundas, protectores, cargadores', type: 'product' } }),
      db.category.create({ data: { workshopId, name: 'Servicios', description: 'Servicios de reparación', type: 'service' } }),
      db.category.create({ data: { workshopId, name: 'Herramientas', description: 'Herramientas de reparación', type: 'product' } }),
    ]);

    // Create suppliers
    const suppliers = await Promise.all([
      db.supplier.create({ data: { workshopId, name: 'TechParts LATAM', phone: '+54 11 5555-0001', email: 'ventas@techparts.com', address: 'Buenos Aires, Argentina' } }),
      db.supplier.create({ data: { workshopId, name: 'MobileFix Supply', phone: '+54 11 5555-0002', email: 'info@mobilefix.com', address: 'Córdoba, Argentina' } }),
      db.supplier.create({ data: { workshopId, name: 'Pantallas Express', phone: '+54 11 5555-0003', email: 'ventas@pantallasexpress.com', address: 'Rosario, Argentina' } }),
    ]);

    // Create products
    const products = await Promise.all([
      db.product.create({
        data: {
          workshopId,
          name: 'Pantalla iPhone 13',
          sku: 'PAN-IP13-001',
          description: 'Pantalla LCD completa para iPhone 13',
          categoryId: categories[0].id,
          supplierId: suppliers[2].id,
          costPrice: 25000,
          salePrice: 45000,
          quantity: 15,
          minStock: 5,
          type: 'part',
          brand: 'Genérico',
          model: 'iPhone 13',
          location: 'Estante A1',
        },
      }),
      db.product.create({
        data: {
          workshopId,
          name: 'Pantalla Samsung A54',
          sku: 'PAN-SA54-001',
          description: 'Pantalla AMOLED para Samsung Galaxy A54',
          categoryId: categories[0].id,
          supplierId: suppliers[0].id,
          costPrice: 30000,
          salePrice: 55000,
          quantity: 8,
          minStock: 3,
          type: 'part',
          brand: 'Samsung',
          model: 'Galaxy A54',
          location: 'Estante A2',
        },
      }),
      db.product.create({
        data: {
          workshopId,
          name: 'Batería iPhone 13',
          sku: 'BAT-IP13-001',
          description: 'Batería de reemplazo para iPhone 13',
          categoryId: categories[1].id,
          supplierId: suppliers[1].id,
          costPrice: 8000,
          salePrice: 15000,
          quantity: 20,
          minStock: 5,
          type: 'part',
          brand: 'Genérico',
          model: 'iPhone 13',
          location: 'Estante B1',
        },
      }),
      db.product.create({
        data: {
          workshopId,
          name: 'Batería Samsung S23',
          sku: 'BAT-SS23-001',
          description: 'Batería de reemplazo para Samsung S23',
          categoryId: categories[1].id,
          supplierId: suppliers[0].id,
          costPrice: 12000,
          salePrice: 22000,
          quantity: 10,
          minStock: 3,
          type: 'part',
          brand: 'Samsung',
          model: 'Galaxy S23',
          location: 'Estante B2',
        },
      }),
      db.product.create({
        data: {
          workshopId,
          name: 'Conector de Carga USB-C',
          sku: 'CAB-USBC-001',
          description: 'Conector de carga USB-C genérico',
          categoryId: categories[2].id,
          supplierId: suppliers[1].id,
          costPrice: 2500,
          salePrice: 6000,
          quantity: 50,
          minStock: 10,
          type: 'part',
          location: 'Estante C1',
        },
      }),
      db.product.create({
        data: {
          workshopId,
          name: 'Flex Cable iPhone 14',
          sku: 'CAB-IP14-FLEX',
          description: 'Cable flex de botón home para iPhone 14',
          categoryId: categories[2].id,
          supplierId: suppliers[2].id,
          costPrice: 3500,
          salePrice: 8000,
          quantity: 25,
          minStock: 5,
          type: 'part',
          brand: 'Genérico',
          model: 'iPhone 14',
          location: 'Estante C2',
        },
      }),
      db.product.create({
        data: {
          workshopId,
          name: 'Carcaza iPhone 13 Pro',
          sku: 'CAR-IP13P-001',
          description: 'Carcaza trasera para iPhone 13 Pro',
          categoryId: categories[3].id,
          supplierId: suppliers[2].id,
          costPrice: 15000,
          salePrice: 28000,
          quantity: 6,
          minStock: 3,
          type: 'part',
          brand: 'Genérico',
          model: 'iPhone 13 Pro',
          location: 'Estante D1',
        },
      }),
      db.product.create({
        data: {
          workshopId,
          name: 'Cámara Frontal iPhone 14',
          sku: 'CAM-IP14-F',
          description: 'Módulo de cámara frontal para iPhone 14',
          categoryId: categories[4].id,
          supplierId: suppliers[0].id,
          costPrice: 10000,
          salePrice: 18000,
          quantity: 12,
          minStock: 3,
          type: 'part',
          brand: 'Genérico',
          model: 'iPhone 14',
          location: 'Estante E1',
        },
      }),
      db.product.create({
        data: {
          workshopId,
          name: 'Protector Pantalla Templado',
          sku: 'ACC-PROT-001',
          description: 'Protector de pantalla templado universal',
          categoryId: categories[5].id,
          supplierId: suppliers[1].id,
          costPrice: 500,
          salePrice: 2500,
          quantity: 100,
          minStock: 20,
          type: 'product',
          location: 'Mostrador',
        },
      }),
      db.product.create({
        data: {
          workshopId,
          name: 'Funda Silicona Universal',
          sku: 'ACC-FUND-001',
          description: 'Funda de silicona genérica',
          categoryId: categories[5].id,
          supplierId: suppliers[1].id,
          costPrice: 800,
          salePrice: 3500,
          quantity: 60,
          minStock: 15,
          type: 'product',
          location: 'Mostrador',
        },
      }),
      db.product.create({
        data: {
          workshopId,
          name: 'Kit Herramientas Reparación',
          sku: 'HER-KIT-001',
          description: 'Kit completo de herramientas para reparación de celulares',
          categoryId: categories[7].id,
          supplierId: suppliers[0].id,
          costPrice: 5000,
          salePrice: 12000,
          quantity: 8,
          minStock: 2,
          type: 'product',
          location: 'Taller',
        },
      }),
      db.product.create({
        data: {
          workshopId,
          name: 'Servicio Cambio de Pantalla',
          sku: 'SRV-PANT',
          description: 'Servicio de reemplazo de pantalla',
          categoryId: categories[6].id,
          costPrice: 0,
          salePrice: 5000,
          quantity: 999,
          minStock: 0,
          type: 'service',
          location: 'Taller',
        },
      }),
    ]);

    // Create stock movements for initial inventory
    await Promise.all(
      products
        .filter((p) => p.type !== 'service' && p.quantity > 0)
        .map((product) =>
          db.stockMovement.create({
            data: {
              productId: product.id,
              type: 'in',
              quantity: product.quantity,
              reason: 'Stock inicial',
              userId: admin.id,
              userName: admin.name,
            },
          })
        )
    );

    // Create sample customers
    const customers = await Promise.all([
      db.customer.create({ data: { workshopId, name: 'María López', phone: '+54 11 6666-0001', email: 'maria@email.com', dni: '12345678' } }),
      db.customer.create({ data: { workshopId, name: 'Juan Pérez', phone: '+54 11 6666-0002', email: 'juan@email.com', dni: '23456789' } }),
      db.customer.create({ data: { workshopId, name: 'Ana Martínez', phone: '+54 11 6666-0003', email: 'ana@email.com', dni: '34567890' } }),
      db.customer.create({ data: { workshopId, name: 'Roberto Sánchez', phone: '+54 11 6666-0004', dni: '45678901' } }),
      db.customer.create({ data: { workshopId, name: 'Laura Torres', phone: '+54 11 6666-0005', email: 'laura@email.com', dni: '56789012' } }),
    ]);

    // Create some sample sales
    const now = new Date();
    const salesData = [
      {
        daysAgo: 0,
        customerIdx: 0,
        items: [{ productIdx: 8, quantity: 2 }, { productIdx: 9, quantity: 1 }],
        paymentMethod: 'efectivo',
      },
      {
        daysAgo: 1,
        customerIdx: 1,
        items: [{ productIdx: 11, quantity: 1 }],
        paymentMethod: 'transferencia',
      },
      {
        daysAgo: 3,
        customerIdx: 2,
        items: [{ productIdx: 4, quantity: 3 }],
        paymentMethod: 'efectivo',
      },
      {
        daysAgo: 5,
        customerIdx: 3,
        items: [{ productIdx: 8, quantity: 1 }, { productIdx: 11, quantity: 1 }],
        paymentMethod: 'efectivo',
      },
      {
        daysAgo: 10,
        customerIdx: 4,
        items: [{ productIdx: 9, quantity: 2 }],
        paymentMethod: 'mixto',
      },
    ];

    const createdSales = [];
    for (const saleData of salesData) {
      const saleDate = new Date(now);
      saleDate.setDate(saleDate.getDate() - saleData.daysAgo);

      let subtotal = 0;
      const saleItems = saleData.items.map((item) => {
        const product = products[item.productIdx];
        const itemTotal = product.salePrice * item.quantity;
        subtotal += itemTotal;
        return {
          productId: product.id,
          name: product.name,
          quantity: item.quantity,
          unitPrice: product.salePrice,
          discount: 0,
          total: itemTotal,
          type: product.type,
        };
      });

      const code = `VEN-${(Date.now() - saleData.daysAgo * 86400000).toString(36).slice(-4).toUpperCase()}${Math.random().toString(36).substring(2, 5).toUpperCase()}`;

      const sale = await db.sale.create({
        data: {
          workshopId,
          code,
          customerId: customers[saleData.customerIdx].id,
          userId: admin.id,
          userName: admin.name,
          subtotal,
          discount: 0,
          tax: 0,
          total: subtotal,
          paymentMethod: saleData.paymentMethod,
          createdAt: saleDate,
          items: {
            create: saleItems,
          },
        },
      });

      createdSales.push(sale);
    }

    // Create some sample repair orders
    const repairData = [
      {
        daysAgo: 0,
        customerIdx: 0,
        device: 'iPhone 13',
        brand: 'Apple',
        imei: '123456789012345',
        issue: 'Pantalla rota',
        status: 'received',
        priority: 'high',
        costEstimate: 50000,
      },
      {
        daysAgo: 2,
        customerIdx: 1,
        device: 'Samsung A54',
        brand: 'Samsung',
        issue: 'No carga la batería',
        status: 'diagnosing',
        priority: 'normal',
        costEstimate: 22000,
      },
      {
        daysAgo: 5,
        customerIdx: 2,
        device: 'iPhone 14',
        brand: 'Apple',
        issue: 'Cámara frontal no funciona',
        diagnosis: 'Módulo de cámara dañado',
        status: 'waiting_parts',
        priority: 'normal',
        costEstimate: 23000,
      },
      {
        daysAgo: 7,
        customerIdx: 3,
        device: 'Samsung S23',
        brand: 'Samsung',
        issue: 'Batería se descarga rápido',
        status: 'repairing',
        priority: 'low',
        costEstimate: 27000,
      },
      {
        daysAgo: 14,
        customerIdx: 4,
        device: 'iPhone 13 Pro',
        brand: 'Apple',
        issue: 'Carcaza rota',
        solution: 'Reemplazo de carcaza completo',
        status: 'delivered',
        priority: 'normal',
        costEstimate: 33000,
        laborCost: 5000,
        partsCost: 28000,
        totalCost: 33000,
        paid: true,
      },
    ];

    for (const rd of repairData) {
      const repairDate = new Date(now);
      repairDate.setDate(repairDate.getDate() - rd.daysAgo);

      const code = `REP-${(Date.now() - rd.daysAgo * 86400000).toString(36).slice(-4).toUpperCase()}${Math.random().toString(36).substring(2, 5).toUpperCase()}`;

      const repairCreateData: Record<string, unknown> = {
        workshopId,
        code,
        customerId: customers[rd.customerIdx].id,
        userId: admin.id,
        userName: admin.name,
        device: rd.device,
        brand: rd.brand || null,
        imei: rd.imei || null,
        issue: rd.issue,
        diagnosis: rd.diagnosis || null,
        solution: (rd as Record<string, unknown>).solution || null,
        status: rd.status,
        priority: rd.priority,
        costEstimate: rd.costEstimate,
        laborCost: rd.laborCost || 0,
        partsCost: rd.partsCost || 0,
        totalCost: rd.totalCost || 0,
        paid: rd.paid || false,
        receivedAt: repairDate,
      };

      if (rd.status === 'delivered') {
        const deliveredDate = new Date(repairDate);
        deliveredDate.setDate(deliveredDate.getDate() + 2);
        repairCreateData.deliveredAt = deliveredDate;
        repairCreateData.completedAt = deliveredDate;
      }

      await db.repairOrder.create({
        data: repairCreateData as Parameters<typeof db.repairOrder.create>[0]['data'],
      });
    }

    // Create sample expenses
    const expenseData = [
      { category: 'supplies', description: 'Compra de repuestos mayorista', amount: 150000, daysAgo: 2 },
      { category: 'rent', description: 'Alquiler del local', amount: 80000, daysAgo: 1 },
      { category: 'utilities', description: 'Factura de electricidad', amount: 12000, daysAgo: 5 },
      { category: 'salary', description: 'Sueldo empleado', amount: 65000, daysAgo: 10 },
      { category: 'other', description: 'Publicidad redes sociales', amount: 5000, daysAgo: 7 },
    ];

    for (const exp of expenseData) {
      const expDate = new Date(now);
      expDate.setDate(expDate.getDate() - exp.daysAgo);

      await db.expense.create({
        data: {
          workshopId,
          category: exp.category,
          description: exp.description,
          amount: exp.amount,
          userId: admin.id,
          userName: admin.name,
          date: expDate,
        },
      });
    }

    // Create default settings
    await db.setting.createMany({
      data: [
        { workshopId, key: 'shop_name', value: 'TallerTech' },
        { workshopId, key: 'shop_phone', value: '+54 11 5555-9999' },
        { workshopId, key: 'shop_address', value: 'Av. Siempre Viva 742, Buenos Aires' },
        { workshopId, key: 'shop_email', value: 'info@tallertech.com' },
        { workshopId, key: 'currency', value: 'ARS' },
        { workshopId, key: 'tax_rate', value: '21' },
        { workshopId, key: 'receipt_footer', value: 'Gracias por su compra!' },
      ],
    });

    return NextResponse.json({
      message: 'Base de datos inicializada exitosamente',
      data: {
        users: 2,
        workshops: 1,
        categories: categories.length,
        suppliers: suppliers.length,
        products: products.length,
        customers: customers.length,
        sales: createdSales.length,
        expenses: expenseData.length,
        settings: 7,
      },
    }, { status: 201 });
  } catch (error) {
    console.error('Seed error:', error);
    return NextResponse.json(
      { error: 'Error al inicializar la base de datos', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
