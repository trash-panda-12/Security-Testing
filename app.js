//jshint esversion:6
require("dotenv").config();
const express = require("express");
const ejs = require("ejs");
const bodyParser = require("body-parser");
const mongoose = require('mongoose');
// const md5 = require("md5");
const bcrypt = require("bcrypt");
//We will set the saltRounds low since high salt Rounds will make our pc work harder to make a more secure hashed password. We are just testing and have no risk if we get hacked on this so we don't need to kill our pc by doing a high number. Decent number of rounds would be 10ish
const saltRounds = 3;



const app = express();




app.use(express.static('public'));
app.set('view engine','ejs');
app.use(bodyParser.urlencoded({extended:true}));


mongoose.connect('mongodb://localhost:27017/userDB', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

const userSchema = new mongoose.Schema ({
    email: String,
    password: String
});

/* MOVED THIS SECRET KEY VALUE TO THE .ENV FILE */
// const secret = "Thisisourlittlesecret.";
const secret = process.env.SECRET

//Modifies our schema with a plugin that encrypts the password using 'secret' as the key. OLD -> REPLACED WITH HASHING
// userSchema.plugin(encrypt, {secret: secret, encryptedFields:['password']});

const User = new mongoose.model("User",userSchema);






app.get("/login", function(req,res){
    res.render("login")
});

app.get("/", function (req, res) {
    res.render("home")
});

app.get("/register", function (req, res) {
    res.render("register")
});

app.post("/register", function(req,res){
    
    //Hash the password and in the callback of the hashing funciton, declare the new document 'User' and save it to the database
    bcrypt.hash(req.body.password, saltRounds, function(err,hashedPassword){

        const newUser = new User({
            email: req.body.username,
            password: hashedPassword
        });

        newUser.save(function (err) {
          if (err) {
            console.log(err);
          } else {
            res.render("secrets");
          }
        });
    });
    
});

app.post("/login", function(req,res){
    const username = req.body.username;
    const password = md5(req.body.password);


    User.findOne({email:username}, function(err, foundUser){
        if(err){
            console.log(err)
        }else {
            //Checks if password given matches password on the database
            if(foundUser) {
                bcrypt.compare(password, foundUser.password, function(err, result){
                    if(err){
                        console.log(err);
                        res.render(err);
                    }else if (result === true){
                        res.render("secrets")
                    }
                })
            };
        };
    });
})









app.listen(3000, function(){
    console.log("Now listening on port 3000")
});