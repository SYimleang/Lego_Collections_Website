/********************************************************************************

* WEB322 – Assignment 06
* 
* I declare that this assignment is my own work in accordance with Seneca's
* Academic Integrity Policy:
* 
* https://www.senecacollege.ca/about/policies/academic-integrity-policy.html
* 
* Name: Sasawat Yimleang Student ID: 114036221 Date: December 13, 2023
*
* Published URL: https://calm-gold-moose-shoe.cyclic.app
*
********************************************************************************/

const HTTP_PORT = process.env.PORT || 3000; // assign a port
const express = require("express"); // "require" the Express module
const bodyParser = require('body-parser');
const path = require('path');
const Sequelize = require('sequelize');
const mongoose = require('mongoose');
const clientSessions = require('client-sessions');
require('dotenv').config();

const legoData = require("./modules/legoSets");
const authData = require('./modules/auth-service');

const app = express(); // obtain the "app" object
app.use(bodyParser.urlencoded({ extended: true })); // using urlencoded form data

app.use(
    clientSessions({
        cookieName: 'session',
        secret: 'u9fkFndPJBe934KIj932FadUIf',
        duration: 5 * 60 * 1000, // Session duration in milliseconds (5 minutes)
        activeDuration: 1000 * 60, // The session will be extended by this many ms each request (1 minutes)
    })
);

app.use((req, res, next) => {
    res.locals.session = req.session;
    next();
});

function ensureLogin(req, res, next) {
    if (!req.session.user) {
      res.redirect('/login');
    } else {
      next();
    }
  }



authData.initialize(); 

// set up sequelize to point to our postgres database
const sequelize = new Sequelize(
    'SenecaDB', 
    'SYimleang', 
    'ET0qngXaA4vH', {
        host: 'ep-yellow-salad-27925306-pooler.us-east-2.aws.neon.tech',
        dialect: 'postgres',
        port: 5432,
        dialectOptions: {
        ssl: { rejectUnauthorized: false },
        },
  });
  
  sequelize
    .authenticate()
    .then(() => {
      console.log('Connection has been established successfully.');
    })
    .catch((err) => {
      console.log('Unable to connect to the database:', err);
    });

// Set EJS as the view engine
app.set('view engine', 'ejs');

// Set the views directory (where your EJS templates are located)
app.set("views", path.join(__dirname, "views"));

app.use(express.static('public'));

// Ensure that the "sets" array has been successfully built within our "legoSets" module.
app.use(async (req, res, next) => {
    try {
      await legoData.initialize();
      next();
    } catch (error) {
      res.status(500).send("Failed to initialize Lego data.");
    }
});

//===== ROUTE =====//
// GET "/" route.
app.get("/", (req, res) => {
    res.render('home');
});

// GET "/about" route.
app.get("/about", (req, res) => {
    res.render('about');
});

// GET "/lego/sets"
app.get("/lego/sets", (req, res) => {

    const theme = req.query.theme;

    // If there is a "theme" query parameter present, respond with Lego data for that theme
    if(theme) {
        legoData.getSetsByTheme(theme)
        .then(sets => {
            res.render("sets", { sets: sets });
        })
        .catch(error => {
            res.status(500).render("500", { message: "Lego Theme Not Found!" });
        });
    }
    //  If there is not a "theme" query parameter present, respond with all of the unfiltered Lego data 
    else {
        legoData.getAllSets()
        .then(sets => {
            res.render("sets", { sets: sets });
        })
        .catch(error => {
            res.status(500).render("500", { message: "Unable to find sets." });
        });
    }
});

// Display content of req setNum
app.get("/lego/sets/:setNum", (req, res) => {
    const setNum = req.params.setNum;
    legoData.getSetByNum(setNum)
    .then(set => {res.render("set", { set });})
    .catch(error => {
        res.status(500).render("500", { message: "Lego Set Not Found!" });
    });
});

// GET "/lego/addSet"
app.get('/lego/addSet', ensureLogin, async (req, res) => {
    legoData.getAllThemes()
    .then(themes => {
      res.render('addSet', { themes });
    })
    .catch(err => {
      res.render('500', { message: `I'm sorry, but we have encountered the following error: ${err}` });
    });
});

// POST "/lego/addSet"
app.post('/lego/addSet', ensureLogin, (req, res) => {
    legoData.addSet(req.body)
      .then(() => {
        res.redirect('/lego/sets');
      })
      .catch(err => {
        res.render('500', { message: `I'm sorry, but we have encountered the following error: ${err}` });
      });
});

// GET "/lego/editSet/:num"
app.get('/lego/editSet/:num', ensureLogin, (req, res) => {
    legoData.getSetByNum(req.params.num)
        .then(set => {
            legoData.getAllThemes()
                .then(themes => {
                    res.render('editSet', { set, themes });
                })
                .catch(err => {
                    res.status(404).render("404", { message: err });
                });
        })
        .catch(err => {
            res.status(404).render("404", { message: err });
        });
});

// POST "/lego/editSet"
app.post('/lego/editSet', ensureLogin, (req, res) => {
    legoData.editSet(req.body.set_num, req.body)
    .then(() => {
        res.redirect('/lego/sets');
    })
    .catch(err => {
        res.render('500', { message: `I'm sorry, but we have encountered the following error: ${err}` });
    });
});

// GET "/lego/deleteSet/:num"
app.get('/lego/deleteSet/:num', ensureLogin, (req, res) => {
    legoData.deleteSet(req.params.num)
    .then(() => {
        res.redirect('/lego/sets');
    })
    .catch(err => {
        res.render("500", { message: `I'm sorry, but we have encountered the following error: ${err}` });
    })
});


//===== User ROUTE =====//
// GET login route
app.get('/login', (req, res) => {
    res.render('login', {errorMessage: null});
});

// GET register route
app.get('/register', (req, res) => {
    res.render('register', { successMessage: null , errorMessage: null});
});

// POST login route
app.post('/login', (req, res) => {
    req.body.userAgent = req.get('User-Agent');
  
    authData.checkUser(req.body)
      .then((user) => {
        req.session.user = {
          userName: user.userName,
          email: user.email,
          loginHistory: user.loginHistory,
        };
        res.redirect('/lego/sets');
      })
      .catch((err) => {
        res.render('login', { errorMessage: err, userName: req.body.userName });
      });
});

// POST register route
app.post('/register', (req, res) => {
    authData.registerUser(req.body)
    .then(() => {
        res.render('register', { successMessage: 'User created', errorMessage: null});
    })
    .catch((err) => {
        res.render('register', { errorMessage: err, successMessage: null, userName: req.body.userName });
    });
});

// GET logout route
app.get('/logout', (req, res) => {
    req.session.reset();
    res.redirect('/');
});

// GET userHistory route
app.get('/userHistory', ensureLogin, (req, res) => {
    // Retrieve user history logic here
    res.render('userHistory');
});


// Display custom 404 page
app.get('*', (req, res) => {
    res.status(404).render("404", {message: "I'm sorry, we're unable to find what you're looking for"});
});

// start the server on the port and output a confirmation ot the console
//app.listen(HTTP_PORT, () => console.log(`server listening on: ${HTTP_PORT}`));

legoData.initialize()
  .then(authData.initialize)
  .then(() => {
    // Start the server after both legoData and authData are initialized
    app.listen(HTTP_PORT, () => {
      console.log(`app listening on: ${HTTP_PORT}`);
    });
  })
  .catch((err) => {
    console.log(`unable to start server: ${err}`);
  });
