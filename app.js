//jshint esversion:6
require("dotenv").config();
const express = require("express");
const ejs = require("ejs");
const bodyParser = require("body-parser");
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require("passport-local-mongoose")
// const md5 = require("md5");

/* BCRYPT SECTION 
const bcrypt = require("bcrypt");
//We will set the saltRounds low since high salt Rounds will make our pc work harder to make a more secure hashed password. We are just testing and have no risk if we get hacked on this so we don't need to kill our pc by doing a high number. Decent number of rounds would be 10ish
const saltRounds = 3;
*/




const app = express();




app.use(express.static('public'));
app.set('view engine','ejs');
app.use(bodyParser.urlencoded({extended:true}));

//tell the app the config for session
app.use(session({
    secret: "Our little secret.",
    resave: false,
    saveUninitialized:false
}));

//Initialize passport and initialize a session through passport
app.use(passport.initialize());
app.use(passport.session());


mongoose.connect('mongodb://localhost:27017/userDB', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

mongoose.set('useCreateIndex', true);


const userSchema = new mongoose.Schema ({
    email: String,
    password: String
});

//Plugs the papposrtLocalMonggose package into the userSchema Mongoose Object. Will handle salting and hashing
userSchema.plugin(passportLocalMongoose);

/* MOVED THIS SECRET KEY VALUE TO THE .ENV FILE */
// const secret = "Thisisourlittlesecret.";
const secret = process.env.SECRET

/******** Modifies our schema with a plugin that encrypts the password using 'secret' as the key. OLD -> REPLACED WITH HASHING
// userSchema.plugin(encrypt, {secret: secret, encryptedFields:['password']});
*******/

const User = new mongoose.model("User",userSchema);

// CHANGE: USE "createStrategy" INSTEAD OF "authenticate"
passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());






app.get("/login", function(req,res){
    res.render("login")
});

app.get("/", function (req, res) {
    res.render("home")
});

app.get("/register", function (req, res) {
    res.render("register")
});

//We add a route to '/secrets' so that if the user is authenticated in a session e will go straight to secrets.
app.get('/secrets', function(req,res){
    if(req.isAuthenticated()){
        res.render("secrets")
    }else {
        res.redirect('/login')
    };
});

app.post("/register", function(req,res){

    //Creates a User entry and saves it. Also starts a session for that user
    User.register({username: req.body.username}, req.body.password, function(err, user){
        if(err){
            console.log(err);
            res.redirect("/register");

        }else {
            //Make the user authenticated. Makes a cookie saying they are authorized
            passport.authenticate("local")(req,res,function(){
                res.redirect("secrets")
            })
        }
    })
    
});



app.get("/logout", function(req,res){

    //De-authenticates the user
    req.logout();
    res.redirect("/")


})


/* BCRYPT SECTION 
app.post("/login", function(req,res){
    const username = req.body.username;
    const password = req.body.password;


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
*/


app.post("/login", function (req, res) {
  const username = req.body.username;
  //create the user. We wont save this. We will use it to compare with Passport so we can authenticate
    const user = new User({
        username: req.body.username,
        password: req.body.password
    });

    req.login(user, function(err){
      if(err){
            console.log(err);
      }else {
              //Make the user authenticated. Makes a cookie saying they are authorized
              passport.authenticate("local")(req, res, function () {
                res.redirect("/secrets");
              });
            }
    })
  
});









app.listen(3000, function(){
    console.log("Now listening on port 3000")
});