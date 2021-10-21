'use strict';
require('dotenv').config();
const express = require('express');
const session = require('express-session');
const passport = require('passport'); 
const myDB = require('./connection');
const fccTesting = require('./freeCodeCamp/fcctesting.js');
const ObjectID = require('mongodb').ObjectID;
const LocalStrategy = require('passport-local');

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

app.use(passport.initialize());
app.use(passport.session());

// --------------- Authenticator Function ---------------

function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect('/');
};

// --------------------- CONNECT DB ---------------------
myDB(async client => {
  const myDataBase = await client.db('database').collection('users');

  passport.use(new LocalStrategy(
    function(username, password, done) {
      myDataBase.findOne({ username: username }, function (err, user) {
        console.log('User '+ username +' attempted to log in.');
        if (err) { return done(err); }
        if (!user) { return done(null, false); }
        if (password !== user.password) { return done(null, false); }
        return done(null, user);
      });
    }
  ));

  app.route('/').get( (req, res) => {
    res.render('pug', {
      title: 'Connected to Database',
      message: 'Please login',
      showLogin: true, 
      showRegistration: true, 
    });
  });

  app.route('/login').post(passport.authenticate(
    'local',{ failureRedirect: '/' }),(req, res)=>{
      res.redirect('/profile'); 
    }
  )

  app
  .route('/profile')
  .get(ensureAuthenticated, (req,res) => {
     res.render(
       process.cwd() + '/views/pug/profile',
       {username: req.user.username}
      );
  });

  app.route('/logout')
  .get((req, res) => {
    req.logout();
    res.redirect('/');
  });

  // missing 404 
  app.use((req, res, next) => {
    res.status(404)
      .type('text')
      .send('Not Found');
  });

  app.route('/register')
  .post((req, res, next) => {
    myDataBase.findOne({ username: req.body.username }, function(err, user) {
      if (err) {
        next(err);
      } else if (user) {
        res.redirect('/');
      } else {
        myDataBase.insertOne({
          username: req.body.username,
          password: req.body.password
        },
          (err, doc) => {
            if (err) {
              res.redirect('/');
            } else {
              // The inserted document is held within
              // the ops property of the doc
              next(null, doc.ops[0]);
            }
          }
        )
      }
    })
  },
  passport.authenticate('local', { failureRedirect: '/' }),
    (req, res, next) => {
      res.redirect('/profile');
    }
  );

  // Serialization
  // _id
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
// ------------------------------------------------------

// app.listen

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log('Listening on port ' + PORT);
});
