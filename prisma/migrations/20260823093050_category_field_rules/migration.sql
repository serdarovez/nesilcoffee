-- AlterTable
ALTER TABLE "Category" ADD COLUMN     "fieldRules" JSONB NOT NULL DEFAULT '{}';

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "pieces" INTEGER,
ALTER COLUMN "roast" DROP NOT NULL,
ALTER COLUMN "acidity" DROP NOT NULL;

-- ---------------------------------------------------------------------------
-- Data migration
-- ---------------------------------------------------------------------------

-- Split packed weights into a count and a unit weight.
--
-- The instant range is stored as "20 x 18 gr" in a single free-text column,
-- which no longer matches how the card renders it: `pieces` now carries the
-- count and the badge composes "20 sht x 18 gr" with a translated unit. Only
-- rows matching the "<digits> <x> <rest>" shape are touched, so this is a
-- no-op on every other product and safe to re-run.
DO $$
DECLARE
  changed integer;
BEGIN
  WITH parsed AS (
    SELECT id,
           (regexp_match(weight, '^\s*(\d+)\s*[×xX*]\s*(.+)$'))[1]::int AS n,
           btrim((regexp_match(weight, '^\s*(\d+)\s*[×xX*]\s*(.+)$'))[2]) AS unit
    FROM "Product"
    WHERE weight ~ '^\s*\d+\s*[×xX*]\s*.+$'
  )
  UPDATE "Product" p
  SET pieces = parsed.n,
      weight = parsed.unit
  FROM parsed
  WHERE p.id = parsed.id;

  GET DIAGNOSTICS changed = ROW_COUNT;
  RAISE NOTICE 'split packed weight into pieces on % product(s)', changed;
END $$;

-- Seed the field rules for the categories that shipped with the site.
--
-- Matched on slug, so a database whose categories were renamed or added later
-- simply keeps the defaults (see DEFAULT_FIELD_RULES) rather than getting the
-- wrong rules. Only rows still holding '{}' are written, so an admin who has
-- already configured a category is never overwritten.
UPDATE "Category" SET "fieldRules" = '{
  "weight": "required", "pieces": "off",
  "arabica": "optional", "robusta": "optional",
  "roast": "required", "acidity": "required"
}'::jsonb WHERE slug = 'bean' AND "fieldRules" = '{}'::jsonb;

-- Sold as 20-stick packs, and the pack carries no meaningful acidity figure.
UPDATE "Category" SET "fieldRules" = '{
  "weight": "required", "pieces": "required",
  "arabica": "optional", "robusta": "off",
  "roast": "required", "acidity": "off"
}'::jsonb WHERE slug = 'instant' AND "fieldRules" = '{}'::jsonb;

UPDATE "Category" SET "fieldRules" = '{
  "weight": "required", "pieces": "off",
  "arabica": "optional", "robusta": "off",
  "roast": "required", "acidity": "required"
}'::jsonb WHERE slug = 'freeze-dried' AND "fieldRules" = '{}'::jsonb;

-- Tea has none of the coffee specs. The seeded Karak carried a meaningless
-- roast 3 / acidity 2; the values stay in the table but stop being rendered.
UPDATE "Category" SET "fieldRules" = '{
  "weight": "required", "pieces": "off",
  "arabica": "off", "robusta": "off",
  "roast": "off", "acidity": "off"
}'::jsonb WHERE slug = 'tea' AND "fieldRules" = '{}'::jsonb;
