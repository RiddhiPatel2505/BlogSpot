/*********************************************************************************
*  WEB322 – Assignment 04
*  I declare that this assignment is my own work in accordance with Seneca  Academic Policy.  No part *  of this assignment has been copied manually or electronically from any other source 
*  (including 3rd party web sites) or distributed to other students.
* 
*  Name: Riddhi Bharatkumar Patel Student ID: 151212214 Date: 05-04-2023
*
*  Online (Cyclic) Link: https://clear-crow-suit.cyclic.app/blog
* 
* Hello Professor, I have two extra days to submit this assignment. Thanks!
********************************************************************************/
var authData = require("./auth-service.js")
var clientSession = require("client-sessions")
const session = require("express-session")
const cookieParser = require("cookie-parser");

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

// Session configuration
app.use(cookieParser());
 
app.use(session({
  secret: 'This is smit patel',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: true, maxAge:1000*60*60 }
}));

// Middleware to check whether is suthenticated or not
function isAuthenticated(req, res, next) {
  if (req.session) {
    // user is authenticated, continue to next middleware or route handler
    return next();
  }

  // user is not authenticated, redirect to login page
  res.redirect('/login');
}

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

app.get("/about", isAuthenticated, function (req, res) {
  res.render("about");
});
app.get("/blog",isAuthenticated,  async (req, res) => {
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

  if(req.session != null){
    data = { data: viewData, session:req.session }
  }
  else
  {
    data = {data:viewData}
  }

  res.render("blog", data);
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

  res.render("blog", isAuthenticated, { data: viewData });
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
app.get("/post/:id",isAuthenticated, (req, res) => {
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
app.get("/categories", isAuthenticated, function (req, res) {
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
app.get("/posts/add", isAuthenticated, function (req, res) {
  blog.
    getCategories().then(function (data) {
      res.render("addPost", { categories: data });
    }).catch(function (error) {
      res.render("addPost", { categories: [] })
    });
});
// To add post data to the data base
app.post("/posts/add", isAuthenticated, upload.single("featureImage"), (req, res) => {
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
app.get("/categories/add", isAuthenticated, function (req, res) {
  res.render("addCategory");
})

// Route to add new category(POST)
app.post("/categories/add", isAuthenticated, (req, res) => {
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
app.get("/categories/delete", isAuthenticated, (req, res) => {
  blog
    .deleteCategoryById(req.query.id)
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
app.get("/posts/delete", isAuthenticated, function (req, res) {
  blog
    .deletePostById(req.query.id)
    .then(function () {
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
    })
    .catch(function (error) {
      res.status(500).render("500");
    });
});

// Render add Category page
app.get("/category/add", isAuthenticated, function (req, res) {
  res.render("addCategory")
});

// Render the login page
app.get("/login", function(req, res){
  res.render("login")
});

// Perform the login operation
app.post("/login", function(req, res){
  req.body.userAgent = req.get('User-Agent');
  authData
  .checkUser(req.body)
  .then((user) => {
    req.session = {email:user[0].email, userName:user[0].userName, loginHistory:user[0].loginHistory}
    res.redirect('/posts')
  }).catch(function(err){
    res.render("login",  {errorMessage: err, userName: req.body.userName} )
  });
});




// Render registre page
app.get("/register", function(req, res){
  res.render("register")
})
// Logout view
app.get("/logout", function(req, res){
  req.session.destroy(function(err) {
    if(err) {
      console.log(err);
    } else {
      res.redirect('/');
    }
  });
});
// Add the user in database
app.post("/register", function(req, res){
  authData.registerUser(req.body)
  .then(function(){
    res.render("register", {successMessage: "User created"})
  }). catch(function(err){
    res.render("register", {errorMessage: err, userName: req.body.userName} )
  })
})

// Route to get the userHistory
app.get("userHistory", function(req, res){
  res.render("userHistory")
})

// Initialize the app
app.use((req, res) => {
  res.status(404).render("404");
});
var PORT = process.env.PORT || 8080;
blog
  .initialize()
  .then(authData.initialize())
  .then((msg) => {
    app.listen(PORT, () => {
      console.log(`Express http server is listening  on  ${PORT}`);
    });
  })
  .catch((err) => {
    console.log("Unable to listen server: "+err);
  });
