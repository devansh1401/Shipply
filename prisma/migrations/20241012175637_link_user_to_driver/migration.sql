-- Step 1: Add the userId column as nullable
ALTER TABLE "Driver" ADD COLUMN "userId" TEXT;

-- Step 2: Update existing Driver records
-- This assumes that there's a matching User record for each Driver based on the email
UPDATE "Driver" d
SET "userId" = (SELECT id FROM "User" u WHERE u.email = d.email LIMIT 1);

-- Step 3: Make the userId column non-nullable
ALTER TABLE "Driver" ALTER COLUMN "userId" SET NOT NULL;

-- Step 4: Add the unique constraint
CREATE UNIQUE INDEX "Driver_userId_key" ON "Driver"("userId");

-- Step 5: Add the foreign key constraint
ALTER TABLE "Driver" ADD CONSTRAINT "Driver_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;