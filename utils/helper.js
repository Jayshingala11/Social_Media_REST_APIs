var jwt = require("jsonwebtoken");
const secret =
  "DHJWKJSBVKDISDBVJEWJSDHJDSHFJLSDHVJEWBGJDSUIEBF13UHUEUFHWE18HUEWHUE83HDODJVJXZ";
const nodemailer = require("nodemailer");
const sendgridTrasport = require("nodemailer-sendgrid-transport");
const { validationResult } = require("express-validator");

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
}

module.exports = new Helper();
