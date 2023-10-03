const express = require("express");
const { body } = require("express-validator");
const authController = require("../controllers/authController");
const User = require("../models/userModel");
const helper = require("../utils/helper");

const router = express.Router();

router.put(
  "/signup",
  [
    body("email")
      .isEmail()
      .withMessage("Please enter a valid email.")
      .custom((value, { req }) => {
        return User.findOne({ where: { email: value } }).then((user) => {
          if (user) {
            return Promise.reject("Email already exists.");
          }
        });
      })
      .normalizeEmail()
      .not()
      .isEmpty(),
    body("password").trim().isLength({ min: 5 }).not().isEmpty(),
    body("name").trim().not().isEmpty(),
  ],
  authController.signup
);

router.get(
  "/verifyEmail/token=:token",
  helper.verifyToken,
  authController.verifyEmial
);

router.post(
  "/login",
  [
    body("email")
      .isEmail()
      .withMessage("Please enter a valid email.")
      .normalizeEmail()
      .not()
      .isEmpty(),
    body("password", "please enter atleast 5 charachter.")
      .trim()
      .isLength({ min: 5 })
      .not()
      .isEmpty(),
  ],
  authController.login
);

router.post(
  "/resetPassword",
  [
    body("email")
      .isEmail()
      .withMessage("Please enter a valid email.")
      .normalizeEmail()
      .not()
      .isEmpty(),
  ],
  authController.resetPassword
);

router.post(
  "/setPassword",
  [body("newPassword", "Please enter atleast 5 charachter.").trim().isLength({ min: 5 }).not().isEmpty()],
  helper.verifyToken,
  authController.setnewPassword
);

router.post("/addSubscriptionPlan", authController.addSubscriptionPlan);

module.exports = router;
