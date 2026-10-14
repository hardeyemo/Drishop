-- Development/demo catalogue data for Drishop.
-- Apply after migrations 0001_schema.sql and 0002_rls.sql.
-- Safe to rerun: inserts use unique slugs/SKUs and never update or delete existing rows.
-- All prices are NGN * 100 (kobo). No customer, order, payment, or auth data is touched.
begin;

insert into public.categories (name, slug, description, sort_order, is_active) values
  ('Phones & Tablets', 'phones-tablets', 'Smartphones, tablets, chargers and mobile accessories.', 1, true),
  ('Computers & Accessories', 'computing', 'Laptops, peripherals, storage and work essentials.', 2, true),
  ('TV, Audio & Smart Home', 'electronics', 'Televisions, headphones, speakers and connected devices.', 3, true),
  ('Fashion', 'fashion', 'Clothing, footwear, bags and accessories for everyday Nigerian life.', 4, true),
  ('Home & Kitchen', 'home-kitchen', 'Useful appliances, cookware, bedding and home essentials.', 5, true),
  ('Beauty & Personal Care', 'beauty', 'Skincare, haircare and personal care essentials.', 6, true),
  ('Groceries & Food Cupboard', 'groceries', 'Pantry staples, snacks and everyday household supplies.', 7, true),
  ('Baby, Kids & Toys', 'baby-kids', 'Baby care, children’s essentials, toys and learning products.', 8, true)
on conflict (slug) do nothing;

insert into public.products
  (category_id, name, slug, brand, description, is_active, is_featured, units_sold)
select c.id, v.name, v.slug, v.brand, v.description, true, v.is_featured, v.units_sold
from (values
  ('phones-tablets', 'Nova X5 Smartphone', 'nova-x5-smartphone', 'Nova', '6.6-inch AMOLED display, 50MP camera and all-day battery.', true, 420),
  ('phones-tablets', 'Nova Tab 10 Tablet', 'nova-tab-10-tablet', 'Nova', '10.4-inch tablet with 4GB RAM and 64GB storage for work and study.', false, 150),
  ('computing', 'Aria Slim 14 Laptop', 'aria-slim-14-laptop', 'Aria', 'Lightweight 14-inch laptop with 16GB RAM and a 512GB SSD.', true, 210),
  ('computing', 'Aria Wireless Mouse', 'aria-wireless-mouse', 'Aria', 'Quiet-click wireless mouse with adjustable DPI.', false, 640),
  ('electronics', 'Pulse Noise-Cancelling Headphones', 'pulse-over-ear-headphones', 'Pulse', 'Wireless over-ear headphones with noise cancelling and long battery life.', true, 380),
  ('electronics', 'Beam 43-inch 4K Smart TV', 'beam-43-4k-smart-tv', 'Beam', '43-inch 4K smart television with streaming apps and three HDMI ports.', false, 95),
  ('electronics', 'Pulse Portable Bluetooth Speaker', 'pulse-portable-speaker', 'Pulse', 'Water-resistant portable speaker with up to 14 hours of playback.', false, 510),
  ('fashion', 'Stride Everyday Sneakers', 'stride-classic-sneakers', 'Stride', 'Comfortable everyday sneakers with cushioned insoles.', true, 730),
  ('fashion', 'Tailor Ankara Shirt', 'tailor-ankara-shirt', 'Tailor', 'Breathable short-sleeve cotton Ankara shirt in a tailored fit.', false, 260),
  ('fashion', 'Voyage Laptop Backpack', 'voyage-leather-backpack', 'Voyage', 'Padded laptop compartment, water-resistant lining and reinforced straps.', false, 175),
  ('home-kitchen', 'Hearth Non-stick Pan Set', 'hearth-nonstick-pan-set', 'Hearth', 'Three-piece non-stick pan set for gas, electric and induction hobs.', true, 300),
  ('home-kitchen', 'Brew Electric Kettle 1.8L', 'brew-electric-kettle', 'Brew', 'Stainless steel kettle with automatic shut-off and boil-dry protection.', false, 455),
  ('home-kitchen', 'Hearth Cotton Bedding Set', 'linen-bedding-set', 'Hearth', 'Soft cotton-blend duvet cover, fitted sheet and two pillowcases.', false, 120),
  ('beauty', 'Glow Shea Body Butter', 'glow-shea-body-butter', 'Glow', 'Moisturising shea body butter with a lightweight, non-greasy feel.', false, 890),
  ('beauty', 'Glow Vitamin C Serum', 'glow-vitamin-c-serum', 'Glow', 'Lightweight daily vitamin C serum for a simple skincare routine.', true, 610),
  ('groceries', 'Harvest Jollof Rice 5kg', 'harvest-jollof-rice-5kg', 'Harvest', 'Parboiled long-grain rice suitable for family meals and jollof rice.', true, 540),
  ('groceries', 'GoldPalm Vegetable Oil 2L', 'goldpalm-vegetable-oil-2l', 'GoldPalm', 'Refined vegetable oil in a practical two-litre bottle.', false, 390),
  ('baby-kids', 'Little Steps Baby Wipes 4-Pack', 'little-steps-baby-wipes-4-pack', 'Little Steps', 'Four soft, fragrance-free packs for everyday baby care.', false, 280)
) as v(category_slug, name, slug, brand, description, is_featured, units_sold)
join public.categories c on c.slug = v.category_slug
on conflict (slug) do nothing;

-- Variant triggers in 0001_schema.sql calculate each product's displayed price and stock.
-- Comparisons are optional and, when present, are greater than the live price.
insert into public.product_variants
  (product_id, sku, name, options, price_kobo, compare_at_price_kobo, stock_quantity, is_active)
select p.id, v.sku, v.variant_name, v.options::jsonb, v.price_kobo, v.compare_at_kobo, v.stock, true
from (values
  ('nova-x5-smartphone', 'NOVA-X5-128', '128GB', '{"storage":"128GB"}', 28900000, 31500000, 25),
  ('nova-x5-smartphone', 'NOVA-X5-256', '256GB', '{"storage":"256GB"}', 33500000, null, 12),
  ('nova-tab-10-tablet', 'NOVA-TAB10', 'Default', '{}', 16500000, null, 18),
  ('aria-slim-14-laptop', 'ARIA-SLIM14', 'Default', '{}', 68500000, 75000000, 9),
  ('aria-wireless-mouse', 'ARIA-MOUSE', 'Default', '{}', 850000, null, 120),
  ('pulse-over-ear-headphones', 'PULSE-OE', 'Default', '{}', 4200000, 5500000, 40),
  ('beam-43-4k-smart-tv', 'BEAM-43', 'Default', '{}', 32000000, null, 6),
  ('pulse-portable-speaker', 'PULSE-SPK', 'Default', '{}', 2850000, null, 30),
  ('stride-classic-sneakers', 'STRIDE-40', 'Size 40', '{"size":"40"}', 3800000, null, 14),
  ('stride-classic-sneakers', 'STRIDE-42', 'Size 42', '{"size":"42"}', 3800000, null, 20),
  ('stride-classic-sneakers', 'STRIDE-44', 'Size 44', '{"size":"44"}', 3800000, null, 8),
  ('tailor-ankara-shirt', 'TAILOR-ANK-M', 'Medium', '{"size":"M"}', 1850000, null, 18),
  ('tailor-ankara-shirt', 'TAILOR-ANK-L', 'Large', '{"size":"L"}', 1850000, null, 17),
  ('voyage-leather-backpack', 'VOYAGE-BP', 'Default', '{}', 4500000, 6000000, 22),
  ('hearth-nonstick-pan-set', 'HEARTH-PAN3', 'Default', '{}', 3600000, null, 28),
  ('brew-electric-kettle', 'BREW-18', 'Default', '{}', 1450000, null, 60),
  ('linen-bedding-set', 'HEARTH-LINEN', 'Queen', '{"size":"Queen"}', 3200000, 4000000, 15),
  ('glow-shea-body-butter', 'GLOW-SHEA', 'Default', '{}', 650000, null, 200),
  ('glow-vitamin-c-serum', 'GLOW-VITC', 'Default', '{}', 1250000, 1500000, 85),
  ('harvest-jollof-rice-5kg', 'HARVEST-RICE-5KG', '5kg', '{"weight":"5kg"}', 725000, null, 75),
  ('goldpalm-vegetable-oil-2l', 'GOLDPALM-OIL-2L', '2L', '{"volume":"2L"}', 1180000, null, 54),
  ('little-steps-baby-wipes-4-pack', 'LSTEPS-WIPES-4', '4-pack', '{"pack":"4"}', 960000, 1100000, 48)
) as v(product_slug, sku, variant_name, options, price_kobo, compare_at_kobo, stock)
join public.products p on p.slug = v.product_slug
on conflict (sku) do nothing;

