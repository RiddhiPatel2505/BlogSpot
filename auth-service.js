const { default: mongoose } = require("mongoose")
const bcrypt = require('bcryptjs');

require("mongoose")
var Schema = mongoose.Schema
var userSchema = new Schema({
    userName: String,
    password: String,
    email: String,
    loginHistory: [{ dateTime: Date, userAgent: String }],
})

let User;

initialize = () => {
    return new Promise(function (resolve, reject) {
        let db = mongoose.createConnection("mongodb+srv://riddhi:Admin1234@senecaweb.eoefzw1.mongodb.net/?retryWrites=true&w=majority");

        db.on("error", (err) => {
            reject(err);
        });
        db.once('open', () => {
            User = db.model("user", userSchema);
            resolve();
        });
    });
}

registerUser = (userData) => {
    return new Promise(function (resolve, reject) {
        if (userData.password == userData.password2) {
            bcrypt.hash(userData.password, 10).then(function (hash) {
                userData.password = hash
                let newUser = new User(userData);
                newUser.save().then(function () {
                    resolve()
                }).catch(function (err) {
                    if (err.code == 11000) {
                        reject("Username already taken!")
                    } else {
                        reject("There was an error creating user :" + err);
                    }
                })
            })
        } else {
            reject("Passwords do not match!")
        }
    });
}

checkUser = (userData) => {
    return new Promise(function (resolve, reject) {
        User.find({ userName: userData.userName})
            .then((users) => {
                bcrypt.compare(userData.password, hash).then((result) => {
                    console.log(result)
                    if (users.length == 0) {
                        reject(`Unable to find user: ${userData.userName}`);
                    }
                    else if (result = false) {
                        reject("Wrong Password!");
                    } else {
                        // Record login history
                        const loginEntry = { dateTime: new Date().toString(), userAgent: userData.userAgent };
                        users[0].loginHistory.push(loginEntry);

                        // Update user login history in the database
                        User.updateOne({ userName: users[0].userName }, { $set: { loginHistory: users[0].loginHistory } })
                            .then((result) => {
                                if (result.modifiedCount == 1) {
                                    resolve(users)
                                } else {
                                    reject(`There was an error updating the user login history for: ${userData.userName}`);
                                }
                            })
                            .catch((error) => {
                                reject(`There was an error verifying the user: ${error}`);
                            });
                    }
                });

            })
            .catch((error) => {
                reject(`Unable to find user: ${userData.userName}`);
            });
    })
}

module.exports = {
    initialize,
    registerUser,
    checkUser
}