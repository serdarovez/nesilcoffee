-- AlterTable
ALTER TABLE "Setting" ADD COLUMN     "contactWhatsapp" TEXT,
ADD COLUMN     "expertsTitle" JSONB,
ADD COLUMN     "telegram" TEXT;

-- CreateTable
CREATE TABLE "Expert" (
    "id" TEXT NOT NULL,
    "name" JSONB NOT NULL,
    "role" JSONB NOT NULL,
    "quote" JSONB NOT NULL,
    "photoId" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Expert_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Expert_sortOrder_idx" ON "Expert"("sortOrder");

-- AddForeignKey
ALTER TABLE "Expert" ADD CONSTRAINT "Expert_photoId_fkey" FOREIGN KEY ("photoId") REFERENCES "Media"("id") ON DELETE SET NULL ON UPDATE CASCADE;
