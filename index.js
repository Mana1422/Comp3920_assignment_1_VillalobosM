const express = require('express');
require('dotenv').config();


const app = express();
const port = process.env.PORT || 3000;

// app.use(session({
//     secret: node_session_secret,
//     saveUninitialized: false,
//     resave: true
// }));

app.get('/', (req, res) => {
    res.send('Hello World!');
});

app.get('/home', (req, res) =>{
    res.send('Welcome! Come in please')
});

app.get('/*', (req, res) => {
    res.send('404 Page not found')
    res.status(404);
});

app.listen(port, () =>{
    console.log(`Server is running on port ${port}`);
});