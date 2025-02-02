const express = require('express');
require('dotenv').config();

const session = require('express-session');

const app = express();
const bcrypt = require('bcrypt');
const port = process.env.PORT || 3000;
const node_session_secret = process.env.NODE_SESSION_SECRET;
const saltRounds = 12;

// To render ejs
app.set('view engine', 'ejs');
app.use(express.urlencoded({extended: false}));

app.use(session({
    secret: node_session_secret,
    saveUninitialized: false,
    resave: true
}));

const users = [];

app.get('/', (req, res) => {
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

    users.push({name, email, hashedPassword})

    res.render("home", {name, email, hashedPassword});
});

// Check if the user is in the database.
app.post('/verifyLogin', (req, res) => {
    const email = req.body.email;
    const password = req.body.password;
    var name;

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
            } else{
                console.log ("User found but incorrect password!");
                res.redirect("/login");
                return;
            }

            console.log("username: " + name)
        }
    }

    if(!foundUser){
        res.redirect("/login");
        return;
    }

    const hashedPassword = bcrypt.hashSync(password, saltRounds);

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