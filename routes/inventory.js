const express = require("express");
const db = require("../db/db_pool");
const fs = require("fs");
const path = require("path");

let inventoryRouter = express.Router();

const read_ingredient_all_sql = fs.readFileSync(path.join(__dirname, 
                                                "..", "db", "queries", "crud", "read_ingredient_all.sql"),
                                                {encoding : "UTF-8"});

/* define a route for the inventory page */
inventoryRouter.get( "/", ( req, res ) => {
    db.execute(read_ingredient_all_sql, [req.oidc.user.sub], (error, results) => {
        if (error) {
            res.status(500).send(error); /* sends an internal server error if something goes wrong */
        } else {
            res.render("inventory", {ingredient : results});
        }
    });
});

const create_ingredient_sql = fs.readFileSync(path.join(__dirname, 
                                                "..", "db", "queries", "crud", "create_ingredient.sql"),
                                                {encoding : "UTF-8"});

/* define a route for ingredient CREATE */
inventoryRouter.post("/", ( req, res ) => {
    db.execute(create_ingredient_sql, [req.body.name, req.body.currentQuantity, req.body.purchaseQuantity, req.oidc.user.sub], (error, results) => {
        if (error)
            res.status(500).send(error); /* sends an internal server error if something goes wrong */
        else {
            /* results.insertId has the primary key (id) of the newly inserted element */
            res.redirect(`/inventory/ingredient/${results.insertId}`);
        }
    });
});

module.exports = inventoryRouter; 