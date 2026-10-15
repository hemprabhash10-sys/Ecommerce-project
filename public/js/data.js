/**
 * ATELIER LUXE - PRODUCT CATALOG DATASET
 * Rich mock catalog simulating an editorial fashion apparel brand.
 */

const INITIAL_PRODUCTS = [
  {
    id: "prod_wool_overcoat",
    title: "Double-Breasted Camel Wool Overcoat",
    brand: "ATELIER Atelier",
    category: "outerwear",
    gender: "unisex",
    price: 295.00,
    compareAtPrice: 380.00,
    rating: 4.9,
    reviewCount: 94,
    badge: "BESTSELLER",
    images: [
      "images/product_wool_overcoat.jpg",
      "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=800&q=80"
    ],
    colors: [
      { name: "Camel Tan", hex: "#c19a6b" },
      { name: "Onyx Black", hex: "#111115" },
      { name: "Charcoal", hex: "#3a3a42" }
    ],
    sizes: ["XS", "S", "M", "L", "XL"],
    inStock: true,
    stockCount: 12,
    description: "An iconic sartorial staple. Precision tailored from 100% heavyweight virgin Italian wool with a luxurious double-faced finish. Features horn button closures, wide peak lapels, and an unstructured relaxed drape designed for effortless layering.",
    fabricDetails: [
      "100% Virgin Merino Wool (540 gsm)",
      "Bemberg cupro satin interior lining",
      "Genuine Italian horn buttons",
      "Double back vent with concealed kick pleat"
    ],
    careInstructions: [
      "Dry clean only by luxury apparel specialist",
      "Steam gently to release wrinkles",
      "Store on wide-shoulder contoured hanger"
    ],
    isFeatured: true
  },
  {
    id: "prod_ribbed_sweater",
    title: "Chunky Ribbed Merino Turtleneck",
    brand: "ATELIER Studio",
    category: "knitwear",
    gender: "women",
    price: 165.00,
    compareAtPrice: 220.00,
    rating: 4.8,
    reviewCount: 112,
    badge: "NEW",
    images: [
      "images/product_ribbed_sweater.jpg",
      "https://images.unsplash.com/photo-1576566588028-4147f3842f27?auto=format&fit=crop&w=800&q=80"
    ],
    colors: [
      { name: "Ivory Cream", hex: "#f4f1ea" },
      { name: "Muted Sage", hex: "#8a9a86" },
      { name: "Espresso", hex: "#2e2118" }
    ],
    sizes: ["XS", "S", "M", "L"],
    inStock: true,
    stockCount: 18,
    description: "Knit from extra-fine 7-gauge merino wool for cloud-like softness without itching. Features an architectural ribbed pattern, drop-shoulder silhouette, and an effortless fold-over collar.",
    fabricDetails: [
      "100% Extra-Fine Australian Merino Wool",
      "Pre-washed for shrink resistance",
      "Heavyweight 7-gauge fisherman rib knit"
    ],
    careInstructions: [
      "Hand wash cold with wool detergent",
      "Dry flat, do not wring or hang",
      "Pill-comb seasonally as required"
    ],
    isFeatured: true
  },
  {
    id: "prod_denim_jacket",
    title: "Raw Selvedge Denim Trucker Jacket",
    brand: "ATELIER Craft",
    category: "outerwear",
    gender: "unisex",
    price: 195.00,
    compareAtPrice: 250.00,
    rating: 4.9,
    reviewCount: 76,
    badge: "LIMITED",
    images: [
      "images/product_denim_jacket.jpg",
      "https://images.unsplash.com/photo-1543076447-215ad9ba6923?auto=format&fit=crop&w=800&q=80"
    ],
    colors: [
      { name: "Raw Indigo", hex: "#1c2b48" },
      { name: "Washed Black", hex: "#252528" }
    ],
    sizes: ["S", "M", "L", "XL"],
    inStock: true,
    stockCount: 8,
    description: "Constructed on vintage shuttle looms from 14.5oz Japanese selvedge denim. Designed with clean contrast stitching, custom brass shanks, and a boxy modern silhouette that ages with a unique patina.",
    fabricDetails: [
      "14.5 oz Kaihara Japanese Selvedge Denim",
      "100% Long-Staple Organic Cotton",
      "Custom anti-tarnish brass hardware",
      "Self-edge red ticker detail at interior placket"
    ],
    careInstructions: [
      "Wear raw for 6 months before first wash",
      "Wash inside out in cold water, hang dry only"
    ],
    isFeatured: true
  },
  {
    id: "prod_relaxed_blazer",
    title: "Oversized Charcoal Wool Tailored Blazer",
    brand: "ATELIER Studio",
    category: "outerwear",
    gender: "unisex",
    price: 245.00,
    compareAtPrice: 320.00,
    rating: 4.9,
    reviewCount: 63,
    badge: "SALE",
    images: [
      "images/product_relaxed_blazer.jpg",
      "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=800&q=80"
    ],
    colors: [
      { name: "Charcoal Grey", hex: "#35363b" },
      { name: "Midnight Navy", hex: "#151e2e" }
    ],
    sizes: ["XS", "S", "M", "L", "XL"],
    inStock: true,
    stockCount: 15,
    description: "A gender-fluid statement piece designed with exaggerated shoulders, deep notch lapels, and an effortless fluid drape. Blends formal craftsmanship with effortless contemporary tailoring.",
    fabricDetails: [
      "85% Virgin Wool, 15% Silk Blend",
      "Full internal horsehair canvas chest piece",
      "Hand-finished welt pockets and interior ticket pocket"
    ],
    careInstructions: [
      "Dry clean only",
      "Low temperature press with pressing cloth"
    ],
    isFeatured: true
  },
  {
    id: "prod_silk_shirt",
    title: "Relaxed Matte Silk Crepe Shirt",
    brand: "ATELIER Atelier",
    category: "shirts",
    gender: "women",
    price: 145.00,
    compareAtPrice: 190.00,
    rating: 4.7,
    reviewCount: 42,
    badge: "NEW",
    images: [
      "https://images.unsplash.com/photo-1598033129183-c4f50c736f10?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1603252109303-2751441dd157?auto=format&fit=crop&w=800&q=80"
    ],
    colors: [
      { name: "Sage Olive", hex: "#5b6654" },
      { name: "Alabaster White", hex: "#f3f3f0" },
      { name: "Champagne", hex: "#d8c4a0" }
    ],
    sizes: ["XS", "S", "M", "L"],
    inStock: true,
    stockCount: 22,
    description: "Crafted from sand-washed silk crepe de chine with a fluid, liquid-like drape and an ultra-soft peachskin finish. Features elongated French cuffs and hidden mother-of-pearl button placket.",
    fabricDetails: [
      "100% Sandwashed Silk Crepe (19mm weight)",
      "Mother-of-pearl buttons",
      "French seams throughout"
    ],
    careInstructions: [
      "Hand wash cold with gentle silk solution or dry clean",
      "Do not tumble dry; steam gently"
    ],
    isFeatured: false
  },
  {
    id: "prod_pleated_trousers",
    title: "Double-Pleated Wide-Leg Wool Trousers",
    brand: "ATELIER Studio",
    category: "pants",
    gender: "unisex",
    price: 180.00,
    compareAtPrice: 230.00,
    rating: 4.8,
    reviewCount: 51,
    badge: "BESTSELLER",
    images: [
      "https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=800&q=80"
    ],
    colors: [
      { name: "Graphite", hex: "#2a2b2f" },
      { name: "Sand Beige", hex: "#c9ba9e" }
    ],
    sizes: ["28", "30", "32", "34", "36"],
    inStock: true,
    stockCount: 14,
    description: "High-waisted trousers with dramatic double front pleats and a relaxed wide-leg taper that pools over footwear. Designed with side-adjuster buckle tabs for a tailored fit without a belt.",
    fabricDetails: [
      "100% Tropical High-Twist Wool",
      "Side waist tab adjusters in brass",
      "Unfinished hem for custom inseam alteration"
    ],
    careInstructions: [
      "Dry clean recommended",
      "Steam or iron at medium heat"
    ],
    isFeatured: false
  },
  {
    id: "prod_cashmere_hoodie",
    title: "Heavyweight Brushed Cashmere Hoodie",
    brand: "ATELIER Craft",
    category: "knitwear",
    gender: "unisex",
    price: 210.00,
    compareAtPrice: 275.00,
    rating: 4.9,
    reviewCount: 88,
    badge: "HOT",
    images: [
      "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=800&q=80"
    ],
    colors: [
      { name: "Muted Taupe", hex: "#8c827a" },
      { name: "Shadow Black", hex: "#161618" }
    ],
    sizes: ["S", "M", "L", "XL"],
    inStock: true,
    stockCount: 9,
    description: "Elevating loungewear into fine tailoring. A plush blend of Mongolian grade-A cashmere and organic combed cotton creates a heavyweight, substantial hand feel that repels cold without bulk.",
    fabricDetails: [
      "70% Mongolian Cashmere, 30% Organic Combed Cotton",
      "Double-layered hood with seamless drawstring",
      "Seamless side-entry kangaroo pocket"
    ],
    careInstructions: [
      "Dry clean or hand wash cold with cashmere wash",
      "Lay flat on towel to dry"
    ],
    isFeatured: false
  },
  {
    id: "prod_leather_chelsea",
    title: "Handcrafted Pebble Leather Chelsea Boots",
    brand: "ATELIER Footwear",
    category: "accessories",
    gender: "unisex",
    price: 285.00,
    compareAtPrice: 350.00,
    rating: 4.9,
    reviewCount: 39,
    badge: "LIMITED",
    images: [
      "https://images.unsplash.com/photo-1638247025967-b4e38f787b76?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1520639888713-7851133b1ed0?auto=format&fit=crop&w=800&q=80"
    ],
    colors: [
      { name: "Espresso Pebble", hex: "#1e1713" },
      { name: "Onyx Smooth", hex: "#0e0e0e" }
    ],
    sizes: ["39", "40", "41", "42", "43", "44"],
    inStock: true,
    stockCount: 7,
    description: "Artisan-made in Tuscany using vegetable-tanned full-grain calfskin with Goodyear welt construction. Equipped with resilient Vibram commando rubber outsoles and elasticated side gussets.",
    fabricDetails: [
      "100% Full-Grain Tuscan Calf Leather",
      "Goodyear Welted construction (resoleable)",
      "Vibram Italian rubber lug sole",
      "Full calfskin glove lining and arch support"
    ],
    careInstructions: [
      "Condition leather bi-annually with natural beeswax cream",
      "Use cedar shoe trees between wears"
    ],
    isFeatured: false
  }
];

// Available categories metadata
const CATEGORIES = [
  { id: "all", label: "All Garments", count: 8 },
  { id: "outerwear", label: "Coats & Jackets", count: 3 },
  { id: "knitwear", label: "Knitwear & Sweaters", count: 2 },
  { id: "shirts", label: "Shirts & Tops", count: 1 },
  { id: "pants", label: "Trousers & Denim", count: 1 },
  { id: "accessories", label: "Footwear & Acc.", count: 1 }
];

// Active promo codes
const PROMO_CODES = {
  "ATELIER15": { discount: 0.15, label: "15% Welcome Discount" },
  "LUXE20": { discount: 0.20, label: "20% Exclusive Member Discount" },
  "FREESHIP": { discount: 0.00, freeShipping: true, label: "Complimentary Express Shipping" }
};
