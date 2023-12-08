const express = require("express");

const chatController = require("../controllers/chatController");

const chatAuth = require("../utils/chatAuth");

const router = express.Router();

router.get("/getlogin", chatAuth.isLogout, chatController.getLogin);

router.post("/postlogin", chatController.postLogin);

router.get("/logout", chatAuth.isLogin, chatController.logout);

router.get("/dashboard", chatAuth.isLogin, chatController.getDashboard);

router.post("/saveChat", chatController.saveChat)

module.exports = router;
