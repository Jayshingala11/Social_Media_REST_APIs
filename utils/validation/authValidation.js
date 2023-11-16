const { body } = require("express-validator");

const User = require("../../models/userModel");

class AuthValidation {
  validateSignup = [
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
  ];

  validateLogin = [
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
  ];

  validateResetPassword = [
    body("email")
      .isEmail()
      .withMessage("Please enter a valid email.")
      .normalizeEmail()
      .not()
      .isEmpty(),
  ];

  validateSetPassword = [
    body("newPassword", "Please enter atleast 5 charachter.")
      .trim()
      .isLength({ min: 5 })
      .not()
      .isEmpty(),
  ];
}

module.exports = new AuthValidation();
