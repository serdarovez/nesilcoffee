-- Product art width is no longer editable per slide: the hero renders every
-- pack at the former 42% default on desktop.
ALTER TABLE "ProductsHeroSlide" DROP COLUMN "productWidth";
