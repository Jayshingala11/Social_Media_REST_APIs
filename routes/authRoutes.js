const express = require("express");
const authController = require("../controllers/authController");
const AuthValidation = require("../utils/validation/authValidation");
const passport = require("passport");
const Auth = passport.authenticate("jwt", { session: false });

const router = express.Router();

router.put("/signup", AuthValidation.validateSignup, authController.signup);

router.get("/verifyEmail/token=:token", Auth, authController.verifyEmail);

router.post("/login", AuthValidation.validateLogin, authController.login);

router.post(
  "/resetPassword",
  AuthValidation.validateResetPassword,
  authController.resetPassword
);

router.post(
  "/setPassword",
  AuthValidation.validateSetPassword,
  Auth,
  authController.setnewPassword
);

router.post("/addSubscriptionPlan", authController.addSubscriptionPlan);

router.post("/checkOut", Auth, authController.checkOut);

router.get("/success", authController.success);

module.exports = router;
