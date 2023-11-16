const express = require("express");
const UserValidation = require("../utils/validation/userValidation");
const passport = require("passport");
const Auth = passport.authenticate("jwt", { session: false });

const userController = require("../controllers/userController");

const router = express.Router();

router.post(
  "/createPost",
  Auth,
  UserValidation.validateCreatePost,
  userController.createPost
);

router.get("/getPosts", Auth, userController.getPosts);

router.put(
  "/editPost",
  Auth,
  UserValidation.validateEditPost,
  userController.updatePost
);

router.delete(
  "/deletePost",
  Auth,
  UserValidation.validateDeletePost,
  userController.deletePost
);

router.get(
  "/search",
  Auth,
  UserValidation.validateSearch,
  userController.searchPost
);

router.post(
  "/likes",
  Auth,
  UserValidation.validateLikes,
  userController.likesUpdate
);

router.get(
  "/getLikes",
  Auth,
  UserValidation.validateGetLikes,
  userController.getLikes
);

router.post(
  "/postComment",
  Auth,
  UserValidation.validatePostComment,
  userController.postComment
);

router.get(
  "/getCommnets",
  Auth,
  UserValidation.validateGetComment,
  userController.getComment
);

router.delete(
  "/deleteComment",
  Auth,
  UserValidation.validateDeleteComment,
  userController.deleteComment
);

router.post(
  "/postCollab",
  Auth,
  UserValidation.validatePostCollab,
  userController.postCollaboration
);

router.get("/getCollabQuotes", Auth, userController.getCollabQuotes);

router.delete(
  "/deleteCollabList",
  Auth,
  UserValidation.validateDeleteCollab,
  userController.DeleteCollab
);

router.put(
  "/approveCollab",
  Auth,
  UserValidation.validateApproveCollab,
  userController.approveCollab
);

module.exports = router;
