SELECT
    id, item, quantity, purchaseQuantity, description
FROM
    ingredient
WHERE
    userid = ?
ORDER BY
    item;