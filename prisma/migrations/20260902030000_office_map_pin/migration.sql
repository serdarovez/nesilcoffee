-- Map pin for a branch office, so a visitor sent that office's address also
-- gets that office's location on the contacts map instead of head office.
-- All nullable: an office without a pin simply leaves the map where it was.
ALTER TABLE "CountryContact" ADD COLUMN "mapLat" DOUBLE PRECISION;
ALTER TABLE "CountryContact" ADD COLUMN "mapLng" DOUBLE PRECISION;
ALTER TABLE "CountryContact" ADD COLUMN "mapUrl" TEXT;
