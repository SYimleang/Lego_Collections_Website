/********************************************************************************
* WEB322 – Assignment 03
* 
* I declare that this assignment is my own work in accordance with Seneca's
* Academic Integrity Policy:
* 
* https://www.senecacollege.ca/about/policies/academic-integrity-policy.html
* 
* Name: Sasawat Yimleang    Student ID: 114036221     Date: October 27, 2023
*
* Published URL: https://calm-gold-moose-shoe.cyclic.app 
*
********************************************************************************/

const express = require("express"); // "require" the Express module
const app = express(); // obtain the "app" object
const HTTP_PORT = process.env.PORT || 3000; // assign a port
const legoData = require("./modules/legoSets");
const path = require('path');

app.use(express.static('public'));

// Ensure that the "sets" array has been successfully built within our "legoSets" module.
app.use(async (req, res, next) => {
    try {
      await legoData.Initialize();
      next();
    } catch (error) {
      res.status(500).send("Failed to initialize Lego data.");
    }
});

// GET "/" route.
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, '/views/home.html'));
});

// GET "/about" route.
app.get("/about", (req, res) => {
    res.sendFile(path.join(__dirname, '/views/about.html'));
});

// GET "/lego/sets"
app.get("/lego/sets", (req, res) => {

    const theme = req.query.theme;

    // If there is a "theme" query parameter present, respond with Lego data for that theme
    if(theme) {
        legoData.getSetsByTheme(theme)
        .then(set => res.json(set))
        .catch(error => res.status(404).send(error).send('Lego Theme Not Found!'));
    }
    //  If there is not a "theme" query parameter present, respond with all of the unfiltered Lego data
    else {
        legoData.getAllSets()
        .then(set => res.json(set))
        .catch(error => res.status(404).send(error).send('Lego Theme Not Found!'));
    }
});

// Display JSON of req setNum
app.get("/lego/sets/:setNum", (req, res) => {
    const setNum = req.params.setNum;

    if(setNum){
        legoData.getSetByNum(setNum)
        .then(set => res.json(set))
        .catch(error => res.status(404).send(error));
    }
    else{
        res.status(404).send('Lego Not Found!');
    }
});

// Display custom 404 page
app.get('*', (req, res) => {
    res.status(404).sendFile(path.join(__dirname, '/views/404.html'));
});

// start the server on the port and output a confirmation ot the console
app.listen(HTTP_PORT, () => console.log(`server listening on: ${HTTP_PORT}`));