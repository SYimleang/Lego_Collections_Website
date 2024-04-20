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

require("dotenv").config();
const Sequelize = require("sequelize");

// set up sequelize to point to our postgres database
const sequelize = new Sequelize(
  process.env.DB_DATABASE,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    dialect: "postgres",
    port: 5432,
    dialectOptions: {
      ssl: { rejectUnauthorized: false },
    },
  }
);

sequelize
  .authenticate()
  .then(() => {
    console.log("Connection has been established successfully.");
  })
  .catch((err) => {
    console.log("Unable to connect to the database:", err);
  });

const Theme = sequelize.define("Theme", {
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: Sequelize.STRING,
});

const Set = sequelize.define("Set", {
  set_num: {
    type: Sequelize.STRING,
    primaryKey: true,
  },
  name: Sequelize.STRING,
  year: Sequelize.INTEGER,
  num_parts: Sequelize.INTEGER,
  theme_id: Sequelize.INTEGER,
  img_url: Sequelize.STRING,
});

Set.belongsTo(Theme, { foreignKey: "theme_id" });

// initialize function
function initialize() {
  return new Promise(async (resolve, reject) => {
    try {
      await sequelize.sync();
      resolve();
    } catch (error) {
      reject(error);
    }
  });
}

// Returns the complete "sets" array
function getAllSets() {
  return new Promise(async (resolve, reject) => {
    try {
      const sets = await Set.findAll({ include: [Theme] });
      resolve(sets);
    } catch (error) {
      reject("No sets available.");
    }
  });
}

// Return a specific "set" object from the "sets" array.
function getSetByNum(setNum) {
  return new Promise((resolve, reject) => {
    Set.findOne({ include: [Theme], where: { set_num: setNum } }).then(
      (set) => {
        if (set) {
          resolve(set);
        } else {
          reject("Unable to find requested set.");
        }
      }
    );
  });
}

// Return an array of objects from the "sets" array whose "theme" value matches the "theme" parameter
function getSetsByTheme(theme) {
  return new Promise((resolve, reject) => {
    Set.findAll({
      include: [Theme],
      where: {
        "$Theme.name$": {
          [Sequelize.Op.iLike]: `%${theme}%`,
        },
      },
    }).then((sets) => {
      if (sets.length > 0) {
        resolve(sets);
      } else {
        reject("Unable to find requested sets.");
      }
    });
  });
}

// Add a function to add a new set
function addSet(setData) {
  return new Promise((resolve, reject) => {
    Set.create(setData)
      .then(() => {
        resolve();
      })
      .catch((err) => {
        reject(`Unable to create set: ${err.errors[0].message}`);
      });
  });
}

// Get all the themes from the database
function getAllThemes() {
  return new Promise((resolve, reject) => {
    Theme.findAll()
      .then((themes) => resolve(themes))
      .catch((err) => {
        reject(
          `Unable to get sets from the database: ${err.errors[0].message}`
        );
      });
  });
}

// Edit set function, edit from received "set_num" and "setData"
function editSet(set_num, setData) {
  return new Promise((resolve, reject) => {
    Set.update(setData, {
      where: { set_num: set_num },
    })
      .then(([rowsUpdated]) => {
        if (rowsUpdated > 0) {
          resolve();
        } else {
          reject(new Error("Unable to find requested set."));
        }
      })
      .catch((err) => {
        reject(`Unable to update set: ${err.errors[0].message}`);
      });
  });
}

// Delete set function. Delete from received "set_num"
function deleteSet(set_num) {
  return new Promise((resolve, reject) => {
    Set.destroy({
      where: { set_num: set_num },
    })
      .then(() => {
        resolve();
      })
      .catch((err) => {
        reject(`Unable to delete set: ${err.errors[0].message}`);
      });
  });
}

// Exports all functions.
module.exports = {
  initialize,
  getAllSets,
  getSetByNum,
  getSetsByTheme,
  addSet,
  getAllThemes,
  editSet,
  deleteSet,
};
