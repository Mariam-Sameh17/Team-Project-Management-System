const Project = require("../models/projectModel");

exports.createProject = async (req, res, next) => {
  try {
    body = req.body || {};
    const project = await Project.create({
      name: body.name,
      description: body.description,
      owner: req.user,
      members: [req.user],
    });
    await project.populate([
      { path: "owner", select: "name email phone -_id" },
      { path: "members", select: "name email phone -_id" },
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
    const projectName = req.body.name;

    if (!(req.body.newName || req.body.newDescription)) {
      throw new Error("Enter the new name or description");
    }

    const newName = req.body.newName;
    const newDescription = req.body.newDescription;
    const updates = {};
    if (newName) updates.name = newName;
    if (newDescription) updates.description = newDescription;

    const project = await Project.findOneAndUpdate(
      { name: projectName },
      updates,
      { new: true, runValidators: true },
    );
    project.owner = undefined;
    project.members = undefined;
    res.status(200).json({
      status: "success",
      data: project,
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
      { path: "owner", select: "name email phone -_id" },
      { path: "members", select: "name email phone -_id" },
    ]);
    res.status(200).json({
      status: "success",
      data: projects,
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
      { path: "owner", select: "name email phone -_id" },
      { path: "members", select: "name email phone -_id" },
    ]);
    res.status(200).json({
      status: "success",
      data: project,
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
