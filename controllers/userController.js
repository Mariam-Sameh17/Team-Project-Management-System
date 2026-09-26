const User = require("../models/userModel");

exports.profile = async (req, res) => {
  const user = await User.findOne({ userName: req.user.userName }).select(
    "-_id -__v -password",
  );

  res.status(200).json({
    status: "success",
    data: {
      user,
    },
  });
};

exports.findUsers = async (req, res, next) => {
  try {
    const query = req.query || {};
    const filter = {};

    if (query.name) {
      filter.userName = { $regex: query.name, $options: "i" };
    }

    const users = await User.find(filter).select("userName email phone");

    res.status(200).json({
      status: "success",
      data: { users },
    });
  } catch (err) {
    res.status(400).json({
      status: "fail",
      message: err.message,
      source: "findUsers",
    });
  }
};
