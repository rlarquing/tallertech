---
Task ID: 3
Agent: full-stack-developer
Task: Build all API routes backend

Work Log:
- Created auth helper library at `/src/lib/auth.ts` with cookie-based session management (hashPassword, getSessionUser, createSessionCookie, clearSessionCookie)
- Fixed Next.js 16 async cookies() API — `getSessionUser()` must be awaited since `cookies()` returns a Promise in Next.js 16
- Created 4 auth API routes: `/api/auth/login` (POST), `/api/auth/register` (POST), `/api/auth/session` (GET), `/api/auth/logout` (POST)
- Created products API routes: `/api/products` (GET with search/filter/pagination, POST with initial stock movement), `/api/products/[id]` (GET, PUT, DELETE soft-delete)
- Created categories API routes: `/api/categories` (GET with product count, POST), `/api/categories/[id]` (PUT, DELETE with soft-delete if has products)
- Created suppliers API routes: `/api/suppliers` (GET with product count, POST), `/api/suppliers/[id]` (PUT, DELETE with soft-delete if has products)
- Created customers API routes: `/api/customers` (GET with search/pagination, POST with DNI uniqueness), `/api/customers/[id]` (GET with sales/repairs, PUT, DELETE soft-delete)
- Created sales API routes: `/api/sales` (GET with search/date filter/pagination, POST with transaction — auto decrement inventory), `/api/sales/[id]` (GET with items, PUT — cancel restores inventory)
- Created repair orders API routes: `/api/repairs` (GET with search/status filter/pagination, POST), `/api/repairs/[id]` (GET with parts, PUT with status timestamps), `/api/repairs/[id]/parts` (POST — auto decrement inventory and update parts cost)
- Created stock movements API routes: `/api/stock` (GET with product/type filter/pagination, POST — in/out/adjustment/return with auto quantity update)
- Created expenses API routes: `/api/expenses` (GET with category/date filter/pagination, POST), `/api/expenses/[id]` (PUT, DELETE)
- Created dashboard stats API route: `/api/dashboard` (GET — sales today/week/month, repairs by status, low stock, top products, 30-day revenue chart, expenses)
- Created settings API route: `/api/settings` (GET as key-value map, POST with upsert — admin only)
- Created seed API route: `/api/seed` (POST — seeds 2 users, 8 categories, 3 suppliers, 12 products, 5 customers, 5 sales, 5 repairs, 5 expenses, 7 settings)
- All routes use `await getSessionUser()` for authentication
- All routes return proper HTTP status codes and error messages
- Tested all endpoints successfully — seed, login, session, products, categories, suppliers, customers, sales, repairs, stock, expenses, dashboard, settings

Stage Summary:
- All 12 API route groups created and tested
- Auth system with cookie-based sessions (SHA256 password hashing, base64 cookie)
- Database-backed user authentication (not in-memory)
- Transaction-based operations for sales and repairs (inventory auto-decrement)
- Pagination support across all list endpoints (`page`, `limit`, returns `{data, total, page, limit}`)
- Search and filter support on relevant endpoints
- Soft delete pattern for products, customers, categories, suppliers
- Revenue chart data for last 30 days on dashboard
- Seed endpoint populates comprehensive demo data
