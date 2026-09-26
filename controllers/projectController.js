const Project = require("../models/projectModel");
const Task = require("../models/taskModel");
const User = require("../models/userModel");

exports.createProject = async (req, res, next) => {
  try {
    const body = req.body || {};
    const project = await Project.create({
      name: body.name,
      description: body.description,
      owner: req.user.id,
    });
    await project.populate([
      { path: "owner", select: "userName email phone" },
      { path: "members", select: "userName email phone" },
    ]);
    res.status(201).json({
      status: "success",
      data: {
        project,
      },
    });
  } catch (err) {
    res.status(400).json({
      status: "fail",
      message: err.message,
      source: "createProject",
    });
  }
};

exports.updateProject = async (req, res, next) => {
  try {
    const projectId = req.project._id;

    const body = req.body || {};
    if (!(body.name || body.description)) {
      throw new Error("Enter the new name or description");
    }

    const name = req.body.name;
    const description = req.body.description;
    const updates = {};
    if (name) updates.name = name;
    if (description) updates.description = description;

    const project = await Project.findByIdAndUpdate(projectId, updates, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      status: "success",
      data: { project },
    });
  } catch (err) {
    res.status(400).json({
      status: "fail",
      message: err.message,
      source: "updateProject",
    });
  }
};

exports.findProjects = async (req, res, next) => {
  try {
    const query = req.query || {};
    const filter = {
      $or: [{ owner: req.user.id }, { members: req.user.id }],
    };
    if (query.name) {
      filter.name = { $regex: query.name, $options: "i" };
    }

    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;

    const sortBy = query.sort ? query.sort.split(",").join(" ") : "-createdAt";
    const projects = await Project.find(filter)
      .sort(sortBy)
      .populate([
        { path: "owner", select: "userName email phone" },
        { path: "members", select: "userName email phone" },
      ])
      .skip(skip)
      .limit(limit);
    const total = await Project.countDocuments(filter);

    res.status(200).json({
      status: "success",
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      data: { projects },
    });
  } catch (err) {
    res.status(400).json({
      status: "fail",
      message: err.message,
      source: "findProjects",
    });
  }
};

exports.findProject = async (req, res, next) => {
  try {
    const project = req.project;
    await project.populate([
      { path: "owner", select: "userName email phone " },
      { path: "members", select: "userName email phone " },
    ]);

    const stats = await Task.aggregate([
      { $match: { project: project._id } },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);
    const progress = { "To Do": 0, "In progress": 0, Done: 0 };
    stats.forEach((s) => {
      progress[s._id] = s.count;
    });
    const total = stats.reduce((sum, s) => sum + s.count, 0);

    res.status(200).json({
      status: "success",
      data: { project },
      progress: { ...progress, total },
    });
  } catch (err) {
    res.status(400).json({
      status: "fail",
      message: err.message,
      source: "findProject",
    });
  }
};

exports.deleteProject = async (req, res, next) => {
  try {
    await Task.deleteMany({ project: req.project._id });
    await Project.deleteOne({ _id: req.project._id });
    res.status(200).json({
      status: "success",
    });
  } catch (err) {
    res.status(400).json({
      status: "fail",
      message: err.message,
      source: "deleteProject",
    });
  }
};

exports.addMember = async (req, res, next) => {
  try {
    const project = req.project;
    const body = req.body || {};
    const userId = body.userId;

    if (!userId) {
      return res.status(400).json({
        status: "fail",
        message: "User id is required",
        source: "addMember",
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        status: "fail",
        message: "User not found",
        source: "addMember",
      });
    }

    const alreadyMember = project.members.some((m) => m.toString() === userId);
    if (alreadyMember) {
      return res.status(400).json({
        status: "fail",
        message: "User is already a member of this project",
        source: "addMember",
      });
    }

    project.members.push(userId);
    await project.save();
    await project.populate("members", "userName email phone");

    res.status(200).json({
      status: "success",
      data: { project },
    });
  } catch (err) {
    if (err.name === "CastError") {
      return res.status(400).json({
        status: "fail",
        message: "Invalid user id",
        source: "addMember",
      });
    }
    res.status(400).json({
      status: "fail",
      message: err.message,
      source: "addMember",
    });
  }
};

exports.removeMember = async (req, res, next) => {
  try {
    const project = req.project;
    const body = req.body || {};
    const userId = body.userId;

    if (!userId) {
      return res.status(400).json({
        status: "fail",
        message: "User id is required",
        source: "removeMember",
      });
    }

    if (userId === project.owner.toString()) {
      return res.status(400).json({
        status: "fail",
        message: "Cannot remove the project owner",
        source: "removeMember",
      });
    }
    const alreadyMember = project.members.some((m) => m.toString() === userId);
    if (!alreadyMember) {
      return res.status(400).json({
        status: "fail",
        message: "User is not a member of this project",
        source: "removeMember",
      });
    }
    await Task.updateMany(
      { project: project._id, assignedTo: userId },
      { assignedTo: null },
    );
    project.members = project.members.filter((m) => m.toString() !== userId);
    await project.save();
    await project.populate("members", "userName email phone");

    res.status(200).json({
      status: "success",
      data: { project },
    });
  } catch (err) {
    res.status(400).json({
      status: "fail",
      message: err.message,
      source: "removeMember",
    });
  }
};
