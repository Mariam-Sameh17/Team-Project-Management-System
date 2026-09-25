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
