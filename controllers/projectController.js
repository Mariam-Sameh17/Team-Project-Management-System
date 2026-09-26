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
      { path: "owner", select: "name email phone" },
      { path: "members", select: "name email phone" },
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

    if (!(req.body.newName || req.body.newDescription)) {
      throw new Error("Enter the new name or description");
    }

    const newName = req.body.newName;
    const newDescription = req.body.newDescription;
    const updates = {};
    if (newName) updates.name = newName;
    if (newDescription) updates.description = newDescription;

    const project = await Project.findByIdAndUpdate(projectId, updates, {
      new: true,
      runValidators: true,
    });
    project.owner = undefined;
    project.members = undefined;
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

    const projects = await Project.find(filter).populate([
      { path: "owner", select: "name email phone " },
      { path: "members", select: "name email phone " },
    ]);
    res.status(200).json({
      status: "success",
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
      { path: "owner", select: "name email phone " },
      { path: "members", select: "name email phone " },
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
    await Project.deleteOne({ name: req.project.name });
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
    const userId = req.body.userId;

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
    await project.populate("members", "name email phone");

    res.status(200).json({
      status: "success",
      data: { project },
    });
  } catch (err) {
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
    const userId = req.body.userId;

    if (userId === project.owner.toString()) {
      return res.status(400).json({
        status: "fail",
        message: "Cannot remove the project owner",
        source: "removeMember",
      });
    }
    await Task.updateMany(
      { project: project._id, assignedTo: userId },
      { assignedTo: null },
    );
    project.members = project.members.filter((m) => m.toString() !== userId);
    await project.save();
    await project.populate("members", "name email phone");

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
