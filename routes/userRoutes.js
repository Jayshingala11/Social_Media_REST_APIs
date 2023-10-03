const express = require("express");
const { body, query } = require("express-validator");

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

router.get("/getPosts", helper.verifyToken, userController.getPosts);

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

router.delete(
  "/deletePost",
  helper.verifyToken,
  [query("postId").isInt().notEmpty()],
  userController.deletePost
);

router.get(
  "/search",
  helper.verifyToken,
  [query("searchItem").notEmpty()],
  userController.searchItem
);

router.get(
  "/sort",
  helper.verifyToken,
  [query("sortBy").notEmpty(), query("orderBy").notEmpty()],
  userController.sorting
);

router.get(
  "/filter",
  helper.verifyToken,
  [query("editable").isBoolean().notEmpty()],
  userController.filter
);

router.post(
  "/likes",
  helper.verifyToken,
  [body("postId").isInt().notEmpty()],
  userController.likesUpdate
);

router.get(
  "/getLikes",
  helper.verifyToken,
  [query("postId").isInt().notEmpty()],
  userController.getLikes
);

router.post(
  "/postComment",
  helper.verifyToken,
  [body("postId").isInt().notEmpty(), body("comment").notEmpty()],
  userController.postComment
);

router.get(
  "/getCommnets",
  helper.verifyToken,
  [query("postId").isInt().notEmpty()],
  userController.getComment
);

router.delete(
  "/deleteComment",
  helper.verifyToken,
  [query("commId").isInt().notEmpty()],
  userController.deleteComment
);

router.post(
  "/postCollab",
  helper.verifyToken,
  [
    query("postId").isInt().notEmpty(),
    body("content").trim().notEmpty(),
  ],
  userController.postCollaboration
);

router.get("/getCollabQuotes", helper.verifyToken, userController.getCollabQuotes);



module.exports = router;