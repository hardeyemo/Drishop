# Shopora

Next.js (App Router) + TypeScript + Tailwind + Supabase marketplace for Nigeria.

## Build status

| Phase | Scope | Status |
|---|---|---|
| 1 | Storefront: home, catalogue (search, filters, sort, pagination), product pages, variants, persistent cart | Implemented |
| 2 | Schema, migrations, RLS, auth, profile, wishlist, route protection | Implemented |
| 3 | Checkout, server-side pricing, stock reservation, discounts, shipping, order page, cancel | Implemented |
| 4 | Paystack initialization, verification and signed webhook | Implemented in `0004_paystack_email_admin.sql` |
| 5 | Order status and tracking updates, payment/shipping emails | Implemented |
| 6 | Admin dashboard, order fulfillment, catalogue visibility | Implemented; product editing and analytics remain future work |

The storefront includes search, category and price filters, wishlist controls, cart, checkout, and account order details.

## Setup

1. `npm install`
2. Create a Supabase project. In **SQL Editor**, run in order:
   `supabase/migrations/0001_schema.sql`, `0002_rls.sql`, `0003_checkout.sql`, `0004_paystack_email_admin.sql`, `0005_carts.sql`, then `supabase/seed.sql`.
3. `cp .env.example .env.local` and fill in `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` and
   `SUPABASE_SERVICE_ROLE_KEY` (Project Settings > API). The service-role key is server only.
4. `npm run dev` and open http://localhost:3000.
5. Run `npm run typecheck` and `npm run build`. Fix anything they report before building on top.

## Make yourself an admin

Sign up at /register once, then in the SQL Editor:

```sql
update profiles set role = 'admin' where id = (select id from auth.users where email = 'you@example.com');
```

Customers cannot change their own role (trigger `profiles_role_guard`).

## Key decisions

- **Money is integer kobo** everywhere; `formatNaira()` is the only place it becomes a string.
- **Stock lives on variants** (`product_variants.stock_quantity`, `check >= 0`). Every product has at least one variant.
  `products.min_price_kobo`, `compare_at_kobo` and `total_stock` are maintained by triggers so listing, filtering
  and sorting are single indexed queries.
- **Orders are created only by the server** with the service-role key. Clients get read-only RLS on their own orders.
  `orders.total_kobo` must equal subtotal - discount + shipping (table check).
- **Payments**: `payments.reference` is unique, and `webhook_events (provider, event_id)` is unique, so a replayed
  or duplicate webhook cannot be processed twice.
- **Cart prices in the browser are display-only.** Checkout will re-price every line from the database.
- **Cart persistence:** `0005_carts.sql` provides customer-owned carts and cart items. The current UI still uses browser `localStorage`; syncing to these tables requires a separate application change.
- Catalogue filters are URL params (plain GET forms), so they work without JS and results are shareable.

## Product images

Seed products have no images, so cards show a monogram tile. Images go in the public Storage bucket
`product-images` (created by `0002_rls.sql`, admin-only writes) with a row in `product_images`.
The admin dashboard (Phase 6) will handle uploads.

## Deploy (Vercel)

1. Push to GitHub and import the repo in Vercel.
2. Add the variables from `.env.example` under Project Settings > Environment Variables.
   `SUPABASE_SERVICE_ROLE_KEY`, `PAYSTACK_SECRET_KEY` and `RESEND_API_KEY` must **not** be prefixed with `NEXT_PUBLIC_`.
3. Deploy. In Supabase, add your Vercel URL under Authentication > URL Configuration.
4. In Paystack, set the webhook URL to `https://your-domain/api/payments/webhook`. The hosted checkout integration needs only the server-side `PAYSTACK_SECRET_KEY`.

## Auth setup (Supabase dashboard)

- Authentication > URL Configuration: set Site URL to your `NEXT_PUBLIC_SITE_URL` and add
  `http://localhost:3000/auth/callback` and your production `/auth/callback` to Redirect URLs.
- Authentication > Providers > Email: leave "Confirm email" on for production. With it off, sign-up signs the user in immediately.
- Email links (confirm, reset) land on `/auth/callback`, which exchanges the code for a session.
- `middleware.ts` refreshes the session and redirects guests away from `/account` and `/admin`.
  Admin pages must also call `requireAdmin()` (in `lib/auth.ts`); the middleware only checks that someone is signed in.
- Supabase's default email sender is heavily rate-limited. Configure custom SMTP (for example Resend) before launch.

## Checkout design (Phase 3)

- **Sign-in is required to check out** (no guest orders), so every order has an owner for tracking and RLS.
- **One database function does the work.** `create_order()` runs in a single transaction: it locks each variant row
  (in id order, so concurrent checkouts can't deadlock), prices lines from the database, checks stock, deducts it
  (the reservation), applies the discount, picks shipping from `shipping_zones`, and inserts the order.
  The browser sends only variant ids, quantities, address, and a code. It never sends a price or total.
- **Overselling is impossible** two ways: the row lock serialises buyers of the last unit, and
  `stock_quantity >= 0` is a table check.
- **Reservation:** unpaid orders hold stock for 30 minutes (`RESERVATION_MINUTES`). `release_expired_orders()` cancels
  expired ones and returns stock. It runs before every new order, and via `/api/cron/release-expired`
  (send `Authorization: Bearer $CRON_SECRET`; Vercel Cron does this automatically when `CRON_SECRET` is set).
  Vercel Hobby only allows daily crons, which is fine because of the run-before-order sweep.
- **Double submits** return the same order (`idempotency_key`), not a second reservation.
- `create_order`, `cancel_order` and `release_expired_orders` are executable only by the service role.
- The price quote on the checkout page calls the same function in dry-run mode, so the screen and the order can't disagree.
- Sample codes (dev seed): `WELCOME10` (10% off), `SAVE5000` (₦5,000 off orders of ₦25,000+).
- Known gap: discount-code and quote requests aren't rate-limited yet.
