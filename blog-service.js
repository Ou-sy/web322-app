const fs = require("fs");
const path = require("path");

// Module data
let posts = [];
let categories = [];

// Helper function to read file contents
function readFile(filePath) {
  return new Promise((resolve, reject) => {
    fs.readFile(filePath, "utf8", (err, data) => {
      if (err) {
        reject("Unable to read file: " + filePath);
      } else {
        resolve(data);
      }
    });
  });
}

// Helper function to write data to a file
function writeFile(filePath, data) {
  return new Promise((resolve, reject) => {
    fs.writeFile(filePath, data, "utf8", (err) => {
      if (err) {
        reject("Unable to write to file: " + filePath);
      } else {
        resolve();
      }
    });
  });
}

// Exported functions
function initialize() {
  return new Promise((resolve, reject) => {
    const postsFilePath = path.join(__dirname, "/data/posts.json");
    const categoriesFilePath = path.join(__dirname, "/data/categories.json");

    readFile(postsFilePath)
      .then((data) => {
        posts = JSON.parse(data);
        return readFile(categoriesFilePath);
      })
      .then((data) => {
        categories = JSON.parse(data);
        resolve();
      })
      .catch((error) => {
        reject(error);
      });
  });
}

function getAllPosts() {
  return new Promise((resolve, reject) => {
    if (posts.length == 0) {
      reject("No results returned");
    } else {
      resolve(posts);
    }
  });
}

function getPublishedPosts() {
  return new Promise((resolve, reject) => {
    const publishedPosts = posts.filter((post) => post.published === true);
    if (publishedPosts.length == 0) {
      reject("No results returned");
    } else {
      resolve(publishedPosts);
    }
  });
}

function getCategories() {
  return new Promise((resolve, reject) => {
    if (categories.length == 0) {
      reject("No results returned");
    } else {
      resolve(categories);
    }
  });
}

function getPostsByCategory(category) {
  return new Promise((resolve, reject) => {
    const filteredPosts = posts.filter((post) => post.category === category);
    if (filteredPosts.length === 0) {
      reject("No results returned");
    } else {
      resolve(filteredPosts);
    }
  });
}


function getPostsByMinDate(minDateStr) {
  return new Promise((resolve, reject) => {
    const minDate = new Date(minDateStr);
    const filteredPosts = posts.filter((post) => new Date(post.postDate) >= minDate);
    if (filteredPosts.length === 0) {
      reject("No results returned");
    } else {
      resolve(filteredPosts);
    }
  });
}

function getPostById(id) {
  return new Promise((resolve, reject) => {
    const post = posts.find((post) => post.id === id);
    if (!post) {
      reject("No result returned");
    } else {
      resolve(post);
    }
  });
}

function addPost(postData) {
  return new Promise((resolve, reject) => {
    if (postData.published === undefined) {
      postData.published = false;
    } else {
      postData.published = true;
    }

    postData.id = posts.length + 1;
    posts.push(postData);

    const postsFilePath = path.join(__dirname, "/data/posts.json");
    const data = JSON.stringify(posts, null, 2);

    writeFile(postsFilePath, data)
      .then(() => {
        resolve(postData);
      })
      .catch((error) => {
        reject(error);
      });
  });
}

module.exports = {
  initialize,
  getAllPosts,
  getPublishedPosts,
  getCategories,
  getPostsByCategory,
  getPostsByMinDate,
  getPostById,
  addPost,
};
