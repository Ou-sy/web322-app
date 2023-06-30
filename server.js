/*********************************************************************************
*  WEB322 – Assignment 04
*  I declare that this assignment is my own work in accordance with Seneca  Academic Policy.  No part *  of this assignment has been copied manually or electronically from any other source 
*  (including 3rd party web sites) or distributed to other students.
* 
*  Name: Song-Yun Ou Student ID: 174196212 Date: June 29, 2023
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
const exphbs = require("express-handlebars");
const stripJs = require('strip-js');
var blogService = require("./blog-service.js");
var blogData = require("./blog-service");

var published  = false;
var HTTP_PORT = process.env.PORT || 8080;
const upload = multer(); // no { storage: storage } since we are not using disk storage

cloudinary.config({
  cloud_name: 'dx2ulvnko',
  api_key: '285826993564794',
  api_secret: 'jZBsXIKOnPDmnxG7hRBgGYAI0Po',
  secure: true
});

// Configure Express to use Handlebars as the template engine
app.engine('hbs', exphbs.engine({ extname: '.hbs' }));
app.set('view engine', 'hbs');


// call this function after the http server starts listening for requests
function onHttpStart() {
  console.log("Express http server listening on: " + HTTP_PORT);
}

// setup the static folder that static resources can load from
// like images, css files, etc.
app.use(express.static("static"));


app.use(function(req, res, next) {
  let route = req.path.substring(1);
  app.locals.activeRoute = "/" + (isNaN(route.split('/')[1]) ? route.replace(/\/(?!.*)/, "") : route.replace(/\/(.*)/, ""));
  app.locals.viewingCategory = req.query.category;
  next();
});

app.engine('.hbs', exphbs.engine({ 
  extname: '.hbs',
  helpers: { 
    navLink: function(url, options){
      return '<li' + 
          ((url == app.locals.activeRoute) ? ' class="active" ' : '') + 
          '><a href="' + url + '">' + options.fn(this) + '</a></li>';
    },
    equal: function (lvalue, rvalue, options) {
      if (arguments.length < 3)
          throw new Error("Handlebars Helper equal needs 2 parameters");
      if (lvalue != rvalue) {
          return options.inverse(this);
      } else {
          return options.fn(this);
      }
    },
    safeHTML: function(context){
      return stripJs(context);
    }  
  }
}));


app.get("/", function (req, res) {
  res.redirect("/blog");
});

// setup a 'route' to listen on the default url path (http://localhost)
app.get("/about", function (req, res) {
  res.render("about");
});

app.get('/blog/:id', async (req, res) => {

  // Declare an object to store properties for the view
  let viewData = {};

  try{

      // declare empty array to hold "post" objects
      let posts = [];

      // if there's a "category" query, filter the returned posts by category
      if(req.query.category){
          // Obtain the published "posts" by category
          posts = await blogData.getPublishedPostsByCategory(req.query.category);
      }else{
          // Obtain the published "posts"
          posts = await blogData.getPublishedPosts();
      }

      // sort the published posts by postDate
      posts.sort((a,b) => new Date(b.postDate) - new Date(a.postDate));

      // store the "posts" and "post" data in the viewData object (to be passed to the view)
      viewData.posts = posts;

  }catch(err){
      viewData.message = "no results";
  }

  try{
      // Obtain the post by "id"
      viewData.post = await blogData.getPostById(req.params.id);
  }catch(err){
      viewData.message = "no results"; 
  }

  try{
      // Obtain the full list of "categories"
      let categories = await blogData.getCategories();

      // store the "categories" data in the viewData object (to be passed to the view)
      viewData.categories = categories;
  }catch(err){
      viewData.categoriesMessage = "no results"
  }

  // render the "blog" view with all of the data (viewData)
  res.render("blog", {data: viewData})
});

app.get('/blog', async (req, res) => {

  // Declare an object to store properties for the view
  let viewData = {};

  try{

      // declare empty array to hold "post" objects
      let posts = [];

      // if there's a "category" query, filter the returned posts by category
      if(req.query.category){
          // Obtain the published "posts" by category
          posts = await blogData.getPublishedPostsByCategory(req.query.category);
      }else{
          // Obtain the published "posts"
          posts = await blogData.getPublishedPosts();
      }

      // sort the published posts by postDate
      posts.sort((a,b) => new Date(b.postDate) - new Date(a.postDate));

      // get the latest post from the front of the list (element 0)
      let post = posts[0]; 

      // store the "posts" and "post" data in the viewData object (to be passed to the view)
      viewData.posts = posts;
      viewData.post = post;

  }catch(err){
      viewData.message = "no results";
  }

  try{
      // Obtain the full list of "categories"
      let categories = await blogData.getCategories();

      // store the "categories" data in the viewData object (to be passed to the view)
      viewData.categories = categories;
  }catch(err){
      viewData.categoriesMessage = "no results"
  }

  // render the "blog" view with all of the data (viewData)
  res.render("blog", {data: viewData})

});

app.get("/posts", function (req, res) {
  const category = req.query.category;
  const minDate = req.query.minDate;

  if (category) {
    blogService
      .getPostsByCategory(category)
      .then((posts) => {
        res.render("posts", { posts: posts });
      })
      .catch((error) => {
        res.render("posts", { message: error });
      });
  } else if (minDate) {
    blogService
      .getPostsByMinDate(minDate)
      .then((posts) => {
        res.render("posts", { posts: posts });
      })
      .catch((error) => {
        res.render("posts", { message: error });
      });
  } else {
    blogService
      .getAllPosts()
      .then((posts) => {
        res.render("posts", { posts: posts });
      })
      .catch((error) => {
        res.render("posts", { message: error });
      });
  }
});

app.get("/posts/add", function(req,res){
  res.render("addPost");
});

app.post("/posts/add", upload.single("featureImage"), function (req, res) {
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
      published: req.body.published,
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
    res.render("categories", { categories: categories });
    })
    .catch((error) => {
      res.render("categories", { message: "no results" });
    });
});

app.use(function(req,res){
  res.status(404).render("404");
});

// Initialize the blog service and start the server only if initialization is successful
blogService.initialize()
  .then(() => {
    app.listen(HTTP_PORT, onHttpStart);
  })
  .catch((error) => {
    console.error("Failed to initialize blog service:", error);
  });