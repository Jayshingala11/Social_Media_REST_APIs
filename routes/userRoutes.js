const express = require("express");
const { body } = require("express-validator");

const userController = require("../controllers/userController");
const helper = require("../utils/helper");

const router = express.Router();

router.post(
  "/createPost",
  helper.verifyToken,
  [
    body("title").trim().isLength({ min: 5 }),
    body("description").trim().isLength({ min: 5 }),
    body("editable").trim().isBoolean(),
    body("draft").trim().isBoolean(),
  ],
  userController.createPost
);

router.get(
  "/getPosts",
  helper.verifyToken,
  userController.getPosts
);

router.put(
  "/editPost",
  helper.verifyToken,
  [
    body("title").trim().isLength({ min: 5 }),
    body("description").trim().isLength({ min: 5 }),
    body("editable").trim().isBoolean(),
  ],
  userController.updatePost
);

router.delete('/deletePost', helper.verifyToken, userController.deletePost);

router.get('/search', helper.verifyToken, userController.searchItem);

router.get('/sort', helper.verifyToken, userController.sorting);

router.get('/filter', helper.verifyToken, userController.filter);

router.post('/likes', helper.verifyToken, userController.likesUpdate);

router.get('/getLikes', helper.verifyToken, userController.getLikes);

router.post('/postComment', helper.verifyToken, userController.postComment);

router.get('/getCommnets', helper.verifyToken, userController.getComment);

router.delete('/deleteComment', helper.verifyToken, userController.deleteComment);

module.exports = router;
