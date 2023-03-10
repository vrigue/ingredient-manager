/* set up the server */
const express = require( "express" );
const logger = require("morgan");
const app = express();
const port = 8080;
const db = require("./db/db_connection");
app.set( "views",  __dirname + "/views");
app.set( "view engine", "ejs" );

/* define middleware that logs all incoming requests */
app.use(logger("dev"));

/* define middleware that serves static resources in the public directory */
app.use(express.static(__dirname + '/public'));

// configure Express to parse URL-encoded POST request bodies (traditional forms)
app.use( express.urlencoded({ extended: false }) );

/* define a route for the default home page */
app.get( "/", ( req, res ) => {
    res.render("index");
} );


const read_ingredient_all_sql = `
SELECT
    id, item, quantity, purchaseQuantity, description
FROM
    ingredient;
`

/* define a route for the inventory page */
app.get( "/inventory", ( req, res ) => {
    db.execute(read_ingredient_all_sql, (error, results) => {
        if (error) {
            res.status(500).send(error); /* sends an internal server error if something goes wrong */
        } else {
            res.render("inventory", {ingredient : results});
        }
    });
});


const read_ingredient_sql = `
    SELECT
        id, item, quantity, purchaseQuantity, description
    FROM
        ingredient
    WHERE 
        id = ?;
`

const read_ingredient_stock_sql = `
    SELECT
        id, ingredient_id, expiration_date, brand_name, price
    FROM
        stock
    WHERE 
        ingredient_id = ?;
`

/* define a route for the ingredient detail page */
app.get( "/inventory/ingredient/:id", ( req, res ) => {
    db.execute(read_ingredient_sql, [req.params.id], (error, results1) => {
        if (error) {
            res.status(500).send(error); /* sends an internal server error if something goes wrong */
        } else if (results1.length === 0) {
            res.status(404).send(`No ingredient found with id = '${req.params.id}`)
        }  else {
            db.execute(read_ingredient_stock_sql, [req.params.id], (error, results2) => {
                if (error) {
                    res.status(500).send(error); /* sends an internal server error if something goes wrong */
                }  else {
                    res.render("ingredient", {data : {ingredient : results1[0], stock : results2}});
                }
            });
        }
    });
});


const delete_ingredient_sql = `
    DELETE 
        FROM
            ingredient
        WHERE
            id = ?
`

const delete_ingredient_stock_sql = `
    DELETE 
        FROM
            stock
        WHERE
            ingredient_id = ?
`

/* define a route for ingredient DELETE */
app.get("/inventory/ingredient/:id/delete", ( req, res ) => {
    db.execute(delete_ingredient_stock_sql, [req.params.id], (error, results1) => {
        if (error)
            res.status(500).send(error); /* sends an internal server error if something goes wrong */
        else {
            db.execute(delete_ingredient_sql, [req.params.id], (error, results2) => {
                if (error)
                    res.status(500).send(error); /* sends an internal server error if something goes wrong */
                else {
                    res.redirect("/inventory");
                }
            });
        }
    });
});


const delete_stock_sql = `
    DELETE 
        FROM
            stock
        WHERE
            id = ?
`

/* define a route for stock DELETE */
app.get("/inventory/ingredient/:ingredient_id/stock/:id/delete", ( req, res ) => {
    db.execute(delete_stock_sql, [req.params.id], (error, results1) => {
        if (error)
            res.status(500).send(error); /* sends an internal server error if something goes wrong */
        else {
            res.redirect(`/inventory/ingredient/${req.params.ingredient_id}`);
        }
    });
});


const create_ingredient_sql = `
    INSERT INTO ingredient
        (item, quantity, purchaseQuantity)
    VALUES
        (?, ?, ?)
`

/* define a route for ingredient CREATE */
app.post("/inventory", ( req, res ) => {
    db.execute(create_ingredient_sql, [req.body.name, req.body.currentQuantity, req.body.purchaseQuantity], (error, results) => {
        if (error)
            res.status(500).send(error); /* sends an internal server error if something goes wrong */
        else {
            /* results.insertId has the primary key (id) of the newly inserted element */
            res.redirect(`/inventory/ingredient/${results.insertId}`);
        }
    });
});


const create_stock_sql = `
    INSERT INTO stock
        (expiration_date, brand_name, price, ingredient_id)
    VALUES
        (?, ?, ?, ?)
`

/* define a route for stock CREATE */
app.post("/inventory/ingredient/:ingredient_id/stock", ( req, res ) => {
    db.execute(create_stock_sql, [req.body.expiration, req.body.brand, req.body.price, req.params.ingredient_id], (error, results) => {
        if (error)
            res.status(500).send(error); /* sends an internal server error if something goes wrong */
        else {
            /* results.insertId has the primary key (id) of the newly inserted element */
            res.redirect(`/inventory/ingredient/${req.params.ingredient_id}`);
        }
    });
});


const update_ingredient_sql = `
    UPDATE
        ingredient
    SET
        item = ?,
        quantity = ?,
        purchaseQuantity = ?,
        description = ?
    WHERE
        id = ?
`
/* define a route for ingredient UPDATE */
app.post("/inventory/ingredient/:id", ( req, res ) => {
    db.execute(update_ingredient_sql, [req.body.name, req.body.currentQuantity, req.body.purchaseQuantity, req.body.description, req.params.id], (error, results) => {
        if (error)
            res.status(500).send(error); //Internal Server Error
        else {
            res.redirect(`/inventory/ingredient/${req.params.id}`);
        }
    });
});

const update_stock_sql = `
    UPDATE
        stock
    SET
        expiration_date = ?,
        brand_name = ?,
        price = ?
    WHERE
        id = ?
`
/* define a route for stock UPDATE */
app.post("/inventory/ingredient/stock/:ingredient_id", ( req, res ) => {
    db.execute(update_stock_sql, [req.body.expiration, req.body.brand, req.body.price, req.body.id], (error, results) => {
        if (error)
            res.status(500).send(error); //Internal Server Error
        else {
            res.redirect(`/inventory/ingredient/${req.params.id}`);
        }
    });
});


/* start the server */
app.listen( port, () => {
    console.log(`App server listening on ${ port }. (Go to http://localhost:${ port })` );
} );