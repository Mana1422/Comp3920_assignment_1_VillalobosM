require('./utils');

const express = require('express');
require('dotenv').config({ path: '../.env' });

const app = express();
const bcrypt = require('bcrypt');

const session = require('express-session');
const MongoStore = require('connect-mongo');
const port = process.env.PORT || 3000;

const saltRounds = 12;
const expireTime = 60 * 60 * 1000; //expires after 1 hour  (minutes * seconds * millis)
const node_session_secret = process.env.NODE_SESSION_SECRET;

const database = include('databaseConnection');
const db_utils = include('database/db_utils');
const db_users = include('database/users');
const success = db_utils.printMySQLVersion();

// To render ejs
app.set('view engine', 'ejs');
app.use(express.urlencoded({extended: false}));

const users = [];

/* secret information section */
const mongodb_user = process.env.MONGODB_USER;
const mongodb_password = process.env.MONGODB_PASSWORD;
const mongodb_host = process.env.MONGODB_HOST;
const mongodb_database = process.env.MONGODB_DATABASE;
const mongodb_session_secret = process.env.MONGODB_SESSION_SECRET;

var mongoStore = MongoStore.create({
    mongoUrl: `mongodb+srv://${mongodb_user}:${mongodb_password}@${mongodb_host}/${mongodb_database}`,
    crypto: {
        secret: mongodb_session_secret
    }
});

app.use(session({ 
    secret: node_session_secret,
	store: mongoStore, //default is memory store 
	saveUninitialized: false, 
	resave: true
}
));

// main page depends whether the user has a valid session
app.get('/', (req, res) => {
    if(!req.session.authenticated){
        // If there is no valid session
        // then redirect to main page
        res.render("main");
        return;
    } 

    const username = req.session.username;

    res.render("home", {username});
});

app.get('/login', (req, res)=> {
    if(req.session.authenticated){
        const username = req.session.username;
        
        res.redirect("/");
        return;
    }

    res.render("login")
});

app.get('/signup', (req, res) => {
    if(req.session.authenticated){    
        res.redirect("/");
        return;
    }

    res.render("signup");
});

// To add new user to the database
app.post("/registerUser", async (req, res) =>{
    // Variables coming from the form in sign up page
    const username = req.body.username;
    const password = req.body.password;

    if(username.length == 0 && password.length == 0){
        res.render("errorMessage", {error: "Username or password can't be empty!."});
        return;
    }

    // to hashed the password using bycript
    const hashedPassword = bcrypt.hashSync(password, saltRounds);

    // To store the users in the database
    var success = await db_users.createUser({ user: username, hashedPassword: hashedPassword });

    // If something went wrong display feedback
    if (!success){
        res.render("errorMessage", {error: "Failed to create user."} );
    }

    // Create the session
    req.session.authenticated = true;
    // Record the username
    req.session.username = username
    // Set the expire time for the session
    req.session.cookie.maxAge = expireTime;

    res.redirect("/");
});

// Check if the user is in the database.
app.post('/verifyLogin', async (req, res) => {
    // Variables coming from the form in the login page
    const username = req.body.username;
    const password = req.body.password;

    // search the user in the database
    // var results = await db_users.getUser({ user: username, hashedPassword: password });
    var results = await db_users.getUser({ user: username });

    // Check the results database
    if (results && results.length > 0){
        // Check if there are more than one user with same username
        if (results.length = 1){

            // Compare the password
            if (bcrypt.compareSync(password, results[0].password)) {
                req.session.authenticated = true;
                req.session.username = username;
                req.session.cookie.maxAge = expireTime;
            
                res.redirect("/");
                return;
            } else {
                // Password did not match
                console.log("invalid password");
                res.redirect('/');
                return;  
            }
        } else {
            // There are more than one user with same username
            console.log('invalid number of users matched: '+ results.length + " (expected 1).");
            res.redirect('/login');
            return;     
        }
    } 

    console.log('user not found');

    // User and password combination not found
    res.redirect("/");
});

app.get('/home', (req, res) =>{
    if(req.session.authenticated){
        const username = req.session.username;
        res.render("home", {username});
        return;
    }

    res.redirect("/");
});

app.get('/createTables', async (req,res) => {

    const create_tables = include('database/create_tables.js');

    var success = create_tables.createTables();
    if (success) {
        res.render("successMessage", {message: "Created tables."} );
    }
    else {
        res.render("errorMessage", {error: "Failed to create tables."} );
    }
});

app.get('/showUsers', async (req,res) => {
    usersList = await db_users.getUsers(1);


    res.render("showUsers", {usersList});
});

app.get('/logout', (req,res) => {
    // end the session
    req.session.destroy();
    res.redirect('/');
});

// for images 
app.use(express.static(__dirname + "/public"))

// Catch all not found pages
app.get('*', (req, res) => {
    res.status(404);
    res.send('Page not found - 404')
});

app.listen(port, () =>{
    console.log(`Server is running on port ${port}`);
});