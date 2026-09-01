-- Branch offices: address and phones shown to visitors from a given country.
-- The Setting row remains the fallback, so no row is needed for the head
-- office and existing deployments keep behaving exactly as before.
CREATE TABLE "CountryContact" (
    "id" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "address" JSONB NOT NULL,
    "phones" JSONB NOT NULL DEFAULT '[]',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CountryContact_pkey" PRIMARY KEY ("id")
);

-- One office per country: the resolver picks by country code and must not have
-- to choose between duplicates.
CREATE UNIQUE INDEX "CountryContact_country_key" ON "CountryContact"("country");
