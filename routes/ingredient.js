const express = require("express");
const db = require("../db/db_pool");
const fs = require("fs");
const path = require("path");

let ingredientRouter = express.Router();


const read_ingredient_sql = fs.readFileSync(path.join(__dirname, 
                                                "..", "db", "queries", "crud", "read_ingredient.sql"),
                                                {encoding : "UTF-8"});

const read_ingredient_all_stock_sql = fs.readFileSync(path.join(__dirname, 
                                                "..", "db", "queries", "crud", "read_ingredient_all_stock.sql"),
                                                {encoding : "UTF-8"});

/* define a route for the ingredient detail page */
ingredientRouter.get( "/:id", ( req, res ) => {
    db.execute(read_ingredient_sql, [req.params.id, req.oidc.user.sub], (error, results1) => {
        if (error) {
            res.status(500).send(error); /* sends an internal server error if something goes wrong */
        } else if (results1.length === 0) {
            res.status(404).send(`No ingredient found with id = '${req.params.id}`)
        }  else {
            db.execute(read_ingredient_all_stock_sql, [req.params.id], (error, results2) => {
                if (error) {
                    res.status(500).send(error); /* sends an internal server error if something goes wrong */
                }  else {
                    res.render("ingredient", {data : {ingredient : results1[0], stock : results2}});
                }
            });
        }
    });
});


const read_ingredient_stock_sql = fs.readFileSync(path.join(__dirname, 
                                                "..", "db", "queries", "crud", "read_ingredient_stock.sql"),
                                                {encoding : "UTF-8"});

/* define a route for the stock detail page */
ingredientRouter.get( "/:id/stock/:ingredient_id", ( req, res ) => {
    db.execute(read_ingredient_sql, [req.params.id, req.oidc.user.sub], (error, results1) => {
        if (error) {
            res.status(500).send(error); /* sends an internal server error if something goes wrong */
        } else if (results1.length === 0) {
            res.status(404).send(`No ingredient found with id = '${req.params.id}`)
        }  else {
            db.execute(read_ingredient_stock_sql, [req.params.id, req.params.ingredient_id], (error, results2) => {
                if (error) {
                    res.status(500).send(error); /* sends an internal server error if something goes wrong */
                }  else {
                    res.render("stock", {data : {ingredient : results1[0], stock : results2[0]}});
                }
            });
        }
    });
});



const create_stock_sql = fs.readFileSync(path.join(__dirname, 
                                                "..", "db", "queries", "crud", "create_stock.sql"),
                                                {encoding : "UTF-8"});

/* define a route for stock CREATE */
ingredientRouter.post("/:ingredient_id/stock", ( req, res ) => {
    db.execute(create_stock_sql, [req.body.expiration, req.body.brand, req.body.price, req.params.ingredient_id], (error, results) => {
        if (error)
            res.status(500).send(error); /* sends an internal server error if something goes wrong */
        else {
            /* results.insertId has the primary key (id) of the newly inserted element */
            res.redirect(`/inventory/ingredient/${req.params.ingredient_id}`);
        }
    });
});



const delete_ingredient_sql = fs.readFileSync(path.join(__dirname, 
                                                "..", "db", "queries", "crud", "delete_ingredient.sql"),
                                                {encoding : "UTF-8"});

const delete_ingredient_stock_sql = fs.readFileSync(path.join(__dirname, 
                                                "..", "db", "queries", "crud", "delete_ingredient_stock.sql"),
                                                {encoding : "UTF-8"});

/* define a route for ingredient DELETE */
ingredientRouter.get("/:id/delete", ( req, res ) => {
    db.execute(delete_ingredient_stock_sql, [req.params.id], (error, results1) => {
        if (error)
            res.status(500).send(error); /* sends an internal server error if something goes wrong */
        else {
            db.execute(delete_ingredient_sql, [req.params.id, req.oidc.user.sub], (error, results2) => {
                if (error)
                    res.status(500).send(error); /* sends an internal server error if something goes wrong */
                else {
                    res.redirect("/inventory");
                }
            });
        }
    });
});


const delete_stock_sql = fs.readFileSync(path.join(__dirname, 
                                                "..", "db", "queries", "crud", "delete_stock.sql"),
                                                {encoding : "UTF-8"});

/* define a route for stock DELETE */
ingredientRouter.get("/:ingredient_id/stock/:id/delete", ( req, res ) => {
    db.execute(delete_stock_sql, [req.params.id], (error, results1) => {
        if (error)
            res.status(500).send(error); /* sends an internal server error if something goes wrong */
        else {
            res.redirect(`/inventory/ingredient/${req.params.ingredient_id}`);
        }
    });
});



const update_ingredient_sql = fs.readFileSync(path.join(__dirname, 
                                                "..", "db", "queries", "crud", "update_ingredient.sql"),
                                                {encoding : "UTF-8"});

/* define a route for ingredient UPDATE */
ingredientRouter.post("/:id", ( req, res ) => {
    db.execute(update_ingredient_sql, [req.body.name, req.body.currentQuantity, req.body.purchaseQuantity, req.body.description, req.params.id, req.oidc.user.sub], (error, results) => {
        if (error)
            res.status(500).send(error); //Internal Server Error
        else {
            res.redirect(`/inventory/ingredient/${req.params.id}`);
        }
    });
});


const update_stock_sql = fs.readFileSync(path.join(__dirname, 
                                                "..", "db", "queries", "crud", "update_stock.sql"),
                                                {encoding : "UTF-8"});

/* define a route for stock UPDATE */
ingredientRouter.post("/:id/stock/:ingredient_id", ( req, res ) => {
    db.execute(update_stock_sql, [req.body.expiration, req.body.brand, req.body.price, req.params.ingredient_id], (error, results) => {
        if (error)
            res.status(500).send(error); //Internal Server Error
        else {
            res.redirect(`/inventory/ingredient/${req.params.id}/stock/${req.params.ingredient_id}`);
        }
    });
});

module.exports = ingredientRouter; 