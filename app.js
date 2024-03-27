const path = require("path");
const http = require("http");
const express = require("express");
const { Server } = require("socket.io");

const bodyParser = require("body-parser");
const session = require("express-session");
const expressHbs = require("express-handlebars");
const { Op } = require("sequelize");

const sequelize = require("./utils/database");
const models = require("./models/indexModel");
const User = models.userModel;
const Chat = models.chatModel;

const app = express();
const httpServer = http.createServer(app);
const io = new Server(httpServer);

const usp = io.of("/user-namespace");

usp.on("connection", async (socket) => {
  console.log("User Connected");

  const userId = socket.handshake.auth.token;
  console.log("UserId is :::", userId);

  await User.update({ status: "1" }, { where: { id: userId } });

  const users = await User.findAll({ where: { status: "1" } });

  // user broadcast online
  socket.broadcast.emit("getOnlineUser", { users });

  socket.on("disconnect", async () => {
    console.log("User Disconnected");

    const userId = socket.handshake.auth.token;

    await User.update({ status: "0" }, { where: { id: userId } });

    const users = await User.findAll({ where: { status: "0" } });

    // user broadcast offline
    socket.broadcast.emit("getOfflineUser", { users });
  });

  // Chatting
  socket.on("newChat", (data) => {
    socket.broadcast.emit("loadNewChat", data);
  });

  // Load old chat
  socket.on("existsChat", async (data) => {
    const chats = await Chat.findAll({
      where: {
        [Op.or]: [
          {
            sender_id: data.senderId,
            receiver_id: data.receiverId,
          },
          {
            sender_id: data.receiverId,
            receiver_id: data.senderId,
          },
        ],
      },
      order: [["id", "ASC"]],
    });

    if (chats.length !== 0) {
      if (chats[0].req_status === false && chats[0].sender_id != data.senderId) {
        socket.emit("messageReqStatus", chats[0]);
      } else {
        socket.emit("loadOldChat", { chats });
      }
    } else {
      socket.emit("loadOldChat", { chats });
    }
  });

  socket.on("updateReqStatus", async (data) => {
    await Chat.update(
      { req_status: true },
      { where: { sender_id: data.receiverId, receiver_id: data.senderId } }
    );

    const chats = await Chat.findAll({
      where: {
        [Op.or]: [
          {
            sender_id: data.senderId,
            receiver_id: data.receiverId,
          },
          {
            sender_id: data.receiverId,
            receiver_id: data.senderId,
          },
        ],
      },
      order: [["id", "ASC"]],
    });

    socket.emit("loadOldChat", { chats });
  });
});

const hbs = expressHbs.create({});
hbs.handlebars.registerHelper("eq", function (a, b, options) {
  if (a === b) {
    return options.fn ? options.fn(this) : "";
  } else {
    return options.inverse ? options.inverse(this) : "";
  }
});

app.engine(
  "hbs",
  expressHbs.engine({
    layoutsDir: "views/layouts/",
    defaultLayout: "main",
    extname: "hbs",
  })
);
app.set("view engine", "hbs");
app.set("views", "views");

app.use(express.static(path.join(__dirname, "public")));

// Router Import
const indexRoutes = require("./routes/indexRoutes");

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(
  session({
    secret: "my secret",
    resave: false,
    saveUninitialized: false,
  })
);

app.use((req, res, next) => {
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type",
    "Authorization"
  );
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, PATCH, DELETE"
  );
  res.setHeader("Access-Control-Allow-Origin", "*");
  next();
});

// Routes
app.use(indexRoutes);

// Error Handler
app.use((error, req, res, next) => {
  console.log(error);
  const status = error.statusCode || 500;
  const message = error.message;
  const data = error.data;
  res.status(status).json({ message: message, data: data });
});

// Server Running
sequelize
  .sync() // { force: true }
  .then(() => {
    httpServer.listen(3000);
    // const io = require("./socket").init(httpServer);
    // io.on("connection", (socket) => {
    //   console.log("Client Connected");
    // });
  })
  .catch((err) => {
    console.log(err);
  });
