/********************************************************************************

* WEB322 – Assignment 04
* 
* I declare that this assignment is my own work in accordance with Seneca's
* Academic Integrity Policy:
* 
* https://www.senecacollege.ca/about/policies/academic-integrity-policy.html
* 
* Name: Sasawat Yimleang Student ID: 114036221 Date: November 7, 2023
*
* Published URL: https://calm-gold-moose-shoe.cyclic.app
*
********************************************************************************/

const express = require("express"); // "require" the Express module
const app = express(); // obtain the "app" object
const HTTP_PORT = process.env.PORT || 3000; // assign a port
const legoSets = require("./modules/legoSets");
const path = require('path');

// Set EJS as the view engine
app.set('view engine', 'ejs');

// Set the views directory (where your EJS templates are located)
app.set("views", path.join(__dirname, "views"));

app.use(express.static('public'));

// Ensure that the "sets" array has been successfully built within our "legoSets" module.
app.use(async (req, res, next) => {
    try {
      await legoSets.Initialize();
      next();
    } catch (error) {
      res.status(500).send("Failed to initialize Lego data.");
    }
});

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
        legoSets.getSetsByTheme(theme)
        .then(sets => {
            res.render("sets", { sets: sets });
        })
        .catch(error => {
            res.status(404).render("404", { message: "Lego Theme Not Found!" });
        });
    }
    //  If there is not a "theme" query parameter present, respond with all of the unfiltered Lego data 
    else {
        legoSets.getAllSets()
        .then(sets => {
            res.render("sets", { sets: sets });
        })
        .catch(error => {
            res.status(404).render("404", { message: "Unable to find sets." });
        });
    }
});

// Display JSON of req setNum
app.get("/lego/sets/:setNum", (req, res) => {
    const setNum = req.params.setNum;
    legoSets.getSetByNum(setNum)
    .then(set => {res.render("set", { set });})
    .catch(error => {
        res.status(404).render("404", { message: "Lego Set Not Found!" });
    });
});

// Display custom 404 page
app.get('*', (req, res) => {
    res.status(404).render("404", {message: "I'm sorry, we're unable to find what you're looking for"});
});

// start the server on the port and output a confirmation ot the console
app.listen(HTTP_PORT, () => console.log(`server listening on: ${HTTP_PORT}`));