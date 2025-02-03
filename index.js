require('./utils');

const express = require('express');
require('dotenv').config();

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

app.get('/', (req, res) => {
    if(!req.session.authenticated){
        res.render("login");
        return;
    } 

    res.render("home");
});

app.get('/login', (req, res)=> {
    res.render("login")
});

app.get('/signup', (req, res) => {
    res.render("signup");
});

app.post("/registerUser", async (req, res) =>{
    const username = req.body.username;
    const password = req.body.password

    const hashedPassword = bcrypt.hashSync(password, saltRounds);

    var success = await db_users.createUser({ user: username, hashedPassword: hashedPassword });

    // users.push({name, email, hashedPassword});

    if (!success){

        res.render("errorMessage", {error: "Failed to create user."} );
    }

    req.session.authenticated = true;
    req.session.username = username
    req.session.cookie.maxAge = expireTime;

    res.render("home", {username});
});

// Check if the user is in the database.
app.post('/verifyLogin', async (req, res) => {
    const username = req.body.username;
    const password = req.body.password;

    var results = await db_users.getUser({ user: username, hashedPassword: password });

    if (results && results.length > 0){
        if (results.length = 1){
            if (bcrypt.compareSync(password, results[0].password)) {
                req.session.authenticated = true;
                req.session.username = username;
                req.session.cookie.maxAge = expireTime;
            
                res.render("home", {username});
                return;
            } else {
                console.log("invalid password");
                res.redirect('/login');
                return;  
            }
        } else {
            console.log('invalid number of users matched: '+ results.length + " (expected 1).");
            res.redirect('/login');
            return;     
        }
    } 

    console.log('user not found');

    // User and password combination not found
    res.redirect("/login");
});

app.get('/about', (req,res) => {
	const color = req.query.color;
	
	res.send("<h1 style='color:" + color +";'>Manases Villalobos</h1>")
});

app.get('/home', (req, res) =>{
    res.send('Welcome! Come in please')
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

app.get('/logout', (req,res) => {
    req.session.destroy();
    res.redirect('/login');
});

// for images 
app.use(express.static(__dirname + "/public"))

app.get('*', (req, res) => {
    res.status(404);
    res.send('Page not found - 404')
});

app.listen(port, () =>{
    console.log(`Server is running on port ${port}`);
});