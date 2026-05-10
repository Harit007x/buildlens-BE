-- CreateTable
CREATE TABLE "_PropertyBuyers" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_PropertyBuyers_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_PropertyBuyers_B_index" ON "_PropertyBuyers"("B");

-- AddForeignKey
ALTER TABLE "_PropertyBuyers" ADD CONSTRAINT "_PropertyBuyers_A_fkey" FOREIGN KEY ("A") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PropertyBuyers" ADD CONSTRAINT "_PropertyBuyers_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