-- Additional 30 illustrative products. Variants are added only for products inserted by
-- this statement, so an existing product with a matching slug is never modified.
with new_products as (
  insert into public.products
    (category_id, name, slug, brand, description, is_active, is_featured, units_sold)
  select c.id, v.name, v.slug, v.brand, v.description, true, v.is_featured, 0
  from (values
    ('phones-tablets', 'Nova Air 6 Smartphone', 'nova-air-6-smartphone', 'Nova', '6.5-inch AMOLED display, 8GB memory and 128GB storage for everyday work and entertainment.', true),
    ('phones-tablets', 'Nova Edge 256 Smartphone', 'nova-edge-256-smartphone', 'Nova', '6.7-inch display, 256GB storage, dual rear cameras and fast charging.', false),
    ('phones-tablets', 'Nova Tab S 11 Tablet', 'nova-tab-s-11-tablet', 'Nova', '11-inch tablet with a bright display, 128GB storage and included stylus.', false),
    ('phones-tablets', 'Nova Blue 5G Smartphone', 'nova-blue-5g-smartphone', 'Nova', '5G-ready smartphone with a 6.6-inch display, 128GB storage and dual SIM support.', false),
    ('computing', 'Aria Core 15 Laptop', 'aria-core-15-laptop', 'Aria', '15.6-inch Full HD laptop with 16GB memory and a 512GB solid-state drive.', true),
    ('computing', 'Aria Flex 13 Laptop', 'aria-flex-13-laptop', 'Aria', 'Portable 13.3-inch laptop with 8GB memory, 512GB storage and an all-day battery.', false),
    ('computing', 'Aria Studio 16 Laptop', 'aria-studio-16-laptop', 'Aria', '16-inch laptop with a high-resolution display, 16GB memory and 1TB storage.', false),
    ('electronics', 'Pulse Studio Wireless Headphones', 'pulse-studio-wireless-headphones', 'Pulse', 'Over-ear wireless headphones with cushioned ear cups and built-in microphone.', true),
    ('electronics', 'Pulse Mini Bluetooth Speaker', 'pulse-mini-bluetooth-speaker', 'Pulse', 'Compact Bluetooth speaker with portable design and clear everyday audio.', false),
    ('electronics', 'Pulse Classic Bluetooth Headphones', 'pulse-classic-bluetooth-headphones', 'Pulse', 'Foldable Bluetooth headphones with on-ear controls and rechargeable battery.', false),
    ('electronics', 'Nova Buds Wireless Earphones', 'nova-buds-wireless-earphones', 'Nova', 'True wireless earphones with a pocket charging case and touch controls.', false),
    ('fashion', 'Tailor White Cotton Shirt', 'tailor-white-cotton-shirt', 'Tailor', 'Long-sleeve cotton-blend shirt with a classic collar for work and occasions.', true),
    ('fashion', 'Tailor Patterned Two-Piece Set', 'tailor-patterned-two-piece-set', 'Tailor', 'Comfortable patterned two-piece outfit with an easy fit for warm weather.', false),
    ('fashion', 'Tailor Casual Streetwear Set', 'tailor-casual-streetwear-set', 'Tailor', 'Relaxed casual top and trouser set made for everyday outings.', false),
    ('fashion', 'Stride Urban Running Sneakers', 'stride-urban-running-sneakers', 'Stride', 'Lightweight lace-up sneakers with cushioned soles for walking and daily wear.', true),
    ('fashion', 'Stride Canvas Low-Top Trainers', 'stride-canvas-low-top-trainers', 'Stride', 'Classic canvas low-top trainers with a flexible rubber sole.', false),
    ('fashion', 'Stride Everyday White Sneakers', 'stride-everyday-white-sneakers', 'Stride', 'Versatile low-top sneakers with padded lining and a clean everyday profile.', false),
    ('fashion', 'Voyage Black Sling Bag', 'voyage-black-sling-bag', 'Voyage', 'Compact crossbody sling bag with adjustable strap and zipped storage.', false),
    ('fashion', 'Voyage Pink Crossbody Bag', 'voyage-pink-crossbody-bag', 'Voyage', 'Lightweight crossbody bag with adjustable strap for daily essentials.', false),
    ('fashion', 'Voyage Travel Essentials Backpack', 'voyage-travel-essentials-backpack', 'Voyage', 'Roomy travel backpack with multiple compartments and padded shoulder straps.', false),
    ('home-kitchen', 'Brew Compact Electric Kettle', 'brew-compact-electric-kettle', 'Brew', 'Compact electric kettle with automatic shut-off and a removable filter.', true),
    ('home-kitchen', 'BlendPro 1.5L Countertop Blender', 'blendpro-15l-countertop-blender', 'BlendPro', '1.5-litre countertop blender for smoothies, soups and everyday food preparation.', false),
    ('home-kitchen', 'Hearth 20L Microwave Oven', 'hearth-20l-microwave-oven', 'Hearth', '20-litre microwave oven with simple controls and multiple power settings.', false),
    ('beauty', 'Glow Hydrating Face Serum 30ml', 'glow-hydrating-face-serum-30ml', 'Glow', 'Lightweight dropper serum for a simple daily skincare routine.', true),
    ('beauty', 'Glow Botanical Body Lotion 250ml', 'glow-botanical-body-lotion-250ml', 'Glow', 'Daily body lotion with a light texture for after-bath moisturising.', false),
    ('groceries', 'Harvest Premium Rice 10kg', 'harvest-premium-rice-10kg', 'Harvest', '10kg bag of parboiled long-grain rice for family meals and jollof.', true),
    ('groceries', 'GoldPalm Groundnut Oil 1L', 'goldpalm-groundnut-oil-1l', 'GoldPalm', 'One-litre bottle of groundnut cooking oil for everyday meals.', false),
    ('groceries', 'Harvest Rice and Beans Pantry Bundle', 'harvest-rice-beans-pantry-bundle', 'Harvest', 'Pantry bundle with rice and beans for convenient family cooking.', false),
    ('baby-kids', 'Little Steps Baby Diapers Size 3', 'little-steps-baby-diapers-size-3', 'Little Steps', 'Soft disposable diapers in size 3 for everyday baby care.', true),
    ('baby-kids', 'Little Steps Newborn Care Starter Pack', 'little-steps-newborn-care-starter-pack', 'Little Steps', 'Newborn care bundle with gentle wipes and everyday changing essentials.', false)
  ) as v(category_slug, name, slug, brand, description, is_featured)
  join public.categories c on c.slug = v.category_slug
  on conflict (slug) do nothing
  returning id, slug
)
insert into public.product_variants
  (product_id, sku, name, options, price_kobo, compare_at_price_kobo, stock_quantity, is_active)
select np.id, v.sku, 'Default', '{}'::jsonb, v.price_kobo, null, v.stock, true
from new_products np
join (values
  ('nova-air-6-smartphone', 'NOVA-AIR6-128', 25900000, 18),
  ('nova-edge-256-smartphone', 'NOVA-EDGE256', 32500000, 12),
  ('nova-tab-s-11-tablet', 'NOVA-TABS11', 22800000, 15),
  ('nova-blue-5g-smartphone', 'NOVA-BLUE5G', 36000000, 8),
  ('aria-core-15-laptop', 'ARIA-CORE15', 48500000, 9),
  ('aria-flex-13-laptop', 'ARIA-FLEX13', 62500000, 6),
  ('aria-studio-16-laptop', 'ARIA-STUDIO16', 92500000, 4),
  ('pulse-studio-wireless-headphones', 'PULSE-STUDIO-WH', 5600000, 35),
  ('pulse-mini-bluetooth-speaker', 'PULSE-MINI-BT', 3450000, 42),
  ('pulse-classic-bluetooth-headphones', 'PULSE-CLASSIC-BT', 4900000, 28),
  ('nova-buds-wireless-earphones', 'NOVA-BUDS-TWS', 1250000, 60),
  ('tailor-white-cotton-shirt', 'TAILOR-WHITE-S', 2800000, 24),
  ('tailor-patterned-two-piece-set', 'TAILOR-PATTERN-SET', 4500000, 16),
  ('tailor-casual-streetwear-set', 'TAILOR-STREET-SET', 3200000, 19),
  ('stride-urban-running-sneakers', 'STRIDE-URBAN-42', 5500000, 16),
  ('stride-canvas-low-top-trainers', 'STRIDE-CANVAS-41', 3200000, 22),
  ('stride-everyday-white-sneakers', 'STRIDE-WHITE-40', 4800000, 14),
  ('voyage-black-sling-bag', 'VOYAGE-SLING-BLK', 3800000, 20),
  ('voyage-pink-crossbody-bag', 'VOYAGE-CROSSBODY-PNK', 7200000, 10),
  ('voyage-travel-essentials-backpack', 'VOYAGE-TRAVEL-BP', 5900000, 17),
  ('brew-compact-electric-kettle', 'BREW-COMPACT-KETTLE', 2200000, 32),
  ('blendpro-15l-countertop-blender', 'BLENDPRO-15L', 3800000, 24),
  ('hearth-20l-microwave-oven', 'HEARTH-MICRO-20L', 11500000, 7),
  ('glow-hydrating-face-serum-30ml', 'GLOW-HYDRATE-30', 1650000, 72),
  ('glow-botanical-body-lotion-250ml', 'GLOW-BOTANICAL-250', 1100000, 95),
  ('harvest-premium-rice-10kg', 'HARVEST-RICE-10KG', 1850000, 48),
  ('goldpalm-groundnut-oil-1l', 'GOLDPALM-GROUNDNUT-1L', 720000, 65),
  ('harvest-rice-beans-pantry-bundle', 'HARVEST-RICE-BEANS-BDL', 1250000, 30),
  ('little-steps-baby-diapers-size-3', 'LSTEPS-DIAPER-S3', 4450000, 40),
  ('little-steps-newborn-care-starter-pack', 'LSTEPS-NEWBORN-STARTER', 3150000, 26)
) as v(product_slug, sku, price_kobo, stock) on v.product_slug = np.slug
on conflict (sku) do nothing;

