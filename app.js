//jshint esversion:6
require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const _= require("lodash");
const session = require('express-session');
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require("mongoose-findorcreate");


const homeStartingContent = "Traveling is an extraordinary experience every person needs to try. It reveals a whole new and exciting world out there, opens out your inner strength, and presents with unforgettable adventures. Read an example of essay about traveling to learn more and get inspired. It’s a great, big world out there with billions and billions of people, who each day live their life and have their own unique experiences.Traveling gets a person out of their comfort zone, away from all their ordinary pleasures and comforts and way of doing things.";
const aboutContent = "HI, I AM SOMYA GUPTA. I MADE THIS WEBSITE BECAUSE IT IS MY DAMN PROJECT.";
const contactContent = "THANKS FOR VISITING THIS BLOG AND MAKING YOUR BEAUTIFUL CONTRIBUTION.";

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

app.use(session({
  secret:"Our blog post",
  resave: false,
  saveUninitialized: false

}));

app.use(passport.initialize());
app.use(passport.session());


mongoose.connect("mongodb+srv://admin-somya:test123@cluster0-74sut.mongodb.net/blogDB", {useNewUrlParser: true , useUnifiedTopology: true,});
mongoose.set('useCreateIndex', true);

const postSchema = new mongoose.Schema ({
  email: String,
  password: String,
  googleId: String,
  title: String,
  content: String
});

postSchema.plugin(passportLocalMongoose);
postSchema.plugin(findOrCreate);

const Post = mongoose.model("Post", postSchema);

passport.use(Post.createStrategy());

passport.serializeUser(function(post, done){
  done(null, post.id);
});
passport.deserializeUser(function(id, done){
  Post.findById(id, function(err, post){
    done(err, post);
  });
});


passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/blog",
    userProfileURL:"https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, cb) {
    console.log(profile);
    Post.findOrCreate({ googleId: profile.id }, function (err, post) {
      return cb(err, post);
    });
  }
));


app.get("/", function(req,res){
  Post.find({}, function(err, posts){
res.render("home", {
  startingContent: homeStartingContent,
posts:posts
});

});
});

app.get("/auth/google",
  passport.authenticate("google", { scope: ["profile"] }));

  app.get("/auth/google/blog",
    passport.authenticate("google", { failureRedirect: "/login" }),
    function(req, res) {
      // Successful authentication, redirect home.
      res.redirect("/compose");
    });

app.get("/compose", function(req,res){
if(req.isAuthenticated()){
res.render("compose");
} else{
res.redirect("/login");
  }
});


//app.get("/compose", function(req, res){
  //Post.find({"title": {$ne: null}}, function(err, foundUsers){
    //if (err){
      //console.log(err);
    //} else {
      //if (foundUsers) {
        //res.render("home", {postsWithTitles: foundUsers});
      //}
    //}
  //});
//});


//app.post("/compose", function(req,res){
//const post = new Post ({
  //  title: req.body.posTitle,
    //content: req.body.postBody
  //});
  //post.save(function(err){
    //if (!err){

    //res.redirect("/");

  //}
  //});

//});



app.post("/compose", function(req, res){
  const submittedTitle = req.body.title;
  const submittedContent = req.body.content;

//Once the user is authenticated and their session gets saved, their user details are saved to req.user.
//  console.log(req.user.id);

  Post.findById(req.user.id, function(err, foundPost){
    if (err) {
      console.log(err);
    } else {
      if (foundPost) {
        foundPost.title = submittedTitle;
        foundPost.content = submittedContent;
        foundPost.save(function(){
          res.redirect("/");
        });
      }
    }
  });
});



app.get("/posts/:postId", function(req, res){

const requestedPostId = req.params.postId;

  Post.findOne({_id: requestedPostId}, function(err, post){
    res.render("post", {
      title: post.title,
      content: post.content
    });
  });

});

app.get("/about", function(req,res){
  res.render("about", {aboutContent: aboutContent});
});

app.get("/contact", function(req,res){
  res.render("contact", {contactContent: contactContent});
});

app.get("/fun", function(req,res){
  res.render("fun");
});

app.get("/register", function(req,res){
  res.render("register");
});

app.get("/login", function(req,res){
  res.render("login");
});

app.post("/register", function(req, res){
Post.register({username: req.body.username}, req.body.password, function(err, post){
  if(err){
    console.log(err);
    res.redirect("/register");
  } else {
    passport.authenticate("local")(req, res, function(){
      res.redirect("/compose");
    });
  }
});

});

app.post("/login", function(req, res){
const post = new Post({
  username: req.body.username,
  password: req.body.password
});
req.login(post, function(err){
  if(err){
    console.log(err);
  }else{
    passport.authenticate("local")(req, res, function(){
      res.redirect("/compose");
    });
  }
});

});


let port = process.env.PORT;
if(port == null || port == ""){
  port = 3000;
}



app.listen(port, function() {
  console.log("Server started on port successfully");
});
