-- Per-slide horizontal placement of the product image on the products hero,
-- as a percentage across the right half of the carousel (0 = centre, 100 =
-- right edge). 100 reproduces the previous fixed right alignment.
ALTER TABLE "ProductsHeroSlide" ADD COLUMN "productOffset" INTEGER NOT NULL DEFAULT 100;
