require("dotenv").config();
const bcrypt = require("bcrypt");
const helper = require("../utils/helper");
const models = require("../models/indexModel");
const User = models.userModel;
const Subscription = models.subscriptionModel;
const SubscriptionPlan = models.subscriptionplanModel;
const Customer = models.customerModel;

const stripe = require("stripe")(process.env.STRIPE_API_KEY);

const { Op } = require("sequelize");

class AuthController {
  signup = async (req, res, next) => {
    try {
      helper.validateRequest(req);
      const body = req.body;

      const hashedPassword = await bcrypt.hash(body.password, 12);

      const user = new User({
        name: body.name,
        email: body.email,
        password: hashedPassword,
        status: "false",
        subscriptionplanId: body.subPlanId || 1,
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

  verifyEmail = async (req, res, next) => {
    const email = req.user.email;
    try {
      const user = await User.findOne({ where: { email } });

      if (user.status === "true") {
        const error = new Error("Your email already verified");
        error.statusCode = 500;
        throw error;
      }

      user.status = "true";

      await user.save();

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

      const token = await helper.generateToken(userObj, "3h");

      res
        .status(200)
        .json({ message: "Successfully logged In", token: `Bearer ${token}` });
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

      await user.save();

      const mailOptions = {
        from: "jayshingalabackup@gmail.com",
        to: body.email,
        subject: "Password Reset",
        html: `
          <p> You requested a password reset! </p>
          <p> Click this <a href="http://localhost:3000/auth/setPassword/token=${token}">Link</a> to reset a password. </p>`,
      };

      helper.sendVerificationEmail(mailOptions);

      res.status(200).json({
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
    const userId = req.user.id;
    const newPassword = req.body.newPassword;
    try {
      helper.validateRequest(req);

      const user = await User.findOne({ where: { id: userId } });

      if (!user.resetToken) {
        const error = new Error("Your Password has been changed already!");
        error.statusCode = 403;
        throw error;
      }

      const hashedPassword = await bcrypt.hash(newPassword, 12);

      user.password = hashedPassword;
      user.resetToken = null;

      await user.save();

      res.status(200).json({ message: "Your password changed successfully" });
    } catch (err) {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    }
  };

  addSubscriptionPlan = async (req, res, next) => {
    const body = req.body;

    try {
      const subPlan = new SubscriptionPlan({
        product_id: body.productId || null,
        plan_name: body.name,
        posts_limit: body.postLimit,
        collab_limit: body.collabLimit,
      });

      const result = await subPlan.save();

      res
        .status(201)
        .json({ message: "Subscription plan Created.", data: result });
    } catch (err) {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    }
  };

  checkOut = async (req, res, next) => {
    const userId = req.user.id;
    const price = req.body.price;
    try {
      const user = await User.findByPk(userId);

      const cust = await Customer.findOne({ where: { userId } });

      let customer_id;
      if (cust) {
        customer_id = cust.customer_id;
      }

      let customer;
      if (!cust) {
        customer = await stripe.customers.create({
          email: user.email,
          name: user.name,
        });

        customer_id = customer.id;

        await Customer.create({
          customer_id: customer.id,
          userId,
        });
      }

      const subscription = await Subscription.findOne({ where: { userId } });

      if (subscription) {
        const error = new Error("You already have a subscription!");
        error.statusCode = 403;
        throw error;
      }

      const session = await stripe.checkout.sessions.create({
        customer: customer_id,
        payment_method_types: ["card"],
        line_items: [
          {
            price,
            quantity: 1,
          },
        ],
        mode: "subscription",
        success_url:
          "http://localhost:3000/auth/success?session_id={CHECKOUT_SESSION_ID}",
        cancel_url: "http://localhost:3000/cancel",
        metadata: {
          userId,
        },
      });

      res.status(200).json({ message: "Checkout", data: session });
    } catch (err) {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    }
  };

  success = async (req, res, next) => {
    try {
      const session = await stripe.checkout.sessions.retrieve(
        req.query.session_id
      );

      const subscription = await stripe.subscriptions.retrieve(
        session.subscription
      );

      const start_date = new Date(subscription.current_period_start * 1000);
      const end_date = new Date(subscription.current_period_end * 1000);

      const customerTable = await Customer.findOne({
        where: { customer_id: subscription.customer },
      });
      const subPlanTable = await SubscriptionPlan.findOne({
        where: { product_id: subscription.plan.product },
      });

      await Subscription.create({
        sub_id: subscription.id,
        active: subscription.plan.active,
        start_date,
        end_date,
        customerId: customerTable.id,
        subscriptionplanId: subPlanTable.id,
        userId: session.metadata.userId,
      });

      await User.update(
        { subscriptionplanId: subPlanTable.id },
        { where: { id: session.metadata.userId } }
      );

      res.json({ message: "Subscription Success" });
    } catch (err) {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    }
  };
}

module.exports = new AuthController();
