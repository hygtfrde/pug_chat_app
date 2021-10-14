'use strict';
require('dotenv').config();
const express = require('express');
const session = require('express-session');
const passport = require('passport'); 
const myDB = require('./connection');
const fccTesting = require('./freeCodeCamp/fcctesting.js');
const ObjectID = require('mongodb').ObjectID;

const app = express();

fccTesting(app); //For FCC testing purposes
app.use('/public', express.static(process.cwd() + '/public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(passport.initialize());
app.use(passport.session());

app.set('view engine', 'pug'); 

app.route('/').get((req, res) => {
  // pass vars to Pug as second arg 
  res.render(process.cwd()+'/views/pug', {title: 'Hello', message: 'Please login'});
});

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: true,
  saveUninitialized: true,
  cookie: { secure: false }
}));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log('Listening on port ' + PORT);
});
