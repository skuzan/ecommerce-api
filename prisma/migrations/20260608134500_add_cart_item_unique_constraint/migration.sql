-- Prevent the same product from being inserted into the same cart twice.
CREATE UNIQUE INDEX "cart_items_cartId_productId_key" ON "cart_items"("cartId", "productId");
