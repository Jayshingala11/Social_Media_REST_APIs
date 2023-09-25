const User = require("../models/userModel");
const bcrypt = require("bcrypt");
const helper = require("../utils/helper");

class AuthController {
  signup = async (req, res, next) => {
    const body = req.body;

    try {
      helper.validateRequest(req);

      const hashedPassword = await bcrypt.hash(body.password, 12);

      const user = new User({
        name: body.name,
        email: body.email,
        password: hashedPassword,
        status: "false",
      });

      const result = await user.save();

      const token = await helper.generateToken(body.email, "1h");

      const mailOptions = {
        from: "jayshingalabackup@gmail.com",
        to: body.email,
        subject: "Verify your Email",
        html: `
          <p> You have to verify your email </p>
          <p> Click this <a href="http://localhost:3000/auth/verifyEmail/token=${token}">Link</a> to verify your email. </p>`,
      };

      helper.sendVerificationEmail(mailOptions);

      res
        .status(200)
        .json({ message: "User Created", userId: result.id, body: body });
    } catch (err) {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    }
  };

  verifyEmial = async (req, res, next) => {
    const email = req.data;
    try {
      const user = await User.findOne({ where: { email: email } });

      if (user.status === "true") {
        const error = new Error("Your email already verified");
        error.statusCode = 500;
        throw error;
      }

      user.status = "true";

      const result = await user.save();

      res.status(200).json({ message: "Your email verified successfully." });
    } catch (err) {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    }
  };

  login = async (req, res, next) => {
    const body = req.body;

    try {
      helper.validateRequest(req);

      const user = await User.findOne({ where: { email: body.email } });

      if (!user) {
        const error = new Error(
          "Email does not exist, please register yourself first."
        );
        error.statusCode = 401;
        throw error;
      }

      const passCompare = await bcrypt.compare(body.password, user.password);

      if (!passCompare) {
        const error = new Error("Incorrect Email or password!");
        error.statusCode = 401;
        throw error;
      }

      const userObj = {
        id: user.id,
        name: user.name,
      };

      const token = await helper.generateToken(userObj, "1h");

      res.status(200).json({ message: "Successfully logged In", token: token });
    } catch (err) {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    }
  };

  resetPassword = async (req, res, next) => {
    const body = req.body;

    try {
      helper.validateRequest(req);

      const user = await User.findOne({ where: { email: body.email } });

      if (!user) {
        const error = new Error("No user found with this email.");
        error.statusCode = 404;
        throw error;
      }

      const token = await helper.generateToken(user.id, "1h");

      user.resetToken = token;

      const result = await user.save();

      const mailOptions = {
        from: "jayshingalabackup@gmail.com",
        to: body.email,
        subject: "Password Reset",
        html: `
          <p> You requested a password reset! </p>
          <p> Click this <a href="http://localhost:3000/auth/setPassword/token=${token}">Link</a> to reset a password. </p>`,
      };

      helper.sendVerificationEmail(mailOptions);

      res
        .status(200)
        .json({
          message: "Request for reset password has been sent to your mail",
        });
    } catch (err) {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    }
  };

  setnewPassword = async (req, res, next) => {
    const userId = req.data;
    const newPassword = req.body.newPassword;
    try {
      helper.validateRequest(req);

      const user = await User.findOne({where: {id: userId}});


      if (!user.resetToken) {
        const error = new Error("Your Password has been changed already!");
        error.statusCode = 403;
        throw error;
      }

      const hashedPassword = await bcrypt.hash(newPassword, 12);

      user.password = hashedPassword;
      user.resetToken = null;

      const result = await user.save();

      res.status(200).json({message: "Your password changed successfully"});
    } catch (err) {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    }
  };
}

module.exports = new AuthController();
