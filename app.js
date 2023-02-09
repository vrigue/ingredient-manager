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
} );


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
        ingredient_id, expiration_date, brand_name, price
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
                } else if (results2.length === 0) {
                    res.status(404).send(`No stock found with ingredient_id = '${req.params.id}`)
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

/* define a route for item DELETE */
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
})

/* start the server */
app.listen( port, () => {
    console.log(`App server listening on ${ port }. (Go to http://localhost:${ port })` );
} );