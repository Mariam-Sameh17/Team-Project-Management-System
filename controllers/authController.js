const { promisify } = require("util");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/userModel");

const finalResponse = (user, res, statusCode) => {
  const userName = user.userName;
  const token = jwt.sign({ userName }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000,
    ),
    httpOnly: true,
    sameSite: "none",
  };
  cookieOptions.secure = true;

  res.cookie("jwt", token, cookieOptions);

  user.password = undefined;
  res.status(statusCode).json({
    status: "success",
    data: {
      user,
    },
  });
};

exports.signup = async (req, res, next) => {
  try {
    const user = await User.create({ ...req.body });
    finalResponse(user, res, 201);
  } catch (err) {
    res.status(400).json({
      status: "fail",
      message: err.message,
    });
  }
};

exports.login = async (req, res, next) => {
  const { identifier, password } = req.body;

  if (!identifier || !password) {
    return res.status(400).json({
      status: "fail",
      message: "Please provide your username or email and password",
    });
  }

  const query = identifier.includes("@")
    ? { email: identifier.toLowerCase() }
    : { userName: identifier };

  const user = await User.findOne(query);

  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({
      status: "fail",
      message: "Incorrect (userName/email) or Password",
    });
  }

  finalResponse(user, res, 200);
};

exports.logout = async (req, res, next) => {
  res.clearCookie("jwt", {
    httpOnly: true,
    secure: true,
    sameSite: "none",
  });
  res.status(200).json({
    status: "success",
  });
};

exports.protect = async (req, res, next) => {
  let token;
  if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }
  if (!token)
    return res.status(401).json({
      status: "fail",
      message: "Login first to access this page",
    });
  let decoded;
  try {
    decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
  } catch (err) {
    return res.status(401).json({
      status: "fail",
      message: err.message,
    });
  }

  const user = await User.findOne({
    userName: decoded.userName,
  });

  if (!user) {
    return res.status(401).json({
      status: "fail",
      message: "The User no longer exist",
    });
  }

  req.user = user;
  next();
};
