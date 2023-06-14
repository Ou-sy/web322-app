/*********************************************************************************
*  WEB322 – Assignment 03
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
const fs = require("fs");
const multer = require("multer");
const cloudinary = require('cloudinary').v2
const streamifier = require('streamifier')

var published  = false;
var blogService  = require("./blog-service.js");
var HTTP_PORT = process.env.PORT || 8080;
const upload = multer(); // no { storage: storage } since we are not using disk storage

cloudinary.config({
  cloud_name: 'dx2ulvnko',
  api_key: '285826993564794',
  api_secret: 'jZBsXIKOnPDmnxG7hRBgGYAI0Po',
  secure: true
});


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
app.get("/posts", function (req, res) {
  const category = req.query.category;
  const minDate = req.query.minDate;

  if (category) {
    blogService
      .getPostsByCategory(category)
      .then((posts) => {
        res.json(posts);
      })
      .catch((error) => {
        res.status(500).json({ error: error });
      });
  } else if (minDate) {
    blogService
      .getPostsByMinDate(minDate)
      .then((posts) => {
        res.json(posts);
      })
      .catch((error) => {
        res.status(500).json({ error: error });
      });
  } else {
    blogService
      .getAllPosts()
      .then((posts) => {
        res.json(posts);
      })
      .catch((error) => {
        res.status(500).json({ error: error });
      });
  }
});

app.get("/post/:id", function (req, res) {
  const postId = parseInt(req.params.id);

  blogService
    .getPostById(postId)
    .then((post) => {
      res.json(post);
    })
    .catch((error) => {
      res.status(500).json({ error: error });
    });
});

app.get("/posts/add", function(req,res){
  res.sendFile(path.join(__dirname,"/views/addPost.html"));
});
app.post("/posts/add", upload.single("featureImage"), function(req, res) {
  if (req.file) {
    let streamUpload = (req) => {
      return new Promise((resolve, reject) => {
        let stream = cloudinary.uploader.upload_stream((error, result) => {
          if (result) {
            resolve(result);
          } else {
            reject(error);
          }
        });

        streamifier.createReadStream(req.file.buffer).pipe(stream);
      });
    };

    async function upload(req) {
      let result = await streamUpload(req);
      console.log(result);
      return result;
    }

    upload(req)
      .then((uploaded) => {
        processPost(uploaded.url);
      })
      .catch((error) => {
        console.error("Failed to upload image:", error);
        processPost("");
      });
  } else {
    processPost("");
  }

  function processPost(imageUrl) {
    req.body.featureImage = imageUrl;
    const postData = {
      id: 0,
      body: req.body.body,
      title: req.body.title,
      postDate: new Date().toISOString().split("T")[0],
      category: req.body.category,
      featureImage: req.body.featureImage,
      published: req.body.published
    };

    blogService
      .addPost(postData)
      .then((addedPost) => {
        res.redirect("/posts");
      })
      .catch((error) => {
        console.error("Failed to add blog post:", error);
        res.redirect("/posts");
      });
  }
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