-- Additional 50 illustrative products. This block only adds catalogue rows whose
-- slugs/SKUs are not already present; it never updates existing product data.
with new_products as (
  insert into public.products
    (category_id, name, slug, brand, description, is_active, is_featured, units_sold)
  select c.id, v.name, v.slug, v.brand, v.description, true, v.is_featured, 0
  from (values
    ('phones-tablets', 'Nova Spark 128GB Smartphone', 'nova-spark-128-smartphone', 'Nova', '6.5-inch display, dual SIM, 128GB storage and a long-lasting battery.', true),
    ('phones-tablets', 'Nova Max 256GB Smartphone', 'nova-max-256-smartphone', 'Nova', 'Large-screen smartphone with 256GB storage and a versatile triple camera.', false),
    ('phones-tablets', 'Nova Tab Mini 8 Tablet', 'nova-tab-mini-8-tablet', 'Nova', 'Compact 8-inch tablet for reading, video calls and everyday browsing.', false),
    ('phones-tablets', 'Nova Fast USB-C Charger 33W', 'nova-usb-c-charger-33w', 'Nova', '33W USB-C wall charger with built-in over-current protection.', false),
    ('phones-tablets', 'Nova Braided USB-C Cable 2m', 'nova-braided-usb-c-cable-2m', 'Nova', 'Durable two-metre USB-C cable for charging and data transfer.', false),
    ('phones-tablets', 'Nova Dual SIM 4G Feature Phone', 'nova-dual-sim-4g-feature-phone', 'Nova', 'Simple dual-SIM handset with 4G connectivity and an easy-to-read display.', false),
    ('computing', 'Aria Business 14 Laptop', 'aria-business-14-laptop', 'Aria', '14-inch Full HD laptop with 8GB memory and 256GB SSD storage.', true),
    ('computing', 'Aria Chromebook 11', 'aria-chromebook-11', 'Aria', 'Lightweight 11-inch Chromebook for study, browsing and cloud-based work.', false),
    ('computing', 'Aria 24-inch Full HD Monitor', 'aria-24-inch-fhd-monitor', 'Aria', '24-inch Full HD monitor with HDMI input and adjustable viewing angle.', false),
    ('computing', 'Aria Mechanical Keyboard', 'aria-mechanical-keyboard', 'Aria', 'Full-size mechanical keyboard with tactile switches and adjustable lighting.', false),
    ('computing', 'Aria 1TB Portable SSD', 'aria-1tb-portable-ssd', 'Aria', 'Compact 1TB solid-state drive for fast backups and file transfers.', false),
    ('computing', 'Aria Wi-Fi 6 Router', 'aria-wifi-6-router', 'Aria', 'Dual-band Wi-Fi 6 router with four Gigabit LAN ports for home use.', false),
    ('electronics', 'Beam 32-inch HD Smart TV', 'beam-32-hd-smart-tv', 'Beam', '32-inch HD smart television with streaming apps and HDMI connectivity.', true),
    ('electronics', 'Pulse Soundbar with Subwoofer', 'pulse-soundbar-subwoofer', 'Pulse', 'TV soundbar and wired subwoofer with Bluetooth and optical input.', false),
    ('electronics', 'Pulse True Wireless Earbuds', 'pulse-true-wireless-earbuds', 'Pulse', 'Wireless earbuds with charging case, touch controls and built-in microphones.', false),
    ('electronics', 'Beam HD Projector', 'beam-hd-projector', 'Beam', 'Portable HD projector with HDMI input for films and presentations.', false),
    ('electronics', 'Pulse 10,000mAh Power Bank', 'pulse-10000mah-power-bank', 'Pulse', '10,000mAh portable power bank with USB-A and USB-C output ports.', false),
    ('electronics', 'Luma Smart LED Bulb 2-Pack', 'luma-smart-led-bulb-2-pack', 'Luma', 'Two dimmable smart LED bulbs with app-based scheduling and warm-to-cool light.', false),
    ('fashion', 'Tailor Classic Polo Shirt', 'tailor-classic-polo-shirt', 'Tailor', 'Cotton-blend short-sleeve polo shirt with a comfortable everyday fit.', true),
    ('fashion', 'Tailor Denim Jeans', 'tailor-denim-jeans', 'Tailor', 'Straight-fit denim jeans with five-pocket styling for everyday wear.', false),
    ('fashion', 'Tailor Lightweight Rain Jacket', 'tailor-lightweight-rain-jacket', 'Tailor', 'Packable water-resistant jacket with a hood for rainy commutes.', false),
    ('fashion', 'Stride Leather Office Loafers', 'stride-leather-office-loafers', 'Stride', 'Smart slip-on loafers with a cushioned footbed for work and occasions.', false),
    ('fashion', 'Stride Kids Velcro Sneakers', 'stride-kids-velcro-sneakers', 'Stride', 'Lightweight children’s sneakers with adjustable hook-and-loop straps.', false),
    ('fashion', 'Voyage Everyday Tote Bag', 'voyage-everyday-tote-bag', 'Voyage', 'Roomy lined tote with an inner pocket for commuting and shopping.', false),
    ('fashion', 'Voyage Compact Wallet', 'voyage-compact-wallet', 'Voyage', 'Compact wallet with card slots, a zipped coin pocket and secure closure.', false),
    ('fashion', 'Aso-Oke Occasion Cap', 'aso-oke-occasion-cap', 'Tailor', 'Traditional woven cap for celebrations and formal cultural occasions.', false),
    ('home-kitchen', 'Brew 4-Slice Toaster', 'brew-4-slice-toaster', 'Brew', 'Four-slice toaster with adjustable browning and removable crumb tray.', true),
    ('home-kitchen', 'BlendPro 2L Food Processor', 'blendpro-2l-food-processor', 'BlendPro', 'Multi-purpose food processor with a two-litre bowl and slicing attachments.', false),
    ('home-kitchen', 'Hearth 6L Pressure Cooker', 'hearth-6l-pressure-cooker', 'Hearth', 'Six-litre electric pressure cooker with multiple cooking presets.', false),
    ('home-kitchen', 'Hearth Stainless Steel Pot Set', 'hearth-stainless-steel-pot-set', 'Hearth', 'Three stainless steel cooking pots with fitted lids for everyday meals.', false),
    ('home-kitchen', 'Breeze 16-inch Standing Fan', 'breeze-16-inch-standing-fan', 'Breeze', 'Adjustable-height standing fan with three speed settings and oscillation.', false),
    ('home-kitchen', 'Hearth Rechargeable Table Lamp', 'hearth-rechargeable-table-lamp', 'Hearth', 'Rechargeable LED table lamp with touch dimming for study or bedside use.', false),
    ('home-kitchen', 'Hearth 5kg Digital Kitchen Scale', 'hearth-digital-kitchen-scale', 'Hearth', 'Digital kitchen scale with tare function and a five-kilogram capacity.', false),
    ('beauty', 'Glow Daily Sunscreen SPF 50', 'glow-daily-sunscreen-spf-50', 'Glow', 'Lightweight SPF 50 sunscreen for daily face and body protection.', true),
    ('beauty', 'Glow Gentle Facial Cleanser 200ml', 'glow-gentle-facial-cleanser-200ml', 'Glow', 'Gentle 200ml facial cleanser for a simple morning and evening routine.', false),
    ('beauty', 'Glow Shea Hair Butter 250g', 'glow-shea-hair-butter-250g', 'Glow', 'Moisturising hair butter for protective styles and textured hair.', false),
    ('beauty', 'Glow Aloe Vera Gel 300ml', 'glow-aloe-vera-gel-300ml', 'Glow', 'Multi-purpose aloe vera gel for a light, cooling skincare routine.', false),
    ('beauty', 'Glow Essential Makeup Brush Set', 'glow-makeup-brush-set', 'Glow', 'Seven-piece makeup brush set with a compact storage pouch.', false),
    ('groceries', 'Harvest Golden Sella Rice 5kg', 'harvest-golden-sella-rice-5kg', 'Harvest', 'Five-kilogram bag of parboiled golden sella rice for family meals.', true),
    ('groceries', 'Harvest Honey Beans 2kg', 'harvest-honey-beans-2kg', 'Harvest', 'Two-kilogram pack of cleaned honey beans for stews and moi moi.', false),
    ('groceries', 'GoldPalm Palm Oil 2L', 'goldpalm-palm-oil-2l', 'GoldPalm', 'Two-litre bottle of palm oil for soups, stews and traditional dishes.', false),
    ('groceries', 'Harvest Spaghetti 500g 5-Pack', 'harvest-spaghetti-500g-5-pack', 'Harvest', 'Five 500g packs of spaghetti for convenient pantry restocking.', false),
    ('groceries', 'Harvest Tomato Paste 400g 6-Pack', 'harvest-tomato-paste-400g-6-pack', 'Harvest', 'Six 400g tins of tomato paste for everyday home cooking.', false),
    ('groceries', 'Harvest Oats 1kg', 'harvest-oats-1kg', 'Harvest', 'One-kilogram pack of rolled oats for breakfast and home baking.', false),
    ('baby-kids', 'Little Steps Baby Lotion 400ml', 'little-steps-baby-lotion-400ml', 'Little Steps', 'Gentle 400ml baby lotion for daily moisturising after bath time.', true),
    ('baby-kids', 'Little Steps Training Pants Size 4', 'little-steps-training-pants-size-4', 'Little Steps', 'Pack of soft training pants in size 4 for active toddlers.', false),
    ('baby-kids', 'Little Steps Silicone Feeding Set', 'little-steps-silicone-feeding-set', 'Little Steps', 'Reusable silicone bowl, spoon and cup set for supervised mealtimes.', false),
    ('baby-kids', 'Little Steps Foldable Baby Bath', 'little-steps-foldable-baby-bath', 'Little Steps', 'Space-saving foldable baby bath with a non-slip base.', false),
    ('baby-kids', 'Little Steps Stacking Blocks', 'little-steps-stacking-blocks', 'Little Steps', 'Bright stacking blocks designed for supervised early play.', false),
    ('baby-kids', 'Little Steps Soft Changing Mat', 'little-steps-soft-changing-mat', 'Little Steps', 'Wipe-clean padded changing mat for home or travel use.', false)
  ) as v(category_slug, name, slug, brand, description, is_featured)
  join public.categories c on c.slug = v.category_slug
  on conflict (slug) do nothing
  returning id, slug
)
insert into public.product_variants
  (product_id, sku, name, options, price_kobo, compare_at_price_kobo, stock_quantity, is_active)
select np.id, v.sku, 'Default', '{}'::jsonb, v.price_kobo, null, v.stock, true
from new_products np
join (values
  ('nova-spark-128-smartphone', 'NOVA-SPARK-128', 21900000, 16),
  ('nova-max-256-smartphone', 'NOVA-MAX-256', 38900000, 9),
  ('nova-tab-mini-8-tablet', 'NOVA-TAB-MINI8', 14200000, 13),
  ('nova-usb-c-charger-33w', 'NOVA-USB-C-33W', 1850000, 55),
  ('nova-braided-usb-c-cable-2m', 'NOVA-CABLE-2M', 650000, 90),
  ('nova-dual-sim-4g-feature-phone', 'NOVA-FEATURE-4G', 4850000, 32),
  ('aria-business-14-laptop', 'ARIA-BUSINESS14', 56500000, 7),
  ('aria-chromebook-11', 'ARIA-CHROME11', 32500000, 11),
  ('aria-24-inch-fhd-monitor', 'ARIA-MONITOR24', 19800000, 8),
  ('aria-mechanical-keyboard', 'ARIA-MECH-KEY', 4750000, 24),
  ('aria-1tb-portable-ssd', 'ARIA-SSD-1TB', 14500000, 17),
  ('aria-wifi-6-router', 'ARIA-WIFI6-ROUTER', 11200000, 14),
  ('beam-32-hd-smart-tv', 'BEAM-TV32-HD', 21800000, 10),
  ('pulse-soundbar-subwoofer', 'PULSE-SOUNDBAR-SUB', 12800000, 12),
  ('pulse-true-wireless-earbuds', 'PULSE-TWS-EARBUDS', 2850000, 38),
  ('beam-hd-projector', 'BEAM-HD-PROJECTOR', 36500000, 5),
  ('pulse-10000mah-power-bank', 'PULSE-PBANK-10K', 2950000, 44),
  ('luma-smart-led-bulb-2-pack', 'LUMA-SMART-BULB-2', 2250000, 31),
  ('tailor-classic-polo-shirt', 'TAILOR-POLO-M', 2100000, 28),
  ('tailor-denim-jeans', 'TAILOR-DENIM-32', 3650000, 21),
  ('tailor-lightweight-rain-jacket', 'TAILOR-RAIN-JACKET', 4950000, 13),
  ('stride-leather-office-loafers', 'STRIDE-LOAFER-42', 6800000, 11),
  ('stride-kids-velcro-sneakers', 'STRIDE-KIDS-VELCRO-30', 3250000, 18),
  ('voyage-everyday-tote-bag', 'VOYAGE-TOTE-EVERYDAY', 2850000, 26),
  ('voyage-compact-wallet', 'VOYAGE-COMPACT-WALLET', 1650000, 37),
  ('aso-oke-occasion-cap', 'TAILOR-ASO-OKE-CAP', 2500000, 15),
  ('brew-4-slice-toaster', 'BREW-TOASTER-4SL', 6200000, 14),
  ('blendpro-2l-food-processor', 'BLENDPRO-FOODPROC-2L', 8950000, 9),
  ('hearth-6l-pressure-cooker', 'HEARTH-PRESSURE-6L', 12800000, 12),
  ('hearth-stainless-steel-pot-set', 'HEARTH-POT-SET-3', 7500000, 16),
  ('breeze-16-inch-standing-fan', 'BREEZE-STAND-FAN-16', 9850000, 19),
  ('hearth-rechargeable-table-lamp', 'HEARTH-RECHARGE-LAMP', 2650000, 22),
  ('hearth-digital-kitchen-scale', 'HEARTH-SCALE-5KG', 1950000, 33),
  ('glow-daily-sunscreen-spf-50', 'GLOW-SUNSCREEN-SPF50', 2200000, 48),
  ('glow-gentle-facial-cleanser-200ml', 'GLOW-CLEANSER-200', 1450000, 52),
  ('glow-shea-hair-butter-250g', 'GLOW-HAIR-BUTTER-250', 1350000, 41),
  ('glow-aloe-vera-gel-300ml', 'GLOW-ALOE-GEL-300', 1100000, 46),
  ('glow-makeup-brush-set', 'GLOW-BRUSH-SET-7', 2850000, 19),
  ('harvest-golden-sella-rice-5kg', 'HARVEST-SELLA-5KG', 895000, 64),
  ('harvest-honey-beans-2kg', 'HARVEST-HONEY-BEANS-2KG', 780000, 58),
  ('goldpalm-palm-oil-2l', 'GOLDPALM-PALM-OIL-2L', 1450000, 47),
  ('harvest-spaghetti-500g-5-pack', 'HARVEST-SPAGHETTI-5PK', 235000, 70),
  ('harvest-tomato-paste-400g-6-pack', 'HARVEST-TOMATO-PASTE-6PK', 450000, 55),
  ('harvest-oats-1kg', 'HARVEST-OATS-1KG', 950000, 43),
  ('little-steps-baby-lotion-400ml', 'LSTEPS-LOTION-400', 1850000, 39),
  ('little-steps-training-pants-size-4', 'LSTEPS-TRAINING-PANTS-S4', 6250000, 25),
  ('little-steps-silicone-feeding-set', 'LSTEPS-SILICONE-FEED', 2450000, 20),
  ('little-steps-foldable-baby-bath', 'LSTEPS-FOLDABLE-BATH', 6850000, 8),
  ('little-steps-stacking-blocks', 'LSTEPS-STACK-BLOCKS', 1950000, 23),
  ('little-steps-soft-changing-mat', 'LSTEPS-CHANGING-MAT', 3250000, 16)
) as v(product_slug, sku, price_kobo, stock) on v.product_slug = np.slug
on conflict (sku) do nothing;

