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
const path = require("path");
const fs = require("fs");

app.set( "views",  path.join(__dirname, "views"));
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
app.use(express.static(path.join(__dirname, 'public')));

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

let inventoryRouter = require("./routes/inventory.js");
app.use("/inventory", requiresAuth(), inventoryRouter);

let ingredientRouter = require("./routes/ingredient.js");
app.use("/inventory/ingredient", requiresAuth(), ingredientRouter);

/* start the server */
app.listen( port, () => {
    console.log(`App server listening on ${ port }. (Go to http://localhost:${ port })` );
} );