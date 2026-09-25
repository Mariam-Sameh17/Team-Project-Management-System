const mongoose = require("mongoose");

const projectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      required: [true, "Project name is required"],
      unique: [true, "This project name is already used"],
    },
    description: {
      type: String,
      trim: true,
    },
    owner: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
    },
    members: [{ type: mongoose.Schema.ObjectId, ref: "User" }],
  },
  { timestamps: true },
);

projectSchema.set("toJSON", {
  transform: (doc, ret) => {
    delete ret.__v;
    delete ret._id;
    return ret;
  },
});

const Project = mongoose.model("Project", projectSchema);
module.exports = Project;
