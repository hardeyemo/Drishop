-- Bring the requested ten storefront categories up to 15 active products each.
-- Uses existing category slugs where available, adds only the three missing categories,
-- counts active catalogue rows at execution time, and inserts only each category's deficit.
-- Safe to rerun. This script does not touch orders, customers, payments, or existing products.
-- Product images are not fabricated; listings use the storefront's existing image fallback
-- until matching authorized files are uploaded to the product-images bucket.
begin;

insert into public.categories (name, slug, description, sort_order, is_active) values
  ('Sports & Fitness', 'sports-fitness', 'Sports equipment, fitness training and active living.', 9, true),
  ('Books & Stationery', 'books-stationery', 'Books, learning resources and stationery.', 10, true),
  ('Food & Drinks', 'food-drinks', 'Packaged foods and non-alcoholic drinks.', 11, true)
on conflict (slug) do nothing;

with candidates(category_slug, name, slug, brand, description, is_featured, sku, price_kobo, stock_quantity) as (
  values
    ('electronics', 'Beam 40-inch Full HD Smart TV', 'beam-40-inch-full-hd-smart-tv', 'Beam', '40-inch Full HD smart TV with streaming apps and HDMI inputs.', true, 'BEAM-40-INCH-FULL-HD-SMART-TV', 42500000, 6),
    ('electronics', 'Beam 55-inch 4K QLED TV', 'beam-55-inch-4k-qled-tv', 'Beam', '55-inch 4K QLED television with built-in streaming and voice control.', false, 'BEAM-55-INCH-4K-QLED-TV', 98500000, 4),
    ('electronics', 'Pulse 5.1 Home Theatre System', 'pulse-51-home-theatre-system', 'Pulse', '5.1-channel home theatre speaker system with Bluetooth connectivity.', false, 'PULSE-51-HOME-THEATRE-SYSTEM', 32500000, 5),
    ('electronics', 'Pulse Wireless Neckband Earphones', 'pulse-wireless-neckband-earphones', 'Pulse', 'Lightweight wireless neckband earphones with microphone and controls.', false, 'PULSE-WIRELESS-NECKBAND-EARPHONES', 3950000, 24),
    ('electronics', 'Pulse Studio Monitor Speakers Pair', 'pulse-studio-monitor-speakers-pair', 'Pulse', 'Pair of powered desktop speakers for music, calls and creative work.', false, 'PULSE-STUDIO-MONITOR-SPEAKERS-PAIR', 18500000, 7),
    ('electronics', 'Luma Smart LED Bulb 4-Pack', 'luma-smart-led-bulb-4-pack', 'Luma', 'Four dimmable Wi-Fi bulbs with app scheduling and warm-to-cool light.', false, 'LUMA-SMART-LED-BULB-4-PACK', 4850000, 22),
    ('electronics', 'Luma Outdoor Security Camera', 'luma-outdoor-security-camera', 'Luma', 'Weather-resistant Wi-Fi camera with motion alerts and night vision.', false, 'LUMA-OUTDOOR-SECURITY-CAMERA', 14800000, 8),
    ('electronics', 'Luma Smart Door Sensor 2-Pack', 'luma-smart-door-sensor-2-pack', 'Luma', 'Two contact sensors for app alerts when doors or windows are opened.', false, 'LUMA-SMART-DOOR-SENSOR-2-PACK', 3950000, 19),
    ('electronics', 'Beam Streaming TV Box', 'beam-streaming-tv-box', 'Beam', 'Compact 4K streaming box with voice remote and HDMI connection.', false, 'BEAM-STREAMING-TV-BOX', 12500000, 11),
    ('electronics', 'Pulse Portable AM/FM Radio', 'pulse-portable-amfm-radio', 'Pulse', 'Rechargeable portable radio with FM tuning and USB playback.', false, 'PULSE-PORTABLE-AMFM-RADIO', 3250000, 17),
    ('electronics', 'Pulse Karaoke Microphone Speaker', 'pulse-karaoke-microphone-speaker', 'Pulse', 'Portable karaoke speaker with wireless microphone and Bluetooth audio.', false, 'PULSE-KARAOKE-MICROPHONE-SPEAKER', 8950000, 10),
    ('electronics', 'Luma Smart Plug 4-Pack', 'luma-smart-plug-4-pack', 'Luma', 'Four Wi-Fi smart plugs with timers and app-based power control.', false, 'LUMA-SMART-PLUG-4-PACK', 6250000, 14),
    ('electronics', 'Beam Universal TV Wall Bracket', 'beam-universal-tv-wall-bracket', 'Beam', 'Tilting wall bracket for compatible flat-screen televisions.', false, 'BEAM-UNIVERSAL-TV-WALL-BRACKET', 2850000, 26),
    ('electronics', 'Pulse USB Podcast Microphone Kit', 'pulse-usb-podcast-microphone-kit', 'Pulse', 'USB condenser microphone with desktop stand and pop filter.', false, 'PULSE-USB-PODCAST-MICROPHONE-KIT', 7850000, 13),
    ('electronics', 'Luma Smart Wi-Fi Thermostat', 'luma-smart-wi-fi-thermostat', 'Luma', 'App-connected thermostat with programmable weekly temperature schedules.', false, 'LUMA-SMART-WI-FI-THERMOSTAT', 22500000, 5),
    ('fashion', 'Tailor Oxford Button-Down Shirt', 'tailor-oxford-button-down-shirt', 'Tailor', 'Cotton-blend Oxford shirt with a classic collar and button cuffs.', true, 'TAILOR-OXFORD-BUTTON-DOWN-SHIRT', 4250000, 16),
    ('fashion', 'Tailor Women''s Everyday Trousers', 'tailor-womens-everyday-trousers', 'Tailor', 'Straight-leg trousers with a comfortable mid-rise fit for daily wear.', false, 'TAILOR-WOMENS-EVERYDAY-TROUSERS', 4850000, 18),
    ('fashion', 'Tailor Men''s Chino Shorts', 'tailor-mens-chino-shorts', 'Tailor', 'Cotton chino shorts with belt loops and practical side pockets.', false, 'TAILOR-MENS-CHINO-SHORTS', 3250000, 20),
    ('fashion', 'Tailor Women''s Knit Cardigan', 'tailor-womens-knit-cardigan', 'Tailor', 'Lightweight open-front cardigan for layering at work or home.', false, 'TAILOR-WOMENS-KNIT-CARDIGAN', 5850000, 11),
    ('fashion', 'Tailor Men''s Traditional Agbada Set', 'tailor-mens-traditional-agbada-set', 'Tailor', 'Three-piece traditional outfit with flowing robe, top and trousers.', false, 'TAILOR-MENS-TRADITIONAL-AGBADA-SET', 24500000, 5),
    ('fashion', 'Tailor Ankara Midi Skirt', 'tailor-ankara-midi-skirt', 'Tailor', 'Printed Ankara midi skirt with a comfortable fitted waistband.', false, 'TAILOR-ANKARA-MIDI-SKIRT', 4650000, 13),
    ('fashion', 'Stride Women''s Running Shoes', 'stride-womens-running-shoes', 'Stride', 'Lightweight lace-up running shoes with cushioned support.', false, 'STRIDE-WOMENS-RUNNING-SHOES', 7850000, 12),
    ('fashion', 'Stride Men''s Leather Sandals', 'stride-mens-leather-sandals', 'Stride', 'Adjustable leather sandals with a flexible everyday sole.', false, 'STRIDE-MENS-LEATHER-SANDALS', 6250000, 10),
    ('fashion', 'Stride Unisex Canvas Sneakers', 'stride-unisex-canvas-sneakers', 'Stride', 'Low-top canvas sneakers with padded lining and rubber sole.', false, 'STRIDE-UNISEX-CANVAS-SNEAKERS', 3850000, 22),
    ('fashion', 'Voyage Leather Crossbody Bag', 'voyage-leather-crossbody-bag', 'Voyage', 'Compact crossbody bag with adjustable strap and zipped compartments.', false, 'VOYAGE-LEATHER-CROSSBODY-BAG', 8950000, 9),
    ('fashion', 'Voyage Work Tote Bag', 'voyage-work-tote-bag', 'Voyage', 'Structured work tote with a padded device sleeve and inner pockets.', false, 'VOYAGE-WORK-TOTE-BAG', 9850000, 8),
    ('fashion', 'Voyage Travel Passport Wallet', 'voyage-travel-passport-wallet', 'Voyage', 'Travel wallet with passport sleeve, card slots and secure zip pocket.', false, 'VOYAGE-TRAVEL-PASSPORT-WALLET', 2850000, 19),
    ('fashion', 'Tailor Women''s Casual Jumpsuit', 'tailor-womens-casual-jumpsuit', 'Tailor', 'Relaxed one-piece jumpsuit with side pockets and adjustable waist tie.', false, 'TAILOR-WOMENS-CASUAL-JUMPSUIT', 6850000, 10),
    ('fashion', 'Tailor Men''s Lightweight Kaftan', 'tailor-mens-lightweight-kaftan', 'Tailor', 'Breathable two-piece kaftan outfit for warm days and occasions.', false, 'TAILOR-MENS-LIGHTWEIGHT-KAFTAN', 11800000, 7),
    ('fashion', 'Stride Men''s Office Derby Shoes', 'stride-mens-office-derby-shoes', 'Stride', 'Lace-up office shoes with cushioned insoles and a polished finish.', false, 'STRIDE-MENS-OFFICE-DERBY-SHOES', 9850000, 8),
    ('home-kitchen', 'Breeze 18-inch Rechargeable Standing Fan', 'breeze-18-inch-rechargeable-standing-fan', 'Breeze', 'Rechargeable 18-inch fan with remote control and adjustable height.', true, 'BREEZE-18-INCH-RECHARGEABLE-STANDING-FAN', 28500000, 6),
    ('home-kitchen', 'Brew 6L Electric Pressure Cooker', 'brew-6l-electric-pressure-cooker', 'Brew', 'Six-litre pressure cooker with programmable modes and keep-warm setting.', false, 'BREW-6L-ELECTRIC-PRESSURE-COOKER', 19800000, 8),
    ('home-kitchen', 'BlendPro 1.8L Glass Blender', 'blendpro-18l-glass-blender', 'BlendPro', 'Countertop blender with glass jug and multiple speed settings.', false, 'BLENDPRO-18L-GLASS-BLENDER', 8950000, 12),
    ('home-kitchen', 'Hearth 4-Burner Tabletop Gas Cooker', 'hearth-4-burner-tabletop-gas-cooker', 'Hearth', 'Four-burner tabletop gas cooker with durable enamel supports.', false, 'HEARTH-4-BURNER-TABLETOP-GAS-COOKER', 22500000, 7),
    ('home-kitchen', 'Hearth 16-Piece Dinnerware Set', 'hearth-16-piece-dinnerware-set', 'Hearth', 'Sixteen-piece dinner set for everyday family meals and hosting.', false, 'HEARTH-16-PIECE-DINNERWARE-SET', 9850000, 10),
    ('home-kitchen', 'Brew 1.8L Air Fryer', 'brew-18l-air-fryer', 'Brew', 'Compact air fryer with adjustable temperature and digital timer.', false, 'BREW-18L-AIR-FRYER', 18500000, 8),
    ('home-kitchen', 'Hearth 2-Tier Dish Drainer', 'hearth-2-tier-dish-drainer', 'Hearth', 'Two-tier dish rack with removable drainboard and utensil holder.', false, 'HEARTH-2-TIER-DISH-DRAINER', 3950000, 20),
    ('home-kitchen', 'Hearth Queen Comforter Set', 'hearth-queen-comforter-set', 'Hearth', 'Queen-size comforter set with matching pillow covers.', false, 'HEARTH-QUEEN-COMFORTER-SET', 12800000, 9),
    ('home-kitchen', 'Breeze Wall-Mounted Fan 18-inch', 'breeze-wall-mounted-fan-18-inch', 'Breeze', 'Wall-mounted fan with oscillation, pull-cord controls and three speeds.', false, 'BREEZE-WALL-MOUNTED-FAN-18-INCH', 14500000, 11),
    ('home-kitchen', 'Brew 1.5L Slow Cooker', 'brew-15l-slow-cooker', 'Brew', 'Slow cooker with ceramic pot and three heat settings.', false, 'BREW-15L-SLOW-COOKER', 9850000, 10),
    ('home-kitchen', 'Hearth 10-Piece Food Storage Set', 'hearth-10-piece-food-storage-set', 'Hearth', 'Reusable food containers with fitted lids for pantry and leftovers.', false, 'HEARTH-10-PIECE-FOOD-STORAGE-SET', 3250000, 25),
    ('home-kitchen', 'Hearth Stainless Steel Flask 1L', 'hearth-stainless-steel-flask-1l', 'Hearth', 'One-litre insulated flask for keeping drinks hot or cold.', false, 'HEARTH-STAINLESS-STEEL-FLASK-1L', 2850000, 24),
    ('home-kitchen', 'Hearth Non-Slip Kitchen Mat Set', 'hearth-non-slip-kitchen-mat-set', 'Hearth', 'Two cushioned kitchen mats with easy-clean surfaces.', false, 'HEARTH-NON-SLIP-KITCHEN-MAT-SET', 4250000, 15),
    ('home-kitchen', 'Brew 1.7L Glass Electric Kettle', 'brew-17l-glass-electric-kettle', 'Brew', 'Glass electric kettle with automatic shut-off and removable filter.', false, 'BREW-17L-GLASS-ELECTRIC-KETTLE', 4850000, 18),
    ('home-kitchen', 'Hearth Foldable Laundry Basket', 'hearth-foldable-laundry-basket', 'Hearth', 'Space-saving foldable laundry basket with sturdy carry handles.', false, 'HEARTH-FOLDABLE-LAUNDRY-BASKET', 2450000, 22),
    ('phones-tablets', 'Nova A35 128GB Smartphone', 'nova-a35-128gb-smartphone', 'Nova', '6.6-inch smartphone with 128GB storage, dual SIM and fast charging.', true, 'NOVA-A35-128GB-SMARTPHONE', 28500000, 14),
    ('phones-tablets', 'Nova A35 256GB Smartphone', 'nova-a35-256gb-smartphone', 'Nova', 'Large-screen smartphone with 256GB storage and a high-resolution camera.', false, 'NOVA-A35-256GB-SMARTPHONE', 32500000, 10),
    ('phones-tablets', 'Nova Mini 4G Smartphone', 'nova-mini-4g-smartphone', 'Nova', 'Compact 4G smartphone with dual SIM and long-lasting battery.', false, 'NOVA-MINI-4G-SMARTPHONE', 18500000, 16),
    ('phones-tablets', 'Nova 10-inch Android Tablet', 'nova-10-inch-android-tablet', 'Nova', '10-inch tablet with 64GB storage for reading, video and browsing.', false, 'NOVA-10-INCH-ANDROID-TABLET', 17800000, 12),
    ('phones-tablets', 'Nova 12-inch Tablet Folio Case', 'nova-12-inch-tablet-folio-case', 'Nova', 'Protective folio case with adjustable stand for compatible 12-inch tablets.', false, 'NOVA-12-INCH-TABLET-FOLIO-CASE', 3250000, 22),
    ('phones-tablets', 'Nova 25W USB-C Fast Charger', 'nova-25w-usb-c-fast-charger', 'Nova', '25W USB-C wall charger with thermal and over-current protection.', false, 'NOVA-25W-USB-C-FAST-CHARGER', 2650000, 31),
    ('phones-tablets', 'Nova Braided USB-C Cable 1m', 'nova-braided-usb-c-cable-1m', 'Nova', 'One-metre braided USB-C cable for charging and data transfer.', false, 'NOVA-BRAIDED-USB-C-CABLE-1M', 850000, 45),
    ('phones-tablets', 'Nova Wireless MagSafe-Style Charger', 'nova-wireless-magsafe-style-charger', 'Nova', 'Magnetic wireless charging stand for compatible smartphones.', false, 'NOVA-WIRELESS-MAGSAFE-STYLE-CHARGER', 4850000, 17),
    ('phones-tablets', 'Nova 15,000mAh Power Bank', 'nova-15000mah-power-bank', 'Nova', 'Portable power bank with USB-C input and two device outputs.', false, 'NOVA-15000MAH-POWER-BANK', 4850000, 25),
    ('phones-tablets', 'Nova Universal Tablet Stylus', 'nova-universal-tablet-stylus', 'Nova', 'Rechargeable stylus for note-taking and drawing on compatible tablets.', false, 'NOVA-UNIVERSAL-TABLET-STYLUS', 3950000, 18),
    ('phones-tablets', 'Nova Shockproof Phone Case', 'nova-shockproof-phone-case', 'Nova', 'Shock-absorbing phone case with raised edges and tactile buttons.', false, 'NOVA-SHOCKPROOF-PHONE-CASE', 1450000, 36),
    ('phones-tablets', 'Nova Privacy Screen Protector', 'nova-privacy-screen-protector', 'Nova', 'Privacy filter screen protector for compatible smartphone models.', false, 'NOVA-PRIVACY-SCREEN-PROTECTOR', 1250000, 33),
    ('phones-tablets', 'Nova Bluetooth Car Kit', 'nova-bluetooth-car-kit', 'Nova', 'Hands-free Bluetooth car adapter with call controls and USB charging.', false, 'NOVA-BLUETOOTH-CAR-KIT', 2950000, 21),
    ('phones-tablets', 'Nova USB-C to HDMI Adapter', 'nova-usb-c-to-hdmi-adapter', 'Nova', 'Compact USB-C adapter for connecting compatible devices to HDMI displays.', false, 'NOVA-USB-C-TO-HDMI-ADAPTER', 2850000, 23),
    ('phones-tablets', 'Nova 4G Pocket Wi-Fi Router', 'nova-4g-pocket-wi-fi-router', 'Nova', 'Portable 4G Wi-Fi hotspot with rechargeable battery and SIM support.', false, 'NOVA-4G-POCKET-WI-FI-ROUTER', 19800000, 8),
    ('beauty', 'Glow Hyaluronic Acid Serum 30ml', 'glow-hyaluronic-acid-serum-30ml', 'Glow', '30ml hydrating serum with hyaluronic acid for a simple skincare routine.', true, 'GLOW-HYALURONIC-ACID-SERUM-30ML', 2250000, 32),
    ('beauty', 'Glow Daily Face Moisturiser 100ml', 'glow-daily-face-moisturiser-100ml', 'Glow', 'Lightweight 100ml face moisturiser for everyday use.', false, 'GLOW-DAILY-FACE-MOISTURISER-100ML', 1850000, 35),
    ('beauty', 'Glow SPF 50 Face Sunscreen 50ml', 'glow-spf-50-face-sunscreen-50ml', 'Glow', '50ml broad-spectrum sunscreen for daily face protection.', false, 'GLOW-SPF-50-FACE-SUNSCREEN-50ML', 2450000, 28),
    ('beauty', 'Glow Clarifying Toner 200ml', 'glow-clarifying-toner-200ml', 'Glow', '200ml gentle toner for a balanced daily skincare routine.', false, 'GLOW-CLARIFYING-TONER-200ML', 1650000, 30),
    ('beauty', 'Glow Shea Hand Cream 75ml', 'glow-shea-hand-cream-75ml', 'Glow', '75ml hand cream with shea butter for daily moisturising.', false, 'GLOW-SHEA-HAND-CREAM-75ML', 950000, 41),
    ('beauty', 'Glow Curl Care Shampoo 400ml', 'glow-curl-care-shampoo-400ml', 'Glow', '400ml shampoo formulated for textured and curly hair routines.', false, 'GLOW-CURL-CARE-SHAMPOO-400ML', 2250000, 25),
    ('beauty', 'Glow Deep Conditioner 500ml', 'glow-deep-conditioner-500ml', 'Glow', '500ml conditioning treatment for softer, easier-to-manage hair.', false, 'GLOW-DEEP-CONDITIONER-500ML', 2850000, 21),
    ('beauty', 'Glow Satin Hair Scrunchies 6-Pack', 'glow-satin-hair-scrunchies-6-pack', 'Glow', 'Six soft satin scrunchies designed for comfortable everyday styling.', false, 'GLOW-SATIN-HAIR-SCRUNCHIES-6-PACK', 850000, 38),
    ('beauty', 'Glow Rechargeable Hair Trimmer', 'glow-rechargeable-hair-trimmer', 'Glow', 'Cordless hair trimmer with adjustable guards and USB charging.', false, 'GLOW-RECHARGEABLE-HAIR-TRIMMER', 6850000, 12),
    ('beauty', 'Glow Makeup Brush Set 12-Piece', 'glow-makeup-brush-set-12-piece', 'Glow', 'Twelve-piece brush set with a zip pouch for everyday makeup.', false, 'GLOW-MAKEUP-BRUSH-SET-12-PIECE', 3450000, 18),
    ('beauty', 'Glow Facial Cleansing Headband Set', 'glow-facial-cleansing-headband-set', 'Glow', 'Soft headband and wristband set to keep hair dry during face care.', false, 'GLOW-FACIAL-CLEANSING-HEADBAND-SET', 950000, 29),
    ('beauty', 'Glow Aloe Body Gel 250ml', 'glow-aloe-body-gel-250ml', 'Glow', '250ml lightweight aloe gel for a cooling-feel skincare routine.', false, 'GLOW-ALOE-BODY-GEL-250ML', 1450000, 27),
    ('beauty', 'Glow Vitamin E Body Oil 150ml', 'glow-vitamin-e-body-oil-150ml', 'Glow', '150ml body oil for daily after-bath moisturising.', false, 'GLOW-VITAMIN-E-BODY-OIL-150ML', 1850000, 24),
    ('beauty', 'Glow Gentle Micellar Water 400ml', 'glow-gentle-micellar-water-400ml', 'Glow', '400ml micellar water for removing everyday makeup and impurities.', false, 'GLOW-GENTLE-MICELLAR-WATER-400ML', 1950000, 26),
    ('beauty', 'Glow Compact Makeup Mirror', 'glow-compact-makeup-mirror', 'Glow', 'Portable double-sided mirror with LED lighting and rechargeable battery.', false, 'GLOW-COMPACT-MAKEUP-MIRROR', 4850000, 11),
    ('groceries', 'Harvest Long-Grain Rice 10kg', 'harvest-long-grain-rice-10kg', 'Harvest', '10kg bag of parboiled long-grain rice for family meals.', true, 'HARVEST-LONG-GRAIN-RICE-10KG', 1850000, 36),
    ('groceries', 'Harvest Brown Beans 3kg', 'harvest-brown-beans-3kg', 'Harvest', 'Three-kilogram pack of cleaned brown beans for home cooking.', false, 'HARVEST-BROWN-BEANS-3KG', 1180000, 31),
    ('groceries', 'GoldPalm Pure Groundnut Oil 3L', 'goldpalm-pure-groundnut-oil-3l', 'GoldPalm', 'Three-litre bottle of groundnut oil for everyday cooking.', false, 'GOLDPALM-PURE-GROUNDNUT-OIL-3L', 1980000, 27),
    ('groceries', 'Harvest Garri 5kg', 'harvest-garri-5kg', 'Harvest', 'Five-kilogram pack of cassava garri for household pantry use.', false, 'HARVEST-GARRI-5KG', 950000, 39),
    ('groceries', 'Harvest Semovita 2kg', 'harvest-semovita-2kg', 'Harvest', 'Two-kilogram pack of semolina flour for soups and swallows.', false, 'HARVEST-SEMOVITA-2KG', 680000, 35),
    ('groceries', 'Harvest Spaghetti 500g 10-Pack', 'harvest-spaghetti-500g-10-pack', 'Harvest', 'Ten 500g packs of spaghetti for family meals and pantry stocking.', false, 'HARVEST-SPAGHETTI-500G-10-PACK', 485000, 42),
    ('groceries', 'Harvest Rolled Oats 1.5kg', 'harvest-rolled-oats-15kg', 'Harvest', 'One-and-a-half-kilogram pack of oats for breakfast and baking.', false, 'HARVEST-ROLLED-OATS-15KG', 1450000, 26),
    ('groceries', 'Harvest Evaporated Milk 170g 6-Pack', 'harvest-evaporated-milk-170g-6-pack', 'Harvest', 'Six 170g tins of evaporated milk for drinks and recipes.', false, 'HARVEST-EVAPORATED-MILK-170G-6-PACK', 750000, 33),
    ('groceries', 'Harvest Tomato Paste 210g 12-Pack', 'harvest-tomato-paste-210g-12-pack', 'Harvest', 'Twelve 210g sachets of tomato paste for everyday cooking.', false, 'HARVEST-TOMATO-PASTE-210G-12-PACK', 680000, 37),
    ('groceries', 'Harvest Sardines 125g 6-Pack', 'harvest-sardines-125g-6-pack', 'Harvest', 'Six tins of sardines for quick meals and pantry stocking.', false, 'HARVEST-SARDINES-125G-6-PACK', 2250000, 24),
    ('groceries', 'GoldPalm Palm Oil 1L', 'goldpalm-palm-oil-1l', 'GoldPalm', 'One-litre bottle of palm oil for soups and traditional dishes.', false, 'GOLDPALM-PALM-OIL-1L', 850000, 32),
    ('groceries', 'Harvest Ground Egusi 500g', 'harvest-ground-egusi-500g', 'Harvest', '500g sealed pack of ground melon seeds for Nigerian soups.', false, 'HARVEST-GROUND-EGUSI-500G', 1950000, 23),
    ('groceries', 'Harvest Dried Catfish 250g', 'harvest-dried-catfish-250g', 'Harvest', '250g pack of dried catfish for soups and stews.', false, 'HARVEST-DRIED-CATFISH-250G', 2450000, 17),
    ('groceries', 'Harvest Table Salt 1kg 3-Pack', 'harvest-table-salt-1kg-3-pack', 'Harvest', 'Three one-kilogram packs of iodised table salt for kitchen use.', false, 'HARVEST-TABLE-SALT-1KG-3-PACK', 450000, 48),
    ('groceries', 'Harvest Peanut Butter 1kg', 'harvest-peanut-butter-1kg', 'Harvest', 'One-kilogram jar of smooth peanut butter for breakfast and snacks.', false, 'HARVEST-PEANUT-BUTTER-1KG', 3250000, 18),
    ('sports-fitness', 'ActiveFit Adjustable Dumbbell Pair', 'activefit-adjustable-dumbbell-pair', 'ActiveFit', 'Pair of adjustable dumbbells for home strength training.', true, 'ACTIVEFIT-ADJUSTABLE-DUMBBELL-PAIR', 18500000, 8),
    ('sports-fitness', 'ActiveFit Yoga Mat 6mm', 'activefit-yoga-mat-6mm', 'ActiveFit', 'Non-slip 6mm exercise mat for yoga, stretching and floor workouts.', false, 'ACTIVEFIT-YOGA-MAT-6MM', 4850000, 18),
    ('sports-fitness', 'ActiveFit Resistance Bands 5-Pack', 'activefit-resistance-bands-5-pack', 'ActiveFit', 'Five resistance bands with varied tension levels and carry pouch.', false, 'ACTIVEFIT-RESISTANCE-BANDS-5-PACK', 3250000, 22),
    ('sports-fitness', 'ActiveFit Skipping Rope', 'activefit-skipping-rope', 'ActiveFit', 'Adjustable speed rope with comfortable handles for cardio workouts.', false, 'ACTIVEFIT-SKIPPING-ROPE', 1850000, 28),
    ('sports-fitness', 'ActiveFit Exercise Ball 65cm', 'activefit-exercise-ball-65cm', 'ActiveFit', '65cm stability ball for stretching and balance exercises.', false, 'ACTIVEFIT-EXERCISE-BALL-65CM', 3950000, 13),
    ('sports-fitness', 'ActiveFit Push-Up Bars', 'activefit-push-up-bars', 'ActiveFit', 'Pair of sturdy push-up bars with non-slip handles.', false, 'ACTIVEFIT-PUSH-UP-BARS', 2850000, 19),
    ('sports-fitness', 'ActiveFit 10kg Kettlebell', 'activefit-10kg-kettlebell', 'ActiveFit', '10kg coated kettlebell for home strength and conditioning sessions.', false, 'ACTIVEFIT-10KG-KETTLEBELL', 9850000, 10),
    ('sports-fitness', 'ActiveFit Football Size 5', 'activefit-football-size-5', 'ActiveFit', 'Size 5 training football with durable outer material.', false, 'ACTIVEFIT-FOOTBALL-SIZE-5', 4250000, 17),
    ('sports-fitness', 'ActiveFit Basketball Size 7', 'activefit-basketball-size-7', 'ActiveFit', 'Size 7 basketball for training and recreational play.', false, 'ACTIVEFIT-BASKETBALL-SIZE-7', 4850000, 14),
    ('sports-fitness', 'ActiveFit Badminton Racket Pair', 'activefit-badminton-racket-pair', 'ActiveFit', 'Two recreational badminton rackets with a protective carry case.', false, 'ACTIVEFIT-BADMINTON-RACKET-PAIR', 5850000, 11),
    ('sports-fitness', 'ActiveFit Sports Water Bottle 1L', 'activefit-sports-water-bottle-1l', 'ActiveFit', 'One-litre reusable sports bottle with secure flip-top lid.', false, 'ACTIVEFIT-SPORTS-WATER-BOTTLE-1L', 1250000, 32),
    ('sports-fitness', 'ActiveFit Foam Roller 45cm', 'activefit-foam-roller-45cm', 'ActiveFit', '45cm textured foam roller for warm-ups and post-workout recovery.', false, 'ACTIVEFIT-FOAM-ROLLER-45CM', 3950000, 16),
    ('sports-fitness', 'ActiveFit Training Gloves', 'activefit-training-gloves', 'ActiveFit', 'Padded fitness gloves with adjustable wrist straps.', false, 'ACTIVEFIT-TRAINING-GLOVES', 2450000, 20),
    ('sports-fitness', 'ActiveFit Foldable Exercise Bench', 'activefit-foldable-exercise-bench', 'ActiveFit', 'Foldable adjustable bench for home workouts and strength training.', false, 'ACTIVEFIT-FOLDABLE-EXERCISE-BENCH', 28500000, 5),
    ('sports-fitness', 'ActiveFit Cycling Helmet', 'activefit-cycling-helmet', 'ActiveFit', 'Adjustable ventilated helmet for recreational cycling.', false, 'ACTIVEFIT-CYCLING-HELMET', 8950000, 9),
    ('books-stationery', 'BrightPath Nigerian History Reader', 'brightpath-nigerian-history-reader', 'BrightPath', 'Illustrated introduction to Nigerian history for secondary students.', true, 'BRIGHTPATH-NIGERIAN-HISTORY-READER', 3850000, 14),
    ('books-stationery', 'BrightPath Junior Mathematics Workbook', 'brightpath-junior-mathematics-workbook', 'BrightPath', 'Practice workbook with arithmetic and problem-solving exercises.', false, 'BRIGHTPATH-JUNIOR-MATHEMATICS-WORKBOOK', 1850000, 28),
    ('books-stationery', 'BrightPath English Grammar Guide', 'brightpath-english-grammar-guide', 'BrightPath', 'Reference guide to English grammar with practice activities.', false, 'BRIGHTPATH-ENGLISH-GRAMMAR-GUIDE', 2450000, 22),
    ('books-stationery', 'BrightPath African Short Stories', 'brightpath-african-short-stories', 'BrightPath', 'Collection of contemporary short stories by African writers.', false, 'BRIGHTPATH-AFRICAN-SHORT-STORIES', 3250000, 16),
    ('books-stationery', 'BrightPath Study Skills Handbook', 'brightpath-study-skills-handbook', 'BrightPath', 'Practical study planner and revision guide for students.', false, 'BRIGHTPATH-STUDY-SKILLS-HANDBOOK', 2250000, 19),
    ('books-stationery', 'PaperTrail A5 Hardcover Notebook 3-Pack', 'papertrail-a5-hardcover-notebook-3-pack', 'PaperTrail', 'Three A5 ruled notebooks with durable hardcover binding.', false, 'PAPERTRAIL-A5-HARDCOVER-NOTEBOOK-3-PACK', 1950000, 31),
    ('books-stationery', 'PaperTrail Executive Ballpoint Pens 10-Pack', 'papertrail-executive-ballpoint-pens-10-pack', 'PaperTrail', 'Ten smooth-writing ballpoint pens for work and school.', false, 'PAPERTRAIL-EXECUTIVE-BALLPOINT-PENS-10-PACK', 850000, 45),
    ('books-stationery', 'PaperTrail Watercolour Pencil Set 24-Piece', 'papertrail-watercolour-pencil-set-24-piece', 'PaperTrail', 'Twenty-four watercolour pencils with a compact storage tin.', false, 'PAPERTRAIL-WATERCOLOUR-PENCIL-SET-24-PIECE', 2850000, 18),
    ('books-stationery', 'PaperTrail A4 Copy Paper 500 Sheets', 'papertrail-a4-copy-paper-500-sheets', 'PaperTrail', 'One ream of A4 multipurpose copy paper for home or office.', false, 'PAPERTRAIL-A4-COPY-PAPER-500-SHEETS', 3250000, 24),
    ('books-stationery', 'PaperTrail Desk Organiser', 'papertrail-desk-organiser', 'PaperTrail', 'Desktop organiser with compartments for pens and small stationery.', false, 'PAPERTRAIL-DESK-ORGANISER', 2450000, 17),
    ('books-stationery', 'PaperTrail Geometry Set', 'papertrail-geometry-set', 'PaperTrail', 'Student geometry set with ruler, compass, protractor and pencil.', false, 'PAPERTRAIL-GEOMETRY-SET', 950000, 33),
    ('books-stationery', 'BrightPath Children''s Storybook Collection', 'brightpath-childrens-storybook-collection', 'BrightPath', 'Four illustrated storybooks for shared reading with children.', false, 'BRIGHTPATH-CHILDRENS-STORYBOOK-COLLECTION', 4850000, 15),
    ('books-stationery', 'PaperTrail Weekly Planner Pad', 'papertrail-weekly-planner-pad', 'PaperTrail', 'Undated weekly desk planner pad with tear-off pages.', false, 'PAPERTRAIL-WEEKLY-PLANNER-PAD', 1350000, 25),
    ('books-stationery', 'PaperTrail Backpack Pencil Case', 'papertrail-backpack-pencil-case', 'PaperTrail', 'Zipped pencil case with divided storage for school supplies.', false, 'PAPERTRAIL-BACKPACK-PENCIL-CASE', 1250000, 29),
    ('books-stationery', 'BrightPath Basic Coding for Kids', 'brightpath-basic-coding-for-kids', 'BrightPath', 'Beginner-friendly activities introducing coding concepts to children.', false, 'BRIGHTPATH-BASIC-CODING-FOR-KIDS', 4250000, 12),
    ('baby-kids', 'Little Steps Baby Bath Support', 'little-steps-baby-bath-support', 'Little Steps', 'Ergonomic bath support designed for supervised infant bath time.', true, 'LITTLE-STEPS-BABY-BATH-SUPPORT', 3850000, 18),
    ('baby-kids', 'Little Steps Cotton Bodysuits 5-Pack', 'little-steps-cotton-bodysuits-5-pack', 'Little Steps', 'Five soft cotton bodysuits for everyday baby wear.', false, 'LITTLE-STEPS-COTTON-BODYSUITS-5-PACK', 6250000, 16),
    ('baby-kids', 'Little Steps Baby Muslin Cloths 6-Pack', 'little-steps-baby-muslin-cloths-6-pack', 'Little Steps', 'Six lightweight muslin cloths for feeding and daily baby care.', false, 'LITTLE-STEPS-BABY-MUSLIN-CLOTHS-6-PACK', 2850000, 24),
    ('baby-kids', 'Little Steps Convertible High Chair', 'little-steps-convertible-high-chair', 'Little Steps', 'Adjustable high chair with removable tray and wipe-clean seat.', false, 'LITTLE-STEPS-CONVERTIBLE-HIGH-CHAIR', 28500000, 5),
    ('baby-kids', 'Little Steps Baby Carrier Wrap', 'little-steps-baby-carrier-wrap', 'Little Steps', 'Soft adjustable wrap carrier for supported, supervised baby carrying.', false, 'LITTLE-STEPS-BABY-CARRIER-WRAP', 7850000, 10),
    ('baby-kids', 'Little Steps Infant Play Gym', 'little-steps-infant-play-gym', 'Little Steps', 'Padded play mat with detachable toys for supervised floor play.', false, 'LITTLE-STEPS-INFANT-PLAY-GYM', 14800000, 7),
    ('baby-kids', 'Little Steps Baby Nail Care Set', 'little-steps-baby-nail-care-set', 'Little Steps', 'Gentle baby nail-care tools stored in a compact protective case.', false, 'LITTLE-STEPS-BABY-NAIL-CARE-SET', 1850000, 21),
    ('baby-kids', 'Little Steps Training Cup 2-Pack', 'little-steps-training-cup-2-pack', 'Little Steps', 'Two handled training cups with spill-resistant lids.', false, 'LITTLE-STEPS-TRAINING-CUP-2-PACK', 1650000, 26),
    ('baby-kids', 'Little Steps Kids Art Set', 'little-steps-kids-art-set', 'Little Steps', 'Washable crayons, pencils and activity sheets for supervised play.', false, 'LITTLE-STEPS-KIDS-ART-SET', 2450000, 20),
    ('baby-kids', 'Little Steps Building Blocks 80-Piece Set', 'little-steps-building-blocks-80-piece-set', 'Little Steps', 'Colourful 80-piece building block set for supervised creative play.', false, 'LITTLE-STEPS-BUILDING-BLOCKS-80-PIECE-SET', 5850000, 12),
    ('baby-kids', 'Little Steps Kids Rain Boots', 'little-steps-kids-rain-boots', 'Little Steps', 'Lightweight waterproof boots for rainy-day walks and play.', false, 'LITTLE-STEPS-KIDS-RAIN-BOOTS', 4250000, 14),
    ('baby-kids', 'Little Steps Baby Blanket', 'little-steps-baby-blanket', 'Little Steps', 'Soft lightweight baby blanket for supervised use at home or travel.', false, 'LITTLE-STEPS-BABY-BLANKET', 2950000, 22),
    ('baby-kids', 'Little Steps Toddler Safety Gate', 'little-steps-toddler-safety-gate', 'Little Steps', 'Pressure-fit safety gate for supervised childproofing at home.', false, 'LITTLE-STEPS-TODDLER-SAFETY-GATE', 18500000, 6),
    ('baby-kids', 'Little Steps Baby Car Seat', 'little-steps-baby-car-seat', 'Little Steps', 'Adjustable infant car seat for use according to vehicle and product instructions.', false, 'LITTLE-STEPS-BABY-CAR-SEAT', 48500000, 4),
    ('baby-kids', 'Little Steps School Backpack', 'little-steps-school-backpack', 'Little Steps', 'Lightweight children''s backpack with padded straps and front pocket.', false, 'LITTLE-STEPS-SCHOOL-BACKPACK', 3850000, 17),
    ('food-drinks', 'Harvest Zobo Hibiscus Drink 1L', 'harvest-zobo-hibiscus-drink-1l', 'Harvest', 'One-litre ready-to-serve hibiscus drink, chilled before serving.', true, 'HARVEST-ZOBO-HIBISCUS-DRINK-1L', 950000, 28),
    ('food-drinks', 'Harvest Ginger Drink 500ml 6-Pack', 'harvest-ginger-drink-500ml-6-pack', 'Harvest', 'Six 500ml ginger drinks for serving chilled.', false, 'HARVEST-GINGER-DRINK-500ML-6-PACK', 2250000, 20),
    ('food-drinks', 'Harvest Tigernut Drink 1L', 'harvest-tigernut-drink-1l', 'Harvest', 'One-litre tigernut drink; keep refrigerated and shake before serving.', false, 'HARVEST-TIGERNUT-DRINK-1L', 1450000, 18),
    ('food-drinks', 'Harvest Malt Drink 33cl 6-Pack', 'harvest-malt-drink-33cl-6-pack', 'Harvest', 'Six 33cl malt drinks for home and gatherings.', false, 'HARVEST-MALT-DRINK-33CL-6-PACK', 1850000, 24),
    ('food-drinks', 'Harvest Bottled Water 75cl 12-Pack', 'harvest-bottled-water-75cl-12-pack', 'Harvest', 'Twelve 75cl bottles of drinking water for everyday hydration.', false, 'HARVEST-BOTTLED-WATER-75CL-12-PACK', 1250000, 35),
    ('food-drinks', 'Harvest Orange Juice 1L', 'harvest-orange-juice-1l', 'Harvest', 'One-litre orange juice drink, best served chilled.', false, 'HARVEST-ORANGE-JUICE-1L', 1850000, 22),
    ('food-drinks', 'Harvest Cocoa Beverage Powder 500g', 'harvest-cocoa-beverage-powder-500g', 'Harvest', '500g cocoa beverage powder for hot or cold drinks.', false, 'HARVEST-COCOA-BEVERAGE-POWDER-500G', 2450000, 17),
    ('food-drinks', 'Harvest Instant Coffee 100g', 'harvest-instant-coffee-100g', 'Harvest', '100g jar of instant coffee for quick home and office preparation.', false, 'HARVEST-INSTANT-COFFEE-100G', 2850000, 16),
    ('food-drinks', 'Harvest Green Tea 40 Bags', 'harvest-green-tea-40-bags', 'Harvest', 'Box of 40 green tea bags for everyday hot drinks.', false, 'HARVEST-GREEN-TEA-40-BAGS', 1250000, 25),
    ('food-drinks', 'Harvest Lemonade 1L', 'harvest-lemonade-1l', 'Harvest', 'One-litre lemonade drink, best served chilled.', false, 'HARVEST-LEMONADE-1L', 1150000, 20),
    ('food-drinks', 'Harvest Coconut Water 330ml 6-Pack', 'harvest-coconut-water-330ml-6-pack', 'Harvest', 'Six 330ml coconut water drinks for serving chilled.', false, 'HARVEST-COCONUT-WATER-330ML-6-PACK', 2850000, 15),
    ('food-drinks', 'Harvest Nigerian Honey 500g', 'harvest-nigerian-honey-500g', 'Harvest', '500g jar of honey for drinks, breakfast and home recipes.', false, 'HARVEST-NIGERIAN-HONEY-500G', 3850000, 14),
    ('food-drinks', 'Harvest Date Syrup 350ml', 'harvest-date-syrup-350ml', 'Harvest', '350ml date syrup for sweetening drinks and breakfast foods.', false, 'HARVEST-DATE-SYRUP-350ML', 2450000, 12),
    ('food-drinks', 'Harvest Plantain Chips 150g 5-Pack', 'harvest-plantain-chips-150g-5-pack', 'Harvest', 'Five 150g packs of crunchy plantain chips for sharing.', false, 'HARVEST-PLANTAIN-CHIPS-150G-5-PACK', 1850000, 26),
    ('food-drinks', 'Harvest Chin Chin 500g', 'harvest-chin-chin-500g', 'Harvest', '500g pack of crunchy chin chin for snacks and gatherings.', false, 'HARVEST-CHIN-CHIN-500G', 1250000, 23)
),
category_gaps as (
  select c.id as category_id, c.slug,
         greatest(15 - count(p.id) filter (where p.is_active), 0)::int as needed
  from public.categories c
  left join public.products p on p.category_id = c.id
  where c.slug in ('electronics','fashion','home-kitchen','phones-tablets','beauty','groceries','sports-fitness','books-stationery','baby-kids','food-drinks')
  group by c.id, c.slug
),
eligible as (
  select r.*, g.category_id,
         row_number() over (partition by r.category_slug order by r.slug) as row_num,
         g.needed
  from candidates r
  join category_gaps g on g.slug = r.category_slug
  where not exists (select 1 from public.products p where p.slug = r.slug)
    and not exists (select 1 from public.product_variants v where v.sku = r.sku)
),
selected as (
  select * from eligible where row_num <= needed
),
new_products as (
  insert into public.products
    (category_id, name, slug, brand, description, is_active, is_featured, units_sold)
  select s.category_id, s.name, s.slug, s.brand, s.description, true, s.is_featured, 0
  from selected s
  on conflict (slug) do nothing
  returning id, slug
)
insert into public.product_variants
  (product_id, sku, name, options, price_kobo, compare_at_price_kobo, stock_quantity, is_active)
select p.id, s.sku, 'Default', '{}'::jsonb, s.price_kobo, null, s.stock_quantity, true
from selected s
join new_products p on p.slug = s.slug
on conflict (sku) do nothing;

commit;
