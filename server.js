/*********************************************************************************
*  WEB322 – Assignment 02
*  I declare that this assignment is my own work in accordance with Seneca  Academic Policy.  No part *  of this assignment has been copied manually or electronically from any other source 
*  (including 3rd party web sites) or distributed to other students.
* 
*  Name: Song-Yun Ou Student ID: 174196212 Date: June 05, 2023
*
*  Cyclic Web App URL: https://easy-jade-bass-gown.cyclic.app/ 
*
*  GitHub Repository URL: https://github.com/Ou-sy/web322-app
*
********************************************************************************/ 
const express = require("express")
const app = express();
var path = require("path");
var blogService  = require("./blog-service.js");
const fs = require("fs");
var HTTP_PORT = process.env.PORT || 8080;

var published  = false;

// call this function after the http server starts listening for requests
function onHttpStart() {
  console.log("Express http server listening on: " + HTTP_PORT);
}

// setup the static folder that static resources can load from
// like images, css files, etc.
app.use(express.static("static"));

// setup a 'route' to listen on the default url path (http://localhost)
app.get("/", function(req,res){
    res.redirect("/about");
});
app.get("/about", function(req,res){
    res.sendFile(path.join(__dirname,"/views/about.html"));
});
app.get("/blog", function (req, res) {
  blogService.getPublishedPosts()
    .then((posts) => {
      res.json(posts);
    })
    .catch((error) => {
      res.status(500).json({ error: error });
    });
});
app.get("/posts", function(req,res){
  blogService.getAllPosts()
    .then((posts) => {
      res.json(posts);
    })
    .catch((error) => {
      res.status(500).json({ error: error });
    });
});
app.get("/categories", function(req,res){
  blogService.getCategories()
    .then((categories) => {
      res.json(categories);
    })
    .catch((error) => {
      res.status(500).json({ error: error });
    });
});

app.use(function(req,res){
    res.status(404).send("Page Not Found");
});

// Initialize the blog service and start the server only if initialization is successful
blogService.initialize()
  .then(() => {
    app.listen(HTTP_PORT, onHttpStart);
  })
  .catch((error) => {
    console.error("Failed to initialize blog service:", error);
  });