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
    const taskId = req.params.taskId;
    if (!taskId || taskId == ":taskId") {
      throw new Error("Task id is required");
    }

    const body = req.body || {};
    const { title, description, status, priority } = body;
    if (!(title || description || status || priority)) {
      throw new Error("Enter the feild you want to update");
    }

    const updates = {};
    if (title) updates.title = title;
    if (description) updates.description = description;
    if (status) updates.status = status;
    if (priority) updates.priority = priority;
    const isOwner = req.user.id == req.project.owner.toString();
    if (!isOwner) {
      const task = await Task.findById(taskId);
      let isAssigned;
      if (task.assignedTo)
        isAssigned = req.user.id == task.assignedTo.toString();
      if (!isAssigned || !task.assignedTo) {
        return res.status(403).json({
          status: "fail",
          message: "Only assigned member can edit task",
          source: "updateTask",
        });
      }
    }
    const task = await Task.findByIdAndUpdate(taskId, updates, {
      new: true,
      runValidators: true,
    });

    if (!task) {
      return res.status(404).json({
        status: "fail",
        message: "Task not found",
        source: "updateTask",
      });
    }

    res.status(200).json({
      status: "success",
      data: { task },
    });
  } catch (err) {
    if (err.name === "CastError") {
      return res.status(400).json({
        status: "fail",
        message: "Invalid task id",
        source: "updateTask",
      });
    }

    if (err.code === 11000) {
      return res.status(400).json({
        status: "fail",
        message: "This task title is already used in this project",
        source: "updateTask",
      });
    }

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

    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;
    if (query.status) filter.status = query.status;
    if (query.priority) filter.priority = query.priority;

    const sortBy = query.sort ? query.sort.split(",").join(" ") : "-createdAt";
    const tasks = await Task.find(filter).sort(sortBy).skip(skip).limit(limit);
    const total = await Task.countDocuments(filter);

    res.status(200).json({
      status: "success",
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
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
    const taskId = req.params.taskId;
    if (!taskId || taskId == ":taskId") {
      throw new Error("Task id is required");
    }

    const task = await Task.findById(taskId);

    if (!task) {
      return res.status(404).json({
        status: "fail",
        message: "Task not found",
        source: "findTask",
      });
    }
    res.status(200).json({
      status: "success",
      data: { task },
    });
  } catch (err) {
    if (err.name === "CastError") {
      return res.status(400).json({
        status: "fail",
        message: "Invalid task id",
        source: "findTask",
      });
    }
    res.status(400).json({
      status: "fail",
      message: err.message,
      source: "findTask",
    });
  }
};

exports.deleteTask = async (req, res, next) => {
  try {
    const taskId = req.params.taskId;
    if (!taskId || taskId == ":taskId") {
      throw new Error("Task id is required");
    }
    const task = await Task.findByIdAndDelete(taskId);
    if (!task) {
      return res.status(404).json({
        status: "fail",
        message: "Task not found",
        source: "findTask",
      });
    }
    res.status(200).json({
      status: "success",
    });
  } catch (err) {
    if (err.name === "CastError") {
      return res.status(400).json({
        status: "fail",
        message: "Invalid task id",
        source: "deleteTask",
      });
    }
    res.status(400).json({
      status: "fail",
      message: err.message,
      source: "deleteTask",
    });
  }
};

exports.assignTask = async (req, res, next) => {
  try {
    const taskId = req.params.taskId;
    if (!taskId || taskId == ":taskId") {
      throw new Error("Task id is required");
    }
    const project = req.project;
    const body = req.body || {};
    const { userId } = body;

    if (!userId) {
      return res.status(400).json({
        status: "fail",
        message: "User id is required",
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

    await task.populate("assignedTo", "userName email phone");

    res.status(200).json({
      status: "success",
      data: { task },
    });
  } catch (err) {
    if (err.name === "CastError") {
      return res.status(400).json({
        status: "fail",
        message: "Invalid task id",
        source: "assignTask",
      });
    }
    res.status(400).json({
      status: "fail",
      message: err.message,
      source: "assignTask",
    });
  }
};

exports.unassignTask = async (req, res, next) => {
  try {
    const taskId = req.params.taskId;
    if (!taskId || taskId == ":taskId") {
      throw new Error("Task id is required");
    }
    const project = req.project;

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
