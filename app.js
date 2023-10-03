const express = require("express");
const bodyParser = require("body-parser");

const sequelize = require("./utils/database");
const User = require("./models/userModel");
const Post = require("./models/postModel");
const Like = require("./models/likeModel");
const Comment = require("./models/commentModel");
const Subscription = require("./models/subscriptionModel");
const Collaboration = require("./models/collaborationModel");

const app = express();

// Router Import
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");

app.use(bodyParser.json());

app.use((req, res, next) => {
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type",
    "Authorization"
  );
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, PATCH, DELETE"
  );
  res.setHeader("Access-Control-Allow-Origin", "*");
  next();
});

// Routes
app.use("/auth", authRoutes);
app.use("/user", userRoutes);

// Error Handler
app.use((error, req, res, next) => {
  console.log(error);
  const status = error.statusCode || 500;
  const message = error.message;
  const data = error.data;
  res.status(status).json({ message: message, data: data });
});

// Associations
Post.belongsTo(User, { constraints: true, onDelete: "CASCADE" });
User.hasMany(Post);
Like.belongsTo(Post, { constraints: true, onDelete: "CASCADE" });
Post.hasMany(Like, { paranoid: true });
Like.belongsTo(User, { constraints: true, onDelete: "CASCADE" });
User.hasMany(Like);
Comment.belongsTo(Post, { constraints: true, onDelete: "CASCADE" });
Post.hasMany(Comment, { paranoid: true });
Comment.belongsTo(User, { constraints: true, onDelete: "CASCADE" });
User.hasMany(Comment);
User.belongsTo(Subscription);
Collaboration.belongsTo(User, { constraints: true, onDelete: "CASCADE" });
User.hasMany(Collaboration);
Collaboration.belongsTo(Post, { constraints: true, onDelete: "CASCADE" });
Post.hasMany(Collaboration);

// Server Running
sequelize
  .sync() // { force: true }
  .then(() => {
    app.listen(3000);
  })
  .catch((err) => {
    console.log(err);
  });
