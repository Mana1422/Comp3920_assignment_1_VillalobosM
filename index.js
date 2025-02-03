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

app.post("/registerUser", (req, res) =>{
    const name = req.body.name;
    const email = req.body.email;
    const password = req.body.password

    const hashedPassword = bcrypt.hashSync(password, saltRounds);

    users.push({name, email, hashedPassword});

    req.session.authenticated = true;
    req.session.cookie.maxAge = expireTime;

    res.render("home", {name, email, hashedPassword});
});

// Check if the user is in the database.
app.post('/verifyLogin', (req, res) => {
    const email = req.body.email;
    const password = req.body.password;
    var name;
    var hashedPassword;

    var foundUser = false;
    console.log("There are " + users.length + " users.")

    for(let i = 0; i < users.length; i++){
        const userEmail = users[i].email;
        

        console.log("Current email: " +userEmail)
        console.log("email enterd: "+ email)

        if(userEmail === email){
            
            if(bcrypt.compareSync(password, users[i].hashedPassword)){
                foundUser = true;
                name = users[i].name
                hashedPassword = users[i].hashedPassword
                req.session.authenticated = true;
                req.session.cookie.maxAge = expireTime;
                console.log("username: " + name)
                break;
            } else{
                console.log ("User found but incorrect password!");
                res.redirect("/login");
                return;
            }
        }
    }

    if(!foundUser){
        res.redirect("/login");
        return;
    }

    res.render("home", {name, email, hashedPassword});
});

app.get('/about', (req,res) => {
	const color = req.query.color;
	
	res.send("<h1 style='color:" + color +";'>Manases Villalobos</h1>")
});

app.get('/home', (req, res) =>{
    res.send('Welcome! Come in please')
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