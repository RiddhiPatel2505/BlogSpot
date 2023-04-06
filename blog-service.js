const Sequelize = require('sequelize');
const file = require("fs");
const { promises } = require('dns');

var posts = [];
var categories = [];

// initializing data base
var sequelize = new Sequelize('ebdjsbfn', 'ebdjsbfn', '28zRl84PmQNuCkGsRO4LvVle7inIIOyk', {
  host: 'satao.db.elephantsql.com',
  dialect: 'postgres',
  port: 5432,
  dialectOptions: {
    ssl: { rejectUnauthorized: false }
  },
  query: { raw: true }
});

// Defining Post module
var Post = sequelize.define('Post', {
  body: Sequelize.TEXT,
  title: Sequelize.STRING,
  postDate: Sequelize.DATE,
  featureImage: Sequelize.STRING,
  published: Sequelize.BOOLEAN,
});

var Category = sequelize.define('Category', {
  category: Sequelize.STRING
});

// Define relationship between Post and Category schemas
Post.belongsTo(Category, { foreignKey: 'category' });

// Initializing connection with database
initialize = () => {
  return new Promise((resolve, reject) => {
    sequelize.sync().then(function (data) {
      resolve(data)
    }).catch(function (error) {
      reject("Unable to sync the database!")
    })
  });
};

// Retrive all posts 
getAllPosts = () => {
  return new Promise((resolve, reject) => {
    Post.findAll().then(function (post) {
      if (post.length > 0) {
        resolve(post)
      } else {
        reject("No results returned!")
      }
    }).catch(function (error) {
      reject("No results returned!")
    })
  });
};

// Retrive the published post
getPublishedPosts = () => {
  return new Promise((resolve, reject) => {
    Post.findAll({
      where: {
        published: true
      }
    }).then(function (post) {
      if (post.length > 0) {
        resolve(post)
      } else {
        reject("No reqult returned!")
      }
    }).catch(function (error) {
      reject("No result returned!")
    })
  });
};

// Get the all categories available
getCategories = () => {
  return new Promise((resolve, reject) => {
    Category.findAll().then(function (category) {
      resolve(category)
    }).catch(function (error) {
      reject("No result returned!")
    })
  });
};

// Create the new post
addPost = (postData) => {
  postData.published = (postData.published) ? true : false;
  for (let prop in postData) {
    if (postData[prop] === "") {
      postData[prop] = null
    }
  }
  postData['postData'] = new Date()

  return new Promise(function (resolve, reject) {
      Post.create(postData).then(function () {
        resolve()
      }).catch(function (error) {
        reject(error);
      });
    })
};
// Adding new category
addCategory = (category) => {
  for (let prop in category) {
    if (category[prop] === "") {
      category[prop] = null
    }
  }
  return new Promise(function (resolve, reject) {
    Category.create(category.category).then(function (category) {
      resolve(category)
    }).catch(function (error) {
      reject(error)
    });
  });
}

// Delete Category by id
deleteCategoryById = (id) => {
  return new Promise(function (resolve, reject) {
    Category.destroy({
      where: {
        id: id
      }
    }).then(function(data){
      resolve()
    }).catch(function(error){
      reject("Unable to delete category!")
    });
  });
}

// Delete post by id
deletePostById = (id) => {
  return new Promise(function(resolve, reject){
    Post.destroy({
      where:{
        id : id
      }
    }).then(function(post){
      resolve()
    }).catch(function (error){
      reject("Unable to delete post!")
    });
  });
}
// Retrive the post by category
getPostsByCategory = (category) => {
  {
    return new Promise(function (resolve, reject) {
      Post.findAll({
        where: {
          category: category
        }
      }).then(function (post) {
        if (post.length > 0) {
          resolve(post)
        } else {
          reject("No reqult returned!")
        }
      }).catch(function (error) {
        reject("No result returned!")
      })
    });
  }
};

// Retrive Published post by Category
getPublishedPostsByCategory = function (category) {
  return new Promise((resolve, reject) => {
    Post.findAll({
      where: {
        published: true,
        category: category
      }
    }).then(function (post) {
      if (post.length > 0) {
        resolve(post)
      } else {
        reject("No reqult returned!")
      }
    }).catch(function (error) {
      reject("No result returned!")
    })
  });
};

// Retrive post by Minimum Date
getPostsByMinDate = (minDateStr) => {
  {
    return new Promise(function (resolve, reject) {
      Post.findAll({
        where: {
          postDate: {
            [Sequelize.Op.gte]: new Date(minDateStr)
          }
        }
      }).then(function (post) {
        if (post.length > 0) {
          resolve(post)
        } else {
          reject("No reqult returned!")
        }
      }).catch(function (error) {
        reject("No result returned!")
      })
    });
  }
};
getPostById = (id) => {
  return new Promise((resolve, reject) => {
    Post.findAll({
      where: {
        postDate: {
          id: id
        }
      }
    }).then(function (post) {
      if (post.length > 0) {
        resolve(post)
      } else {
        reject("No reqult returned!")
      }
    }).catch(function (error) {
      reject("No result returned!")
    })
  });
};

module.exports = {
  initialize,
  getAllPosts,
  getPublishedPosts,
  getCategories,
  addPost,
  getPostsByCategory,
  getPublishedPostsByCategory,
  getPostsByMinDate,
  getPostById,
  addCategory,
  deleteCategoryById,
  deletePostById,
};
