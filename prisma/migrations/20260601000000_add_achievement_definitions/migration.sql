CREATE TABLE "achievement_definitions" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "sub" TEXT NOT NULL,
    "level" INTEGER NOT NULL DEFAULT 1,
    "bonus" INTEGER NOT NULL DEFAULT 0,
    "criteria_key" TEXT NOT NULL,
    "threshold" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "achievement_definitions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "achievement_definitions_type_key" ON "achievement_definitions"("type");
