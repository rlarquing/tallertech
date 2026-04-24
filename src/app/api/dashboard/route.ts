import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const weekStart = new Date(today);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // Total sales today
    const salesToday = await db.sale.aggregate({
      where: {
        status: 'completed',
        createdAt: { gte: today },
      },
      _sum: { total: true },
      _count: true,
    });

    // Total sales yesterday (for trend)
    const salesYesterday = await db.sale.aggregate({
      where: {
        status: 'completed',
        createdAt: { gte: yesterday, lt: today },
      },
      _sum: { total: true },
    });

    // Total sales this week
    const salesWeek = await db.sale.aggregate({
      where: {
        status: 'completed',
        createdAt: { gte: weekStart },
      },
      _sum: { total: true },
      _count: true,
    });

    // Total sales this month
    const salesMonth = await db.sale.aggregate({
      where: {
        status: 'completed',
        createdAt: { gte: monthStart },
      },
      _sum: { total: true },
      _count: true,
    });

    // Repairs by status
    const repairsByStatus = await db.repairOrder.groupBy({
      by: ['status'],
      _count: { status: true },
    });

    const repairsStatusMap: Record<string, number> = {
      received: 0,
      diagnosing: 0,
      waiting_parts: 0,
      repairing: 0,
      ready: 0,
      delivered: 0,
      cancelled: 0,
    };
    for (const item of repairsByStatus) {
      repairsStatusMap[item.status] = item._count.status;
    }

    // Low stock products count
    const lowStockProducts = await db.product.findMany({
      where: {
        active: true,
        quantity: { lte: 5 },
      },
      select: { id: true, name: true, quantity: true, minStock: true },
    });

    const lowStockCount = lowStockProducts.filter((p) => p.quantity <= p.minStock).length;

    // Top selling products
    const topSellingItems = await db.saleItem.groupBy({
      by: ['productId', 'name'],
      where: {
        sale: { status: 'completed' },
      },
      _sum: { quantity: true, total: true },
      orderBy: { _sum: { quantity: 'desc' } },
      take: 10,
    });

    // Revenue chart data (last 30 days) with expenses
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);

    const salesLast30 = await db.sale.findMany({
      where: {
        status: 'completed',
        createdAt: { gte: thirtyDaysAgo },
      },
      select: {
        createdAt: true,
        total: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    // Expenses last 30 days
    const expensesLast30 = await db.expense.findMany({
      where: {
        date: { gte: thirtyDaysAgo },
      },
      select: {
        date: true,
        amount: true,
      },
      orderBy: { date: 'asc' },
    });

    // Group sales by date
    const revenueByDate: Record<string, number> = {};
    const expensesByDate: Record<string, number> = {};
    for (let i = 0; i < 30; i++) {
      const d = new Date(thirtyDaysAgo);
      d.setDate(d.getDate() + i);
      const key = d.toISOString().split('T')[0];
      revenueByDate[key] = 0;
      expensesByDate[key] = 0;
    }

    for (const sale of salesLast30) {
      const key = sale.createdAt.toISOString().split('T')[0];
      if (revenueByDate[key] !== undefined) {
        revenueByDate[key] += sale.total;
      }
    }

    for (const expense of expensesLast30) {
      const key = expense.date.toISOString().split('T')[0];
      if (expensesByDate[key] !== undefined) {
        expensesByDate[key] += expense.amount;
      }
    }

    const revenueChartData = Object.entries(revenueByDate).map(([date, revenue]) => ({
      date,
      revenue,
      expenses: expensesByDate[date] || 0,
    }));

    // Repairs completed vs pending
    const completedStatuses = ['completed', 'ready', 'delivered'];
    const pendingStatuses = ['received', 'diagnosing', 'waiting_parts', 'repairing'];

    const repairsCompleted = await db.repairOrder.count({
      where: { status: { in: completedStatuses } },
    });

    const repairsPending = await db.repairOrder.count({
      where: { status: { in: pendingStatuses } },
    });

    // Completed repairs today
    const completedRepairsToday = await db.repairOrder.count({
      where: {
        status: { in: ['ready', 'delivered'] },
        completedAt: { gte: today },
      },
    });

    // Total expenses this month
    const expensesMonth = await db.expense.aggregate({
      where: {
        date: { gte: monthStart },
      },
      _sum: { amount: true },
    });

    // Expenses by category this month
    const expensesByCategory = await db.expense.groupBy({
      by: ['category'],
      where: {
        date: { gte: monthStart },
      },
      _sum: { amount: true },
    });

    // Total customers
    const totalCustomers = await db.customer.count({
      where: { active: true },
    });

    // Total products
    const totalProducts = await db.product.count({
      where: { active: true },
    });

    // Recent sales (last 5)
    const recentSales = await db.sale.findMany({
      where: { status: 'completed' },
      select: {
        id: true,
        code: true,
        total: true,
        paymentMethod: true,
        createdAt: true,
        customer: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    // Recent repairs (last 5)
    const recentRepairs = await db.repairOrder.findMany({
      select: {
        id: true,
        code: true,
        device: true,
        status: true,
        totalCost: true,
        createdAt: true,
        customer: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    return NextResponse.json({
      salesToday: {
        total: salesToday._sum.total || 0,
        count: salesToday._count,
      },
      salesYesterday: {
        total: salesYesterday._sum.total || 0,
      },
      salesWeek: {
        total: salesWeek._sum.total || 0,
        count: salesWeek._count,
      },
      salesMonth: {
        total: salesMonth._sum.total || 0,
        count: salesMonth._count,
      },
      repairsByStatus: repairsStatusMap,
      lowStockCount,
      lowStockProducts: lowStockProducts.filter((p) => p.quantity <= p.minStock),
      topProducts: topSellingItems.map((item) => ({
        name: item.name,
        total: item._sum.total || 0,
        quantity: item._sum.quantity || 0,
      })),
      revenueChart: revenueChartData,
      expensesByCategory: expensesByCategory.map((item) => ({
        category: item.category,
        total: item._sum.amount || 0,
      })),
      repairsCompleted,
      repairsPending,
      completedRepairsToday,
      totalCustomers,
      totalProducts,
      pendingRepairs: repairsPending,
      recentSales,
      recentRepairs,
      expensesMonth: {
        total: expensesMonth._sum.amount || 0,
        byCategory: expensesByCategory.map((item) => ({
          category: item.category,
          total: item._sum.amount || 0,
        })),
      },
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    return NextResponse.json(
      { error: 'Error al obtener estadísticas' },
      { status: 500 }
    );
  }
}
