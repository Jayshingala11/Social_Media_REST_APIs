var jwt = require("jsonwebtoken");
const secret =
  "DHJWKJSBVKDISDBVJEWJSDHJDSHFJLSDHVJEWBGJDSUIEBF13UHUEUFHWE18HUEWHUE83HDODJVJXZ";
const nodemailer = require("nodemailer");
const sendgridTrasport = require("nodemailer-sendgrid-transport");
const { validationResult } = require("express-validator");

const User = require("../models/userModel");

const passport = require("passport");
const JwtStrategy = require("passport-jwt").Strategy;
const ExtractJwt = require("passport-jwt").ExtractJwt;

const transporter = nodemailer.createTransport(
  sendgridTrasport({
    auth: {
      api_key:
        "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",
    },
  })
);

class Helper {
  validateRequest = (req) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      const error = new Error("Validation Failed.");
      error.statusCode = 422;
      error.data = errors.array();
      throw error;
    }
  };

  async generateToken(body, expiresIn) {
    return new Promise((resolve, reject) => {
      let token = jwt.sign(
        {
          data: body,
        },
        secret,
        { expiresIn: expiresIn }
      );

      resolve(token);
    });
  }

  async sendVerificationEmail(mailOptions) {
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error(error);
      } else {
        console.log("Email sent: " + info.response);
      }
    });
  }

  verifyToken = (req, res, next) => {
    const token = req.headers.token;
    console.log("Token is :::", token);
    let decodedToken;
    try {
      decodedToken = jwt.verify(token, secret);
    } catch (err) {
      // err.message = "Not Authorized";
      err.statusCode = 401;
      throw err;
    }
    if (!decodedToken) {
      const error = new Error("Not authenticated.");
      error.statusCode = 401;
      throw error;
    }
    console.log("DecdedToken", decodedToken);
    req.data = decodedToken.data;
    next();
  };

  constructor() {
    const jwtOptions = {
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: secret,
    };

    passport.use(
      new JwtStrategy(jwtOptions, async function (jwt_payload, done) {
        const userData = await User.findOne({
          where: {
            id: jwt_payload.data.id,
          },
          attributes: ["id", "email"],
        });

        if (userData) {
          return done(null, userData.dataValues);
        } else {
          return done(null, false);
        }
      })
    );
  }

  calculateInterest = async (amount, interest_rate, interest_days) => {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth() + 1;
    const lastDayOfMonth = new Date(year, month, 0);
    const numberOfDays = lastDayOfMonth.getDate();
    const interestOfMonth = (amount * interest_rate) / 100;
    const interest = (interestOfMonth / numberOfDays) * interest_days;
    const roundedInterest = Math.round(interest * 100) / 100;
    return roundedInterest;
  };

  isDateFromPreviousMonth = async (date) => {
    const today = new Date();
    const lastMonth = new Date(
      today.getFullYear(),
      today.getMonth() - 1,
      today.getDate()
    );

    return (
      date.getMonth() === lastMonth.getMonth() &&
      date.getFullYear() === lastMonth.getFullYear()
    );
  };

  getLastDayOfCurrentMonth = async (date) => {
    const today = date;
    const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
    const lastDay = new Date(nextMonth - 1);

    return lastDay;
  };

  getDaysDifference = async (date1, date2) => {
    const daysDifference = Math.floor((date1 - date2) / (1000 * 60 * 60 * 24) + 1);

    return daysDifference;
  };
}

module.exports = new Helper();
