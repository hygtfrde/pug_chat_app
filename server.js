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

myDB(async client => {
  const myDataBase = await client.db('database').collection('users');

  app.route('/').get( (req, res) => {
    res.render('pug', {
      title: 'Connected to Database',
      message: 'Please login'
    });
  });

  // Serialization
  passport.serializeUser( (user, done)=>{
    done(null, user._id); 
  });
  // Deserialization
  passport.deserializeUser( (id, done)=>{
    myDataBase.findOne( ({_id: new ObjectID(id)}), (error, doc)=>{
      done(null, doc); 
    })
  });

}).catch(e => {
  app.route('/').get((req, res) => {
    res.render('pug', { title: e, message: 'Unable to login' });
  });
});
// app.listen

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log('Listening on port ' + PORT);
});
