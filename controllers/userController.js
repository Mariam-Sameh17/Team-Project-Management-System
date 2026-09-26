const User = require("../models/userModel");

const Project = require("../models/projectModel");
const Task = require("../models/taskModel");

exports.profile = async (req, res) => {
  try {
    const user = await User.findOne({ userName: req.user.userName }).select(
      "-__v -password",
    );

    const ownedProjects = await Project.find({ owner: user._id }).select(
      "name description createdAt",
    );

    const assignedTasks = await Task.find({ assignedTo: user._id })
      .select("title status priority project")
      .populate("project", "name");

    res.status(200).json({
      status: "success",
      data: {
        user,
        ownedProjects,
        assignedTasks,
      },
    });
  } catch (err) {
    res.status(400).json({
      status: "fail",
      message: err.message,
      source: "profile",
    });
  }
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
