-- Per-slide horizontal placement of the product image on the products hero.
-- "right" reproduces the previous fixed alignment.
ALTER TABLE "ProductsHeroSlide" ADD COLUMN "productAlign" TEXT NOT NULL DEFAULT 'right';
