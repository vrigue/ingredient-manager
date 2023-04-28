UPDATE
        ingredient
SET
    item = ?,
    quantity = ?,
    purchaseQuantity = ?,
    description = ?
WHERE
    id = ?
AND
    userid = ?