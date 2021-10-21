'use strict';
require('dotenv').config();
const express = require('express');
const session = require('express-session');
const myDB = require('./connection');
const fccTesting = require('./freeCodeCamp/fcctesting.js');
const ObjectID = require('mongodb').ObjectID;

const routes = require('./routes.js');
const auth = require('./auth.js'); 

const app = express();
app.set('view engine', 'pug'); 

fccTesting(app); //For FCC testing purposes
app.use('/public', express.static(process.cwd() + '/public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* ------- remove basic GET route -------
app.route('/').get((req, res) => {
  // pass vars to Pug as second arg 
  res.render(process.cwd()+'/views/pug', {title: 'Hello', message: 'Please login'});
}); -------------------------------------
*/

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: true,
  saveUninitialized: true,
  cookie: { secure: false }
}));


// --------------------- CONNECT DB ---------------------
myDB(async client => {
  const myDataBase = await client.db('database').collection('users');

  routes(app, myDataBase);
  auth(app, myDataBase); 

}).catch(e => {
  app.route('/').get((req, res) => {
    res.render('pug', { title: e, message: 'Unable to login' });
  });
});
// ------------------------------------------------------

// app.listen

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log('Listening on port ' + PORT);
});
