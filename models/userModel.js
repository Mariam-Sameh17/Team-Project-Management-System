const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");
const userSchema = new mongoose.Schema({
  userName: {
    type: String,
    required: [true, "User name is required"],
    unique: [true, "This user name is already used"],
    match: [
      /^[a-zA-Z0-9_.]+$/,
      "Username can only contain letters, numbers, _ and .",
    ],
  },
  email: {
    type: String,
    required: [true, "Email is required"],
    unique: [true, "This email is already used"],
    lowercase: true,
    validate: [validator.isEmail, "Enter a valid email"],
  },
  phone: {
    type: String,
    required: [true, "Phone is required"],
    unique: [true, "This phone number is already used"],
    match: [/^\d{11}$/, "Phone number must be 11 digits"],
  },
  password: {
    type: String,
    required: [true, "Password is required"],
  },
  passConfirm: {
    type: String,
    required: [true, "Password confirmation is required"],
    validate: {
      validator: function (x) {
        return x === this.password;
      },
      message: "Not the same password",
    },
  },
});
userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 12);
  this.passConfirm = undefined;
});
const User = mongoose.model("User", userSchema);
module.exports = User;
