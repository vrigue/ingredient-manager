SELECT
        id, ingredient_id, DATE_FORMAT(expiration_date, "%W, %M %e, %Y") AS expiration_date, brand_name, price
    FROM
        stock
    WHERE 
        ingredient_id = ?
    AND
        id = ?;