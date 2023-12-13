const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

let Schema = mongoose.Schema;

// Create the user schema
let userSchema = new Schema({
    userName: {
        type: String,
        unique: true,
    },
    password: String,
    email: String,
    loginHistory: [
        {
            dateTime: { 
                type: Date, 
                default: Date.now 
            },
            userAgent: String,
        }
    ],
});

let User = mongoose.model('users', userSchema);

//=============== Functions ===============//
// Initialize the User model
function initialize() {
  return new Promise((resolve, reject) => {

    let db = mongoose.createConnection(mongodb+srv://syimleang:Framilly2706@cluster0.4dbvt86.mongodb.net/?retryWrites=true&w=majority);

    db.on('error', (err) => {
      reject(err);
    });

    db.once('open', () => {
      User = db.model('users', userSchema);
      resolve();
    });
  });
}

// RegisterUser function
function registerUser(userData){
    return new Promise((resolve, reject) => {

      // Check if passwords match
      if (userData.password !== userData.password2) {
        reject("Passwords do not match");
        return;
      }

      bcrypt.hash(userData.password, 10)
      .then((hash) => {
        // Replace the user's password with the hashed version
        userData.password = hash;

        // Create a new User from the userData
        const newUser = new User(userData);

        // Save the new user to the database
        newUser.save()
          .then(() => {
            // User successfully saved
            resolve();
          })
          .catch((err) => {

            // Check for duplicate key error (code 11000)
            if (err.code === 11000) {
              
              reject("User Name already taken");
            } else {

              // Other save operation errors
              reject(`There was an error creating the user: ${err}`);
            }
        });
      })
      .catch((err) => {
        // Error during password hashing
        reject("There was an error encrypting the password");
      });
    });
}

// checkUser function
function checkUser(userData){
    return new Promise((resolve, reject) => {

      // Find the user in the database
      User.find({ userName: userData.userName })
          .then((users) => {

            // Check if users array is empty
            if (users.length === 0) {
                reject(`Unable to find user: ${userData.userName}`);
                return;
            }
    
            bcrypt.compare(userData.password, users[0].password)
            .then((passwordMatch) => {
              if (passwordMatch) {
      
                // Update login history
                if (users[0].loginHistory.length === 8) {
                    users[0].loginHistory.pop();
                }
        
                // Add a new entry to login history
                users[0].loginHistory.unshift({
                    dateTime: new Date().toString(),
                    userAgent: userData.userAgent,
                });
        
                // Update loginHistory in the database
                User.updateOne(
                    { userName: users[0].userName },
                    { $set: { loginHistory: users[0].loginHistory } }
                )
                .then(() => {

                  // If update was successful, resolve with the user object
                  resolve(users[0]);
                })
                .catch((err) => {

                  // If update failed, reject with an error message
                  reject(`There was an error verifying the user: ${err}`);
                });
              } else {
                reject(`Incorrect Password for user: ${userData.userName}`);
              }
            })
            .catch((err) => {

              // Error during password comparison
              reject(`There was an error verifying the user: ${err}`);
            });
        })
        .catch((err) => {

          // If find operation failed, reject with an error message
          reject(`Unable to find user: ${userData.userName}`);
        });
    });
}

module.exports = {
  User,
  initialize,
  registerUser,
  checkUser,
};
