SELECT
        id, item, quantity, purchaseQuantity, description
    FROM
        ingredient
    WHERE 
        id = ?
    AND
        userid = ?;