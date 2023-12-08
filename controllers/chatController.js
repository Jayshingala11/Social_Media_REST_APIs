const models = require("../models/indexModel");
const User = models.userModel;
const Chat = models.chatModel;
const SubscriptionPlan = models.subscriptionplanModel;

const { Op } = require("sequelize");

class ChatController {
  getLogin = async (req, res, next) => {
    try {
      res.render("login");
    } catch (error) {
      console.log(error.message);
    }
  };

  postLogin = async (req, res, next) => {
    try {
      const { email, password } = req.body;

      const user = await User.findOne({
        where: { email },
        include: SubscriptionPlan,
      });

      // console.log("User :::", user);

      if (user) {
        req.session.user = user;
        res.redirect("/dashboard");
      } else {
        res.render("login", { message: "Email & password is incorrect!" });
      }
    } catch (error) {
      console.log(error.message);
    }
  };

  logout = async (req, res, next) => {
    try {
      req.session.destroy((error) => {
        if (error) {
          console.error("Error destroying session:", error);
          throw error;
        }
        res.redirect("/getlogin");
      });
    } catch (error) {
      console.log(error.message);
    }
  };

  getDashboard = async (req, res, next) => {
    try {
      const users = await User.findAll({
        where: { id: { [Op.ne]: req.session.user.id } },
      });

      // console.log(users);
      res.render("dashboard", { user: req.session.user, users });
    } catch (error) {
      console.log(error.message);
    }
  };

  saveChat = async (req, res, next) => {
    try {
      const senderId = req.body.senderId;
      const receiverId = req.body.receiverId;
      let req_status = req.body.req_status;
      let existingRequest;

      existingRequest = await Chat.findOne({
        where: {
          sender_id: senderId,
          receiver_id: receiverId,
          req_status: false,
        },
      });

      if (existingRequest) {
        if (existingRequest.req_status === false) {
          res.status(200).json({
            success: false,
            msg: "Message request already sent. Pending approval.",
          });
          return;
        }
      }

      existingRequest = await Chat.findOne({
        where: {
          sender_id: senderId,
          receiver_id: receiverId,
          req_status: true,
        },
      });

      if (existingRequest) {
        if (existingRequest.req_status === true) {
          req_status = true;
        }
      }

      const chat = new Chat({
        sender_id: req.body.senderId,
        receiver_id: req.body.receiverId,
        message: req.body.message,
        req_status,
      });

      const chatData = await chat.save();
      res
        .status(200)
        .json({ success: true, msg: "Chat Inserted!", data: chatData, req_status });
    } catch (error) {
      res.status(400).send({ success: false, msg: error.message });
    }
  };
}

module.exports = new ChatController();
