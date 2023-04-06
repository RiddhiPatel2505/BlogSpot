/*********************************************************************************
*  WEB322 – Assignment 04
*  I declare that this assignment is my own work in accordance with Seneca  Academic Policy.  No part *  of this assignment has been copied manually or electronically from any other source 
*  (including 3rd party web sites) or distributed to other students.
* 
*  Name: Riddhi Bharatkumar Patel Student ID: 151212214 Date: 22-03-2023
*
*  Online (Cyclic) Link: https://shy-pear-iguana-sari.cyclic.app
* 
* Hello Professor, I have two extra days to submit this assignment. Thanks!
********************************************************************************/

var express = require("express");
const exhbs = require("express-handlebars");
var app = express();
var path = require("path");
var blog = require("./blog-service.js");
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const streamifier = require("streamifier");
const stripJs = require("strip-js");
const { BLOB } = require("sequelize");
cloudinary.config({
  cloud_name: "dykqe6zbf",
  api_key: "896516429251514",
  api_secret: "HJR-b_Hm09Cl5ulY8c4lBHJFYMA",
  secure: true,
});

const upload = multer();
app.engine(
  ".hbs",
  exhbs.engine({
    extname: ".hbs",
    helpers: {
      navLink: function (url, options) {
        return (
          "<li" +
          (url == app.locals.activeRoute ? ' class="active" ' : "") +
          '><a href="' +
          url +
          '">' +
          options.fn(this) +
          "</a></li>"
        );
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
      safeHTML: function (context) {
        return stripJs(context);
      },
    },
  })
);
app.set("view engine", ".hbs");
app.use(express.static("public"));
app.use(function (req, res, next) {
  let route = req.path.substring(1);
  app.locals.activeRoute =
    "/" +
    (isNaN(route.split("/")[1])
      ? route.replace(/\/(?!.*)/, "")
      : route.replace(/\/(.*)/, ""));
  app.locals.viewingCategory = req.query.category;
  next();
});
app.get("/", function (req, res) {
  res.redirect("/blog");
});

app.get("/about", function (req, res) {
  res.render("about");
});
app.get("/blog", async (req, res) => {
  let viewData = {};

  try {
    let posts = [];

    if (req.query.category) {
      posts = await blog.getPublishedPostsByCategory(req.query.category);
    } else {
      posts = await blog.getPublishedPosts();
    }

    posts.sort((a, b) => new Date(b.postDate) - new Date(a.postDate));

    let post = posts[0];

    viewData.posts = posts;
    viewData.post = post;
  } catch (err) {
    viewData.message = "no results";
  }

  try {
    let categories = await blog.getCategories();

    viewData.categories = categories;
  } catch (err) {
    viewData.categoriesMessage = "no results";
  }

  res.render("blog", { data: viewData });
});
// To get blog
app.get("/blog/:id", async (req, res) => {
  let viewData = {};

  try {
    let posts = [];

    if (req.query.category) {
      posts = await blog.getPublishedPostsByCategory(req.query.category);
    } else {
      posts = await blog.getPublishedPosts();
    }

    posts.sort((a, b) => new Date(b.postDate) - new Date(a.postDate));

    viewData.posts = posts;
  } catch (err) {
    viewData.message = "no results";
  }

  try {
    viewData.post = await blog.getPostById(req.params.id);
  } catch (err) {
    viewData.message = "no results";
  }

  try {
    let categories = await blog.getCategories();

    viewData.categories = categories;
  } catch (err) {
    viewData.categoriesMessage = "no results";
  }

  res.render("blog", { data: viewData });
});
// To get app posts
app.get("/posts", function (req, res) {
  if (req.query.category) {
    blog
      .getPostsByCategory(req.query.category)
      .then((data) => {
        res.render("posts", { info: data });
      })
      .catch(function (err) {
        res.render("posts", { message: "no results" });
      });
  } else if (req.query.minDate) {
    blog
      .getPostsByMinDate(req.query.minDate)
      .then((data) => {
        res.json(data);
      })
      .catch(function (err) {
        res.json({ message: err });
      });
  } else {
    blog
      .getAllPosts()
      .then(function (data) {
        if (data.length > 0) {
          res.render("posts", { info: data });
        } else {
          res.render("posts", { message: "no results" });
        }
      })
      .catch(function (err) {
        res.render("posts", { message: "no results" });
      });
  }
});
// To get post by ID
app.get("/post/:id", (req, res) => {
  blog
    .getPostById(req.params.id)
    .then((data) => {
      res.json(data);
    })
    .catch(function (err) {
      res.json({ message: err });
    });
});
// To render category page
app.get("/categories", function (req, res) {
  blog
    .getCategories()
    .then(function (data) {
      res.render("categories", { info: data });
    })
    .catch(function (err) {
      res.render("categories", { message: "no results" });
    });
});
// To render the post page
app.get("/posts/add", function (req, res) {
  blog.
    getCategories().then(function (data) {
      res.render("addPost", { categories: data });
    }).catch(function (error) {
      res.render("addPost", { categories: [] })
    });
});
// To add post data to the data base
app.post("/posts/add", upload.single("featureImage"), (req, res) => {
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
    return result;
  }
  upload(req).then((uploaded) => {
    req.body.featureImage = uploaded.url;
    blog
      .addPost(req.body)
      .then(() => {
        res.redirect("/posts");
      })
      .catch((data) => {
        res.send(data);
      });
  });
});

app.use(express.urlencoded({ extended: true }));

// Route to add new category(GET)
app.get("/categories/add", function (req, res) {
  res.render("addCategory");
})

// Route to add new category(POST)
app.post("/categories/add", (req, res) => {
  blog
    .addCategory({category:req.body})
    .then(() => {
      res.redirect("/categories")
    })
    .catch((data) => {
      res.send(data)
    });
});

// Route to delete Category by id
app.get("/categories/delete/:id", (req, res) => {
  console.log(req.body)
  blog
    .deleteCategoryById(req.body)
    .then(function (data) {
      blog
      .getCategories().then(function(data){
        res.render("categories", { info: data });
      })
    }).catch(function (error) {
      res.status(500).render("500");
    })
})

// Route to delete Post by id
app.get("/post/delete/:id", function (req, res) {
  blog
    .deletePostById(req.params.id)
    .then(function (data) {
      res.redirect("/categories")
    }).catch(function (error) {
      res.send(error)
      // res.status(500).render(error);
    })
})

// Render add Category page
app.get("/category/add", function (req, res) {
  res.render("addCategory")
});

// Initialize the app
app.use((req, res) => {
  res.status(404).render("404");
});
var PORT = process.env.PORT || 8080;
blog
  .initialize()
  .then((msg) => {
    app.listen(PORT, () => {
      console.log(`Express http server is listening  on  ${PORT}`);
    });
  })
  .catch((err) => {
    console.log(err);
  });