+-- Additional 15 products in each of the 8 existing categories (120 total).
-- Re-running skips existing slugs and SKUs without modifying existing catalogue rows.
with catalog_rows(category_slug, name, slug, brand, description, is_featured, sku, price_kobo, stock_quantity) as (
  values
    ('phones-tablets', 'Nova A25 128GB Smartphone', 'nova-a25-128gb-smartphone', 'Nova', '6.6-inch display, 128GB storage and dual SIM support.', true, 'NOVA-A25-128GB-SMARTPHONE', 24500000, 18),
    ('phones-tablets', 'Nova A25 256GB Smartphone', 'nova-a25-256gb-smartphone', 'Nova', '256GB smartphone with a high-resolution main camera.', false, 'NOVA-A25-256GB-SMARTPHONE', 27900000, 13),
    ('phones-tablets', 'Nova Lite 64GB Smartphone', 'nova-lite-64gb-smartphone', 'Nova', 'Everyday 4G smartphone with 64GB storage and a large battery.', false, 'NOVA-LITE-64GB-SMARTPHONE', 15900000, 24),
    ('phones-tablets', 'Nova Note 12 Smartphone', 'nova-note-12-smartphone', 'Nova', 'Large-screen phone with 128GB storage for work and streaming.', false, 'NOVA-NOTE-12-SMARTPHONE', 22800000, 15),
    ('phones-tablets', 'Nova Foldable Phone Stand', 'nova-foldable-phone-stand', 'Nova', 'Adjustable aluminium stand for hands-free calls and viewing.', false, 'NOVA-FOLDABLE-PHONE-STAND', 1850000, 48),
    ('phones-tablets', 'Nova 20W USB-C Power Adapter', 'nova-20w-usb-c-power-adapter', 'Nova', 'Compact 20W USB-C adapter for compatible phones and tablets.', false, 'NOVA-20W-USB-C-POWER-ADAPTER', 2450000, 42),
    ('phones-tablets', 'Nova Tempered Glass Screen Guard', 'nova-tempered-glass-screen-guard', 'Nova', 'Clear scratch-resistant screen protector for compatible smartphones.', false, 'NOVA-TEMPERED-GLASS-SCREEN-GUARD', 650000, 80),
    ('phones-tablets', 'Nova Magnetic Phone Case', 'nova-magnetic-phone-case', 'Nova', 'Slim protective phone case with raised camera-edge protection.', false, 'NOVA-MAGNETIC-PHONE-CASE', 1250000, 55),
    ('phones-tablets', 'Nova 10-inch Tablet Keyboard Case', 'nova-10-inch-tablet-keyboard-case', 'Nova', 'Tablet folio case with detachable keyboard and adjustable stand.', false, 'NOVA-10-INCH-TABLET-KEYBOARD-CASE', 6850000, 19),
    ('phones-tablets', 'Nova Kids Tablet 8-inch', 'nova-kids-tablet-8-inch', 'Nova', 'Rugged-cased 8-inch tablet for supervised learning and entertainment.', false, 'NOVA-KIDS-TABLET-8-INCH', 16800000, 12),
    ('phones-tablets', 'Nova 20,000mAh Power Bank', 'nova-20000mah-power-bank', 'Nova', 'High-capacity power bank with USB-C input and dual-device charging.', false, 'NOVA-20000MAH-POWER-BANK', 5950000, 26),
    ('phones-tablets', 'Nova Wireless Charging Pad', 'nova-wireless-charging-pad', 'Nova', 'Qi-compatible wireless charging pad with non-slip surface.', false, 'NOVA-WIRELESS-CHARGING-PAD', 2850000, 32),
    ('phones-tablets', 'Nova Dual-Port Car Charger', 'nova-dual-port-car-charger', 'Nova', 'Compact car charger with USB-A and USB-C charging ports.', false, 'NOVA-DUAL-PORT-CAR-CHARGER', 1350000, 44),
    ('phones-tablets', 'Nova Bluetooth Selfie Stick', 'nova-bluetooth-selfie-stick', 'Nova', 'Extendable selfie stick with detachable Bluetooth shutter remote.', false, 'NOVA-BLUETOOTH-SELFIE-STICK', 2250000, 25),
    ('phones-tablets', 'Nova 4G Mobile Wi-Fi Hotspot', 'nova-4g-mobile-wi-fi-hotspot', 'Nova', 'Portable 4G hotspot with rechargeable battery and multi-device access.', false, 'NOVA-4G-MOBILE-WI-FI-HOTSPOT', 24500000, 9),
    ('computing', 'Aria 15-inch Business Laptop', 'aria-15-inch-business-laptop', 'Aria', '15.6-inch Full HD laptop with 8GB RAM and 512GB SSD.', true, 'ARIA-15-INCH-BUSINESS-LAPTOP', 57500000, 7),
    ('computing', 'Aria 13-inch Student Laptop', 'aria-13-inch-student-laptop', 'Aria', 'Lightweight 13-inch laptop with 8GB RAM for study and everyday tasks.', false, 'ARIA-13-INCH-STUDENT-LAPTOP', 42500000, 10),
    ('computing', 'Aria USB-C Docking Station', 'aria-usb-c-docking-station', 'Aria', 'Multiport USB-C dock with HDMI, USB and Ethernet connections.', false, 'ARIA-USB-C-DOCKING-STATION', 8950000, 16),
    ('computing', 'Aria 1080p Webcam', 'aria-1080p-webcam', 'Aria', 'Full HD webcam with built-in microphone for video meetings.', false, 'ARIA-1080P-WEBCAM', 4850000, 21),
    ('computing', 'Aria Laptop Cooling Stand', 'aria-laptop-cooling-stand', 'Aria', 'Adjustable laptop stand with quiet dual fans and USB power.', false, 'ARIA-LAPTOP-COOLING-STAND', 3950000, 24),
    ('computing', 'Aria 2TB External Hard Drive', 'aria-2tb-external-hard-drive', 'Aria', 'Portable 2TB external drive for backups and document storage.', false, 'ARIA-2TB-EXTERNAL-HARD-DRIVE', 14800000, 14),
    ('computing', 'Aria 256GB USB Flash Drive', 'aria-256gb-usb-flash-drive', 'Aria', 'Compact 256GB USB drive with a protective metal swivel cover.', false, 'ARIA-256GB-USB-FLASH-DRIVE', 3250000, 37),
    ('computing', 'Aria Wi-Fi USB Adapter', 'aria-wi-fi-usb-adapter', 'Aria', 'Dual-band USB adapter for adding wireless connectivity to a PC.', false, 'ARIA-WI-FI-USB-ADAPTER', 2450000, 28),
    ('computing', 'Aria 27-inch QHD Monitor', 'aria-27-inch-qhd-monitor', 'Aria', '27-inch QHD monitor with HDMI and DisplayPort inputs.', false, 'ARIA-27-INCH-QHD-MONITOR', 38500000, 5),
    ('computing', 'Aria Wireless Keyboard and Mouse', 'aria-wireless-keyboard-and-mouse', 'Aria', 'Quiet wireless keyboard and mouse set with a shared USB receiver.', false, 'ARIA-WIRELESS-KEYBOARD-AND-MOUSE', 4950000, 31),
    ('computing', 'Aria Laptop Sleeve 15-inch', 'aria-laptop-sleeve-15-inch', 'Aria', 'Padded 15-inch laptop sleeve with a front accessory pocket.', false, 'ARIA-LAPTOP-SLEEVE-15-INCH', 2350000, 34),
    ('computing', 'Aria Gigabit Network Switch 8-Port', 'aria-gigabit-network-switch-8-port', 'Aria', 'Eight-port Gigabit switch for wired home and small-office networks.', false, 'ARIA-GIGABIT-NETWORK-SWITCH-8-PORT', 7850000, 11),
    ('computing', 'Aria Inkjet Printer', 'aria-inkjet-printer', 'Aria', 'Compact all-in-one printer with scan and copy functions.', false, 'ARIA-INKJET-PRINTER', 29800000, 6),
    ('computing', 'Aria 1TB NVMe SSD', 'aria-1tb-nvme-ssd', 'Aria', '1TB NVMe solid-state drive for compatible laptop and desktop upgrades.', false, 'ARIA-1TB-NVME-SSD', 32500000, 8),
    ('computing', 'Aria Surge-Protected Extension 6-Way', 'aria-surge-protected-extension-6-way', 'Aria', 'Six-outlet extension strip with surge protection and a long cable.', false, 'ARIA-SURGE-PROTECTED-EXTENSION-6-WAY', 3450000, 29),
    ('electronics', 'Beam 50-inch 4K Smart TV', 'beam-50-inch-4k-smart-tv', 'Beam', '50-inch 4K television with streaming apps and multiple HDMI inputs.', true, 'BEAM-50-INCH-4K-SMART-TV', 68500000, 5),
    ('electronics', 'Beam 24-inch HD Television', 'beam-24-inch-hd-television', 'Beam', 'Compact 24-inch HD television for bedrooms and small spaces.', false, 'BEAM-24-INCH-HD-TELEVISION', 18500000, 8),
    ('electronics', 'Pulse 2.1 Channel Soundbar', 'pulse-21-channel-soundbar', 'Pulse', 'Bluetooth soundbar with wireless subwoofer and TV audio inputs.', false, 'PULSE-21-CHANNEL-SOUNDBAR', 16500000, 9),
    ('electronics', 'Pulse Over-Ear Gaming Headset', 'pulse-over-ear-gaming-headset', 'Pulse', 'Wired gaming headset with padded ear cups and a clear boom mic.', false, 'PULSE-OVER-EAR-GAMING-HEADSET', 5950000, 22),
    ('electronics', 'Pulse 30W Bluetooth Speaker', 'pulse-30w-bluetooth-speaker', 'Pulse', 'Portable 30W speaker with Bluetooth playback and rechargeable battery.', false, 'PULSE-30W-BLUETOOTH-SPEAKER', 7850000, 18),
    ('electronics', 'Luma Smart Plug 2-Pack', 'luma-smart-plug-2-pack', 'Luma', 'Two Wi-Fi smart plugs with app scheduling and voice-assistant support.', false, 'LUMA-SMART-PLUG-2-PACK', 3450000, 27),
    ('electronics', 'Luma Indoor Security Camera', 'luma-indoor-security-camera', 'Luma', 'Wi-Fi indoor camera with motion alerts and two-way audio.', false, 'LUMA-INDOOR-SECURITY-CAMERA', 8950000, 12),
    ('electronics', 'Luma Smart LED Strip 5m', 'luma-smart-led-strip-5m', 'Luma', 'Five-metre colour LED strip with app control and preset scenes.', false, 'LUMA-SMART-LED-STRIP-5M', 3950000, 20),
    ('electronics', 'Beam Android TV Streaming Stick', 'beam-android-tv-streaming-stick', 'Beam', 'HDMI streaming stick with voice remote for compatible televisions.', false, 'BEAM-ANDROID-TV-STREAMING-STICK', 9850000, 14),
    ('electronics', 'Pulse DAB/FM Rechargeable Radio', 'pulse-dabfm-rechargeable-radio', 'Pulse', 'Portable rechargeable radio with FM tuning and USB playback.', false, 'PULSE-DABFM-RECHARGEABLE-RADIO', 4850000, 16),
    ('electronics', 'Luma Video Doorbell', 'luma-video-doorbell', 'Luma', 'Wi-Fi doorbell camera with motion notifications and two-way talk.', false, 'LUMA-VIDEO-DOORBELL', 18500000, 7),
    ('electronics', 'Beam 1080p Home Projector', 'beam-1080p-home-projector', 'Beam', 'Full HD home projector with HDMI input and built-in speaker.', false, 'BEAM-1080P-HOME-PROJECTOR', 42500000, 4),
    ('electronics', 'Pulse USB Podcast Microphone', 'pulse-usb-podcast-microphone', 'Pulse', 'USB condenser microphone with desktop stand for calls and recording.', false, 'PULSE-USB-PODCAST-MICROPHONE', 6850000, 17),
    ('electronics', 'Luma Smart Wi-Fi Socket 4-Pack', 'luma-smart-wi-fi-socket-4-pack', 'Luma', 'Four app-controlled smart sockets with timers and energy scheduling.', false, 'LUMA-SMART-WI-FI-SOCKET-4-PACK', 5950000, 15),
    ('electronics', 'Beam Universal TV Wall Mount', 'beam-universal-tv-wall-mount', 'Beam', 'Tilting wall bracket for compatible flat-screen televisions.', false, 'BEAM-UNIVERSAL-TV-WALL-MOUNT', 3250000, 23),
    ('fashion', 'Tailor Linen Blend Shirt', 'tailor-linen-blend-shirt', 'Tailor', 'Breathable linen-blend button shirt for warm-weather dressing.', true, 'TAILOR-LINEN-BLEND-SHIRT', 3950000, 19),
    ('fashion', 'Tailor Chino Trousers', 'tailor-chino-trousers', 'Tailor', 'Straight-fit cotton-blend chinos with a comfortable everyday waistband.', false, 'TAILOR-CHINO-TROUSERS', 4250000, 22),
    ('fashion', 'Tailor Women''s Wrap Dress', 'tailor-womens-wrap-dress', 'Tailor', 'Lightweight wrap dress with an adjustable tie and relaxed fit.', false, 'TAILOR-WOMENS-WRAP-DRESS', 5850000, 14),
    ('fashion', 'Tailor Men''s Traditional Kaftan', 'tailor-mens-traditional-kaftan', 'Tailor', 'Two-piece traditional kaftan set with matching trousers.', false, 'TAILOR-MENS-TRADITIONAL-KAFTAN', 12800000, 8),
    ('fashion', 'Tailor Women''s Cotton Blouse', 'tailor-womens-cotton-blouse', 'Tailor', 'Soft cotton blouse with a versatile cut for work or weekends.', false, 'TAILOR-WOMENS-COTTON-BLOUSE', 3450000, 20),
    ('fashion', 'Tailor Denim Jacket', 'tailor-denim-jacket', 'Tailor', 'Classic denim jacket with button front and practical side pockets.', false, 'TAILOR-DENIM-JACKET', 7850000, 11),
    ('fashion', 'Tailor Cotton Chinos Shorts', 'tailor-cotton-chinos-shorts', 'Tailor', 'Casual cotton shorts with belt loops and two front pockets.', false, 'TAILOR-COTTON-CHINOS-SHORTS', 2850000, 18),
    ('fashion', 'Stride Women''s Walking Sandals', 'stride-womens-walking-sandals', 'Stride', 'Comfortable adjustable sandals with a cushioned footbed.', false, 'STRIDE-WOMENS-WALKING-SANDALS', 3950000, 16),
    ('fashion', 'Stride Men''s Leather Belt', 'stride-mens-leather-belt', 'Stride', 'Classic leather belt with metal buckle for everyday outfits.', false, 'STRIDE-MENS-LEATHER-BELT', 2450000, 25),
    ('fashion', 'Voyage Canvas Weekender Bag', 'voyage-canvas-weekender-bag', 'Voyage', 'Roomy canvas travel bag with shoulder strap and zipped compartments.', false, 'VOYAGE-CANVAS-WEEKENDER-BAG', 8950000, 10),
    ('fashion', 'Voyage RFID Card Holder', 'voyage-rfid-card-holder', 'Voyage', 'Slim card holder with multiple slots and RFID-blocking lining.', false, 'VOYAGE-RFID-CARD-HOLDER', 1850000, 32),
    ('fashion', 'Tailor Women''s Pleated Skirt', 'tailor-womens-pleated-skirt', 'Tailor', 'Midi-length pleated skirt with a comfortable elastic waistband.', false, 'TAILOR-WOMENS-PLEATED-SKIRT', 4250000, 13),
    ('fashion', 'Stride Unisex Slide Sandals', 'stride-unisex-slide-sandals', 'Stride', 'Lightweight everyday slides with a contoured footbed.', false, 'STRIDE-UNISEX-SLIDE-SANDALS', 2250000, 26),
    ('fashion', 'Tailor Printed Ankara Maxi Dress', 'tailor-printed-ankara-maxi-dress', 'Tailor', 'Full-length printed dress with a relaxed fit for occasions.', false, 'TAILOR-PRINTED-ANKARA-MAXI-DRESS', 8950000, 9),
    ('fashion', 'Voyage Crossbody Travel Pouch', 'voyage-crossbody-travel-pouch', 'Voyage', 'Compact travel pouch with adjustable strap and secure zip pockets.', false, 'VOYAGE-CROSSBODY-TRAVEL-POUCH', 3250000, 21),
    ('home-kitchen', 'Breeze 20L Standing Fan', 'breeze-20l-standing-fan', 'Breeze', '20-inch standing fan with multiple speeds and adjustable height.', true, 'BREEZE-20L-STANDING-FAN', 13800000, 13),
    ('home-kitchen', 'Brew 1.5L Rice Cooker', 'brew-15l-rice-cooker', 'Brew', '1.5-litre rice cooker with keep-warm mode and removable inner pot.', false, 'BREW-15L-RICE-COOKER', 6850000, 18),
    ('home-kitchen', 'BlendPro Hand Blender Set', 'blendpro-hand-blender-set', 'BlendPro', 'Hand blender with whisk and chopping attachments for meal prep.', false, 'BLENDPRO-HAND-BLENDER-SET', 7850000, 12),
    ('home-kitchen', 'Hearth 12-Piece Dinner Set', 'hearth-12-piece-dinner-set', 'Hearth', 'Durable 12-piece dinnerware set for everyday family meals.', false, 'HEARTH-12-PIECE-DINNER-SET', 5950000, 15),
    ('home-kitchen', 'Hearth 8L Air Fryer', 'hearth-8l-air-fryer', 'Hearth', 'Large-capacity air fryer with digital timer and adjustable temperature.', false, 'HEARTH-8L-AIR-FRYER', 22500000, 7),
    ('home-kitchen', 'Brew 2-Slice Sandwich Maker', 'brew-2-slice-sandwich-maker', 'Brew', 'Non-stick sandwich maker with indicator lights and cool-touch handle.', false, 'BREW-2-SLICE-SANDWICH-MAKER', 3850000, 22),
    ('home-kitchen', 'Hearth 1.7L Water Filter Jug', 'hearth-17l-water-filter-jug', 'Hearth', 'Filtered water jug with replaceable cartridge and 1.7-litre capacity.', false, 'HEARTH-17L-WATER-FILTER-JUG', 2450000, 28),
    ('home-kitchen', 'Breeze Rechargeable Desk Fan', 'breeze-rechargeable-desk-fan', 'Breeze', 'Portable rechargeable fan with three speeds for desk or bedside use.', false, 'BREEZE-RECHARGEABLE-DESK-FAN', 4950000, 19),
    ('home-kitchen', 'Hearth 5-Piece Storage Canister Set', 'hearth-5-piece-storage-canister-set', 'Hearth', 'Five lidded kitchen canisters for keeping dry ingredients organized.', false, 'HEARTH-5-PIECE-STORAGE-CANISTER-SET', 3250000, 24),
    ('home-kitchen', 'Brew 1.2L French Press', 'brew-12l-french-press', 'Brew', 'Glass and stainless-steel French press for freshly brewed coffee.', false, 'BREW-12L-FRENCH-PRESS', 1850000, 30),
    ('home-kitchen', 'Hearth Non-Slip Bath Mat Set', 'hearth-non-slip-bath-mat-set', 'Hearth', 'Two-piece quick-dry bath mat set with a non-slip backing.', false, 'HEARTH-NON-SLIP-BATH-MAT-SET', 2850000, 26),
    ('home-kitchen', 'Hearth Microfiber Bedsheet Set', 'hearth-microfiber-bedsheet-set', 'Hearth', 'Soft double-size bedsheet set with fitted sheet and pillowcases.', false, 'HEARTH-MICROFIBER-BEDSHEET-SET', 4950000, 17),
    ('home-kitchen', 'Breeze 16-inch Rechargeable Fan', 'breeze-16-inch-rechargeable-fan', 'Breeze', 'Rechargeable 16-inch fan with built-in battery and remote control.', false, 'BREEZE-16-INCH-RECHARGEABLE-FAN', 24800000, 6),
    ('home-kitchen', 'Hearth 3-Tier Dish Drying Rack', 'hearth-3-tier-dish-drying-rack', 'Hearth', 'Three-tier dish rack with drainboard and dedicated utensil holder.', false, 'HEARTH-3-TIER-DISH-DRYING-RACK', 4250000, 14),
    ('home-kitchen', 'Brew 12-Cup Coffee Maker', 'brew-12-cup-coffee-maker', 'Brew', 'Drip coffee maker with glass carafe and reusable filter basket.', false, 'BREW-12-CUP-COFFEE-MAKER', 8950000, 8),
    ('beauty', 'Glow Niacinamide Face Serum 30ml', 'glow-niacinamide-face-serum-30ml', 'Glow', 'Lightweight 30ml niacinamide serum for a simple daily skincare routine.', true, 'GLOW-NIACINAMIDE-FACE-SERUM-30ML', 1950000, 42),
    ('beauty', 'Glow Gentle Foaming Face Wash 150ml', 'glow-gentle-foaming-face-wash-150ml', 'Glow', '150ml foaming face wash for everyday cleansing.', false, 'GLOW-GENTLE-FOAMING-FACE-WASH-150ML', 1450000, 38),
    ('beauty', 'Glow Cocoa Body Lotion 500ml', 'glow-cocoa-body-lotion-500ml', 'Glow', '500ml daily body lotion with a rich cocoa butter feel.', false, 'GLOW-COCOA-BODY-LOTION-500ML', 1850000, 45),
    ('beauty', 'Glow Broad Spectrum Sunscreen SPF 30', 'glow-broad-spectrum-sunscreen-spf-30', 'Glow', 'Everyday SPF 30 sunscreen in a convenient travel-friendly tube.', false, 'GLOW-BROAD-SPECTRUM-SUNSCREEN-SPF-30', 1650000, 33),
    ('beauty', 'Glow Shea Lip Balm 3-Pack', 'glow-shea-lip-balm-3-pack', 'Glow', 'Three nourishing lip balms for daily pocket-sized care.', false, 'GLOW-SHEA-LIP-BALM-3-PACK', 950000, 51),
    ('beauty', 'Glow Leave-In Conditioner 250ml', 'glow-leave-in-conditioner-250ml', 'Glow', '250ml leave-in conditioner for easier detangling and styling.', false, 'GLOW-LEAVE-IN-CONDITIONER-250ML', 2250000, 27),
    ('beauty', 'Glow Satin Hair Bonnet', 'glow-satin-hair-bonnet', 'Glow', 'Soft adjustable satin bonnet for overnight hair protection.', false, 'GLOW-SATIN-HAIR-BONNET', 1250000, 35),
    ('beauty', 'Glow Rechargeable Facial Cleansing Brush', 'glow-rechargeable-facial-cleansing-brush', 'Glow', 'Rechargeable silicone facial cleansing brush with multiple vibration modes.', false, 'GLOW-RECHARGEABLE-FACIAL-CLEANSING-BRUSH', 4850000, 14),
    ('beauty', 'Glow Nail Care Kit', 'glow-nail-care-kit', 'Glow', 'Compact manicure and pedicure kit with stainless-steel grooming tools.', false, 'GLOW-NAIL-CARE-KIT', 1850000, 24),
    ('beauty', 'Glow Makeup Organizer', 'glow-makeup-organizer', 'Glow', 'Clear desktop organizer with drawers for cosmetics and accessories.', false, 'GLOW-MAKEUP-ORGANIZER', 3250000, 20),
    ('beauty', 'Glow Vitamin E Body Oil 200ml', 'glow-vitamin-e-body-oil-200ml', 'Glow', '200ml lightweight body oil for post-bath moisturising.', false, 'GLOW-VITAMIN-E-BODY-OIL-200ML', 1950000, 26),
    ('beauty', 'Glow Hydrating Sheet Mask 5-Pack', 'glow-hydrating-sheet-mask-5-pack', 'Glow', 'Five hydrating sheet masks for an at-home skincare routine.', false, 'GLOW-HYDRATING-SHEET-MASK-5-PACK', 1350000, 40),
    ('beauty', 'Glow Curl Defining Cream 300ml', 'glow-curl-defining-cream-300ml', 'Glow', '300ml styling cream for defining curls and reducing dryness.', false, 'GLOW-CURL-DEFINING-CREAM-300ML', 2450000, 23),
    ('beauty', 'Glow Travel Toiletry Bag', 'glow-travel-toiletry-bag', 'Glow', 'Water-resistant toiletry pouch with compartments for travel essentials.', false, 'GLOW-TRAVEL-TOILETRY-BAG', 2850000, 18),
    ('beauty', 'Glow Compact Hair Dryer', 'glow-compact-hair-dryer', 'Glow', 'Compact hair dryer with two heat settings and foldable handle.', false, 'GLOW-COMPACT-HAIR-DRYER', 8950000, 9),
    ('groceries', 'Harvest Parboiled Rice 25kg', 'harvest-parboiled-rice-25kg', 'Harvest', '25kg bag of parboiled long-grain rice for busy households.', true, 'HARVEST-PARBOILED-RICE-25KG', 4250000, 20),
    ('groceries', 'Harvest White Beans 5kg', 'harvest-white-beans-5kg', 'Harvest', 'Five-kilogram pack of cleaned white beans for soups and stews.', false, 'HARVEST-WHITE-BEANS-5KG', 1750000, 28),
    ('groceries', 'GoldPalm Vegetable Oil 5L', 'goldpalm-vegetable-oil-5l', 'GoldPalm', 'Five-litre bottle of refined vegetable cooking oil.', false, 'GOLDPALM-VEGETABLE-OIL-5L', 2850000, 24),
    ('groceries', 'Harvest Semolina 2kg 3-Pack', 'harvest-semolina-2kg-3-pack', 'Harvest', 'Three two-kilogram packs of semolina for convenient pantry stocking.', false, 'HARVEST-SEMOLINA-2KG-3-PACK', 2250000, 31),
    ('groceries', 'Harvest Instant Noodles 70g 10-Pack', 'harvest-instant-noodles-70g-10-pack', 'Harvest', 'Ten single-serving packs of quick-cooking instant noodles.', false, 'HARVEST-INSTANT-NOODLES-70G-10-PACK', 750000, 60),
    ('groceries', 'Harvest Tomato Ketchup 700g', 'harvest-tomato-ketchup-700g', 'Harvest', '700g bottle of tomato ketchup for meals and snacks.', false, 'HARVEST-TOMATO-KETCHUP-700G', 850000, 35),
    ('groceries', 'Harvest Breakfast Cornflakes 500g', 'harvest-breakfast-cornflakes-500g', 'Harvest', '500g box of crunchy cornflakes for breakfast.', false, 'HARVEST-BREAKFAST-CORNFLAKES-500G', 1250000, 29),
    ('groceries', 'Harvest Powdered Milk 900g', 'harvest-powdered-milk-900g', 'Harvest', '900g refill pouch of powdered milk for drinks and recipes.', false, 'HARVEST-POWDERED-MILK-900G', 3850000, 19),
    ('groceries', 'Harvest Ground Ginger 100g', 'harvest-ground-ginger-100g', 'Harvest', '100g pack of ground ginger for seasoning and baking.', false, 'HARVEST-GROUND-GINGER-100G', 350000, 44),
    ('groceries', 'Harvest Dried Crayfish 250g', 'harvest-dried-crayfish-250g', 'Harvest', '250g sealed pack of dried crayfish for soups and stews.', false, 'HARVEST-DRIED-CRAYFISH-250G', 1450000, 22),
    ('groceries', 'GoldPalm Coconut Oil 500ml', 'goldpalm-coconut-oil-500ml', 'GoldPalm', '500ml bottle of coconut oil for cooking and home use.', false, 'GOLDPALM-COCONUT-OIL-500ML', 1950000, 18),
    ('groceries', 'Harvest Mixed Peppers 500g', 'harvest-mixed-peppers-500g', 'Harvest', 'Frozen mixed peppers in a 500g pack for quick meal preparation.', false, 'HARVEST-MIXED-PEPPERS-500G', 950000, 25),
    ('groceries', 'Harvest Brown Sugar 1kg', 'harvest-brown-sugar-1kg', 'Harvest', 'One-kilogram pack of brown sugar for drinks and baking.', false, 'HARVEST-BROWN-SUGAR-1KG', 650000, 39),
    ('groceries', 'Harvest Black Tea 100 Bags', 'harvest-black-tea-100-bags', 'Harvest', 'Box of 100 black tea bags for home and office.', false, 'HARVEST-BLACK-TEA-100-BAGS', 1150000, 33),
    ('groceries', 'Harvest Peanut Butter 500g', 'harvest-peanut-butter-500g', 'Harvest', '500g jar of smooth peanut butter for snacks and breakfast.', false, 'HARVEST-PEANUT-BUTTER-500G', 1850000, 21),
    ('baby-kids', 'Little Steps Baby Shampoo 400ml', 'little-steps-baby-shampoo-400ml', 'Little Steps', 'Gentle 400ml baby shampoo for everyday bath time.', true, 'LITTLE-STEPS-BABY-SHAMPOO-400ML', 1650000, 34),
    ('baby-kids', 'Little Steps Cotton Buds 200-Pack', 'little-steps-cotton-buds-200-pack', 'Little Steps', 'Pack of 200 cotton buds for general baby-care routines.', false, 'LITTLE-STEPS-COTTON-BUDS-200-PACK', 650000, 45),
    ('baby-kids', 'Little Steps Reusable Swim Nappy', 'little-steps-reusable-swim-nappy', 'Little Steps', 'Reusable adjustable swim nappy for supervised water play.', false, 'LITTLE-STEPS-REUSABLE-SWIM-NAPPY', 2850000, 17),
    ('baby-kids', 'Little Steps Baby Carrier', 'little-steps-baby-carrier', 'Little Steps', 'Adjustable soft baby carrier with supportive padded straps.', false, 'LITTLE-STEPS-BABY-CARRIER', 12800000, 7),
    ('baby-kids', 'Little Steps Hooded Baby Towel', 'little-steps-hooded-baby-towel', 'Little Steps', 'Soft hooded towel for wrapping little ones after bath time.', false, 'LITTLE-STEPS-HOODED-BABY-TOWEL', 2450000, 23),
    ('baby-kids', 'Little Steps Crib Fitted Sheet', 'little-steps-crib-fitted-sheet', 'Little Steps', 'Soft fitted crib sheet with elastic edges for a snug mattress fit.', false, 'LITTLE-STEPS-CRIB-FITTED-SHEET', 2250000, 19),
    ('baby-kids', 'Little Steps Rattle and Teether Set', 'little-steps-rattle-and-teether-set', 'Little Steps', 'Easy-grip rattle and teether set for supervised infant play.', false, 'LITTLE-STEPS-RATTLE-AND-TEETHER-SET', 1850000, 26),
    ('baby-kids', 'Little Steps Wooden Shape Sorter', 'little-steps-wooden-shape-sorter', 'Little Steps', 'Wooden shape sorter for supervised early learning and play.', false, 'LITTLE-STEPS-WOODEN-SHAPE-SORTER', 3850000, 12),
    ('baby-kids', 'Little Steps Kids Lunch Box', 'little-steps-kids-lunch-box', 'Little Steps', 'Divided lunch box with secure clips for school-day meals.', false, 'LITTLE-STEPS-KIDS-LUNCH-BOX', 2250000, 21),
    ('baby-kids', 'Little Steps Insulated Sippy Cup', 'little-steps-insulated-sippy-cup', 'Little Steps', 'Spill-resistant insulated cup with handles for supervised use.', false, 'LITTLE-STEPS-INSULATED-SIPPY-CUP', 1950000, 24),
    ('baby-kids', 'Little Steps Toddler Backpack', 'little-steps-toddler-backpack', 'Little Steps', 'Lightweight toddler backpack with adjustable shoulder straps.', false, 'LITTLE-STEPS-TODDLER-BACKPACK', 3250000, 16),
    ('baby-kids', 'Little Steps Baby Monitor', 'little-steps-baby-monitor', 'Little Steps', 'Audio baby monitor with rechargeable parent unit and two-way talk.', false, 'LITTLE-STEPS-BABY-MONITOR', 14800000, 6),
    ('baby-kids', 'Little Steps High Chair', 'little-steps-high-chair', 'Little Steps', 'Adjustable high chair with removable tray and wipe-clean seat.', false, 'LITTLE-STEPS-HIGH-CHAIR', 24500000, 5),
    ('baby-kids', 'Little Steps Building Blocks 60-Piece Set', 'little-steps-building-blocks-60-piece-set', 'Little Steps', 'Colourful 60-piece building block set for supervised creative play.', false, 'LITTLE-STEPS-BUILDING-BLOCKS-60-PIECE-SET', 4250000, 14),
    ('baby-kids', 'Little Steps Soft Play Mat', 'little-steps-soft-play-mat', 'Little Steps', 'Foldable padded play mat for supervised floor play at home.', false, 'LITTLE-STEPS-SOFT-PLAY-MAT', 6850000, 9)
),
new_products as (
  insert into public.products
    (category_id, name, slug, brand, description, is_active, is_featured, units_sold)
  select c.id, r.name, r.slug, r.brand, r.description, true, r.is_featured, 0
  from catalog_rows r
  join public.categories c on c.slug = r.category_slug
  on conflict (slug) do nothing
  returning id, slug
)
insert into public.product_variants
  (product_id, sku, name, options, price_kobo, compare_at_price_kobo, stock_quantity, is_active)
select p.id, r.sku, 'Default', '{}'::jsonb, r.price_kobo, null, r.stock_quantity, true
from catalog_rows r
join new_products p on p.slug = r.slug
on conflict (sku) do nothing;

-- Image files are local WebP assets mapped in download-product-images.mjs and uploaded
-- by upload-product-images.mjs. The uploader creates/updates each product's primary
-- product_images row using the public Storage URL; seed.sql never stores hotlinked URLs.

commit;
