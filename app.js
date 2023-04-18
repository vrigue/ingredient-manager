/* set up the server */
const express = require( "express" );
const logger = require("morgan");
const app = express();
const port = process.env.PORT || 8080;
const db = require("./db/db_pool");
const helmet = require("helmet");
const { auth } = require('express-openid-connect');
const { requiresAuth } = require('express-openid-connect');
const dotenv = require('dotenv');
dotenv.config();

app.set( "views",  __dirname + "/views");
app.set( "view engine", "ejs" );

// configure Express to use certain HTTP headers for security
// explicitly set the CSP to allow certain sources
app.use( helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", 'cdnjs.cloudflare.com']
      }
    }
  })); 

const config = {
    authRequired: false,
    auth0Logout: true,
    secret: process.env.AUTH0_SECRET,
    baseURL: process.env.AUTH0_BASE_URL,
    clientID: process.env.AUTH0_CLIENT_ID,
    issuerBaseURL: process.env.AUTH0_ISSUER_BASE_URL
  };

/* auth router attaches /login, /logout, and /callback routes to the baseURL */
app.use(auth(config));

/* define middleware that logs all incoming requests */
app.use(logger("dev"));

/* define middleware that serves static resources in the public directory */
app.use(express.static(__dirname + '/public'));

// configure Express to parse URL-encoded POST request bodies (traditional forms)
app.use( express.urlencoded({ extended: false }) );

app.use((req, res, next) => {
    res.locals.isLoggedIn = req.oidc.isAuthenticated();
    res.locals.user = req.oidc.user;
    next();
})

/* define a route for the default home page */
app.get( "/", ( req, res ) => {
    res.render("index");
});

/* req.isAuthenticated is provided from the auth router */
app.get('/authtest', (req, res) => {
    res.send(req.oidc.isAuthenticated() ? 'Logged in' : 'Logged out');
});

/* causes all route handlers below to require AUTHENTICATION*/
app.use(requiresAuth());

app.get('/profile', (req, res) => {
    res.send(JSON.stringify(req.oidc.user));
});

const read_ingredient_all_sql = `
SELECT
    id, item, quantity, purchaseQuantity, description
FROM
    ingredient
WHERE
    userid = ?;
`

/* define a route for the inventory page */
app.get( "/inventory", ( req, res ) => {
    db.execute(read_ingredient_all_sql, [req.oidc.user.email], (error, results) => {
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
        id = ?
    AND
        userid = ?;
`

const read_ingredient_all_stock_sql = `
    SELECT
        id, ingredient_id, DATE_FORMAT(expiration_date, "%W, %M %e, %Y") AS expiration_date, brand_name, price
    FROM
        stock
    WHERE 
        ingredient_id = ?;
`

/* define a route for the ingredient detail page */
app.get( "/inventory/ingredient/:id", ( req, res ) => {
    db.execute(read_ingredient_sql, [req.params.id, req.oidc.user.email], (error, results1) => {
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

const read_ingredient_stock_sql = `
    SELECT
        id, ingredient_id, DATE_FORMAT(expiration_date, "%W, %M %e, %Y") AS expiration_date, brand_name, price
    FROM
        stock
    WHERE 
        ingredient_id = ?
    AND
        id = ?;
`

/* define a route for the stock detail page */
app.get( "/inventory/ingredient/:id/stock/:ingredient_id", ( req, res ) => {
    db.execute(read_ingredient_sql, [req.params.id, req.oidc.user.email], (error, results1) => {
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


const delete_ingredient_sql = `
    DELETE 
        FROM
            ingredient
        WHERE
            id = ?
        AND
            userid = ?
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
            db.execute(delete_ingredient_sql, [req.params.id, req.oidc.user.email], (error, results2) => {
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
        (item, quantity, purchaseQuantity, userid)
    VALUES
        (?, ?, ?, ?)
`

/* define a route for ingredient CREATE */
app.post("/inventory", ( req, res ) => {
    db.execute(create_ingredient_sql, [req.body.name, req.body.currentQuantity, req.body.purchaseQuantity, req.oidc.user.email], (error, results) => {
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
    AND
        userid = ?
`
/* define a route for ingredient UPDATE */
app.post("/inventory/ingredient/:id", ( req, res ) => {
    db.execute(update_ingredient_sql, [req.body.name, req.body.currentQuantity, req.body.purchaseQuantity, req.body.description, req.params.id, req.oidc.user.email], (error, results) => {
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
app.post("/inventory/ingredient/:id/stock/:ingredient_id", ( req, res ) => {
    db.execute(update_stock_sql, [req.body.expiration, req.body.brand, req.body.price, req.params.ingredient_id], (error, results) => {
        if (error)
            res.status(500).send(error); //Internal Server Error
        else {
            res.redirect(`/inventory/ingredient/${req.params.id}/stock/${req.params.ingredient_id}`);
        }
    });
});


/* start the server */
app.listen( port, () => {
    console.log(`App server listening on ${ port }. (Go to http://localhost:${ port })` );
} );