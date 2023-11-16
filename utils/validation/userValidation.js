const { body, query } = require("express-validator");

class UserValidation {
  validateCreatePost = [
    body("title").trim().isLength({ min: 5 }),
    body("description").trim().isLength({ min: 5 }),
    body("editable").trim().isBoolean(),
    body("draft").trim().isBoolean(),
  ];

  validateEditPost = [
    body("title").trim().isLength({ min: 5 }),
    body("description").trim().isLength({ min: 5 }),
    body("editable").trim().isBoolean(),
  ];

  validateDeletePost = [query("postId").isInt().notEmpty()];

  validateSearch = [
    query("searchItem").isString(),
    query("editable").isBoolean(),
    query("sortBy").isString(),
    query("orderBy").isString(),
  ];

  validateLikes = [body("postId").isInt().notEmpty()];

  validateGetLikes = [query("postId").isInt().notEmpty()];

  validatePostComment = [
    body("postId").isInt().notEmpty(),
    body("comment").notEmpty(),
  ];

  validateGetComment = [query("postId").isInt().notEmpty()];

  validateDeleteComment = [query("commId").isInt().notEmpty()];

  validatePostCollab = [
    query("postId").isInt().notEmpty(),
    body("content").trim().notEmpty(),
  ];

  validateDeleteCollab = [
    query("postId").isInt().notEmpty(),
    query("collabId").isInt().notEmpty(),
  ];

  validateApproveCollab = [query("collabId").isInt().notEmpty()];
}

module.exports = new UserValidation();
