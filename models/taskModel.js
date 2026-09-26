const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Task title is required"],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: {
        values: ["To Do", "In progress", "Done"],
        message: "Status must be To Do, In progress, or Done",
      },
      default: "To Do",
    },
    priority: {
      type: String,
      enum: {
        values: ["Low", "Medium", "High"],
        message: "Priority must be Low, Medium, or High",
      },
      default: "Medium",
    },
    project: {
      type: mongoose.Schema.ObjectId,
      ref: "Project",
      required: [true, "A task must belong to a project"],
    },
    assignedTo: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true },
);
taskSchema.set("toJSON", {
  transform: (doc, ret) => {
    delete ret.__v;
    delete ret._id;
    return ret;
  },
});
taskSchema.index({ project: 1, title: 1 }, { unique: true });
const Task = mongoose.model("Task", taskSchema);
module.exports = Task;
