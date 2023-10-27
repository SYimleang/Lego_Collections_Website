/********************************************************************************
* WEB322 – Assignment 02
* 
* I declare that this assignment is my own work in accordance with Seneca's
* Academic Integrity Policy:
* 
* https://www.senecacollege.ca/about/policies/academic-integrity-policy.html
* 
* Name: Sasawat Yimleang Student ID: 114036221 Date: October 8, 2023
*
********************************************************************************/

const setData = require("../data/setData");
const themeData = require("../data/themeData")

let sets = [];

// initialize function
function Initialize() {
    return new Promise((resolve, reject) => {
        try {
            sets = setData.map(set => {
                const theme_id = set.theme_id;
                const theme = themeData.find(theme => theme.id === theme_id).name;
                return {
                    ...set,
                    theme
                };
            });
            resolve();
        }
        catch (error) {
            reject (error);
        }
    })
    
}

// Returns the complete "sets" array
function getAllSets() {
    return new Promise((resolve, reject) => {
        try {
            if (sets.length > 0)
                resolve(sets);
        }
        catch (error) {
            reject("No sets available.")
        }
    });
}

// Return a specific "set" object from the "sets" array.
function getSetByNum(setNum) {
    return new Promise((resolve, reject) => {
        const set = sets.find(set => set.set_num === setNum);
        if (set)
            resolve(set);
        else
            reject("Unable to find requested set.")
    });
}

// Return an array of objects from the "sets" array whose "theme" value matches the "theme" parameter
function getSetsByTheme(theme) {
    return new Promise((resolve, reject) => {
        const findTheme = theme.toUpperCase();
        const matchedSets = sets.filter(set => set.theme.toUpperCase().includes(findTheme));
        
        if (matchedSets.length > 0)
            resolve(matchedSets);
        else
            reject("Unable to find requested sets");
    });
}

// Exports all functions.
module.exports = {Initialize, getAllSets, getSetByNum, getSetsByTheme};

// Test
//Initialize();
//getAllSets();
//getSetByNum("70317-1");
//getSetsByTheme("Constraction");