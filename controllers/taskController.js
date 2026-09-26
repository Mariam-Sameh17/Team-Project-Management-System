const Task = require("../models/taskModel");

exports.createTask = async (req, res, next) => {
  try {
    const body = req.body || {};
    const task = await Task.create({
      title: body.title,
      description: body.description,
      status: body.status,
      priority: body.priority,
      project: req.project.id,
    });

    res.status(201).json({
      status: "success",
      data: {
        task,
      },
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({
        status: "fail",
        message: "This task name is already used in this project",
        source: "createTask",
      });
    }
    res.status(400).json({
      status: "fail",
      message: err.message,
      source: "createTask",
    });
  }
};

exports.updateTask = async (req, res, next) => {
  try {
    const taskTitle = req.body.title;
    const { newTitle, description, status, priority } = req.body;
    if (!(newTitle || description || status || priority)) {
      throw new Error("Enter the feild you want to update");
    }

    const updates = { title: newTitle, description, status, priority };

    const project = req.project;
    const task = await Task.findOneAndUpdate(
      { title: taskTitle, project: project._id },
      updates,
      { new: true, runValidators: true },
    );

    res.status(200).json({
      status: "success",
      data: { task },
    });
  } catch (err) {
    res.status(400).json({
      status: "fail",
      message: err.message,
      source: "updateTask",
    });
  }
};

exports.findTasks = async (req, res, next) => {
  try {
    const query = req.query || {};
    const filter = { project: req.project._id };
    if (query.title) {
      filter.title = { $regex: query.title, $options: "i" };
    }

    const tasks = await Task.find(filter);
    res.status(200).json({
      status: "success",
      data: { tasks },
    });
  } catch (err) {
    res.status(400).json({
      status: "fail",
      message: err.message,
      source: "findTasks",
    });
  }
};

exports.findTask = async (req, res, next) => {
  try {
    query = req.query || {};
    const { title } = query;
    if (!title) {
      throw new Error("Task title is required");
    }
    const task = await Task.findOne({ project: req.project._id, title: title });
    res.status(200).json({
      status: "success",
      data: { task },
    });
  } catch (err) {
    res.status(400).json({
      status: "fail",
      message: err.message,
      source: "findTask",
    });
  }
};

exports.deleteTask = async (req, res, next) => {
  try {
    const { title } = req.body;
    if (!title) {
      throw new Error("Task title is required");
    }
    await Task.deleteOne({ project: req.project._id, title: title });
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

exports.assignTask = async (req, res, next) => {
  try {
    const project = req.project;
    const { taskId, userId } = req.body;

    if (!taskId || !userId) {
      return res.status(400).json({
        status: "fail",
        message: "Task id and User id are required",
        source: "assignTask",
      });
    }

    const isOwner = project.owner.toString() === userId;
    const isMember = project.members.some((m) => m.toString() === userId);
    if (!isOwner && !isMember) {
      return res.status(400).json({
        status: "fail",
        message: "Assignee must be a member of this project",
        source: "assignTask",
      });
    }

    const task = await Task.findOneAndUpdate(
      { _id: taskId, project: project._id },
      { assignedTo: userId },
      { new: true, runValidators: true },
    );

    if (!task) {
      return res.status(404).json({
        status: "fail",
        message: "Task not found in this project",
        source: "assignTask",
      });
    }

    await task.populate("assignedTo", "name email phone");

    res.status(200).json({
      status: "success",
      data: { task },
    });
  } catch (err) {
    res.status(400).json({
      status: "fail",
      message: err.message,
      source: "assignTask",
    });
  }
};

exports.unassignTask = async (req, res, next) => {
  try {
    const project = req.project;
    const { taskId } = req.body;

    if (!taskId) {
      return res.status(400).json({
        status: "fail",
        message: "Task id is required",
        source: "unassignTask",
      });
    }

    const task = await Task.findOneAndUpdate(
      { _id: taskId, project: project._id },
      { assignedTo: null },
      { new: true },
    );

    if (!task) {
      return res.status(404).json({
        status: "fail",
        message: "Task not found in this project",
        source: "unassignTask",
      });
    }

    res.status(200).json({
      status: "success",
      data: { task },
    });
  } catch (err) {
    res.status(400).json({
      status: "fail",
      message: err.message,
      source: "unassignTask",
    });
  }
};
