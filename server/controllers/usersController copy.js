

const User = require("../models/usersModels");
const Role = require("../models/roleModels");
const cloudinary = require("../utils/cloudinary/cloudinary");
const bcrypt = require("bcryptjs");
const { createAuditLog } = require("../utils/auditLogger");

// CREATE USER
exports.createUser = async (req, res, next) => {
  // console.log("Incoming User Data:", req.body);
  try {
    const {
      name,
      email,
      phone,
      password,
      // confirmPassword,
      role,
      username, // Added for new UI
    } = req.body;

    // Validate required fields
    if (!name || !email || !phone || !password) {
      return res
        .status(400)
        .json({ message: "All required fields must be filled" });
    }

    const cleanPhone = phone.replace(/\D/g, '');

    // if (password !== confirmPassword) {
    //   return res.status(400).json({ message: "Passwords do not match" });
    // }

    // Check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already in use" });
    }
    const existingPhone = await User.findOne({ phone: cleanPhone });
    if (existingPhone) {
      return res.status(400).json({displayMessage:"Phone number already exists in the system", message:"Phone number already in use"})
    }

    // Check if username already exists
    if (username) {
      const existingUsername = await User.findOne({ username });
      if (existingUsername) {
        return res.status(400).json({ message: "Username already in use" });
      }
    }

    let profileImage = null;
    if (req.file) {
      const uploadedImage = await cloudinary.uploader.upload(req.file.path, {
        folder: "profile_images",
      });
      profileImage = {
        url: uploadedImage.secure_url,
        public_id: uploadedImage.public_id,
      };
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      name,
      username: username || email.split("@")[0], // Use email prefix as username if not provided
      email: email.toLowerCase(),
      phone:cleanPhone,
      password: hashedPassword,
      plainPassword:password,
      passwordChangedAt: new Date(),
      profileImage,
      role,
      status: "Active",
      // Removed: country, state, city, postalcode, address (not in new UI)
    });

    await newUser.save();

    await createAuditLog({
      user: req.user,
      module: "USER",
      action: "CREATE",
      description: `Created User: ${newUser.name}`,
      newData: newUser,
      req,
    });

    res
      .status(201)
      .json({ message: "User created successfully", user: newUser });
  } catch (error) {
    next(error);
    console.error("Error creating user:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// GET ALL USERS
exports.getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find()
      .populate("role")
      .select(
        "name plainPassword username email phone profileImage role status lastLogin createdAt"
      )
      .sort({ createdAt: -1 });

    // Format users for new UI - add permissions based on role
    const formattedUsers = users.map((user) => ({
      _id: user._id,
      name: user.name,
      password:user.password,
      plainPassword:user.plainPassword,
      email: user.email,
      phone: user.phone,
      username: user.username,
      avatar: user.profileImage?.url || null,
      role: user.role
        ? {
            _id: user.role._id,
            roleName: user.role.roleName,
          }
        : null,
      lastLogin: user.lastLogin || null,
      permissions: user.role?.permissions ? "Limited" : "Full", // Adjust based on your role permissions
      status: user.status,
    }));

    res.status(200).json(formattedUsers);
  } catch (error) {
    next(error);
    console.error("Error fetching users:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Helper function to format last login time
exports.formatLastLogin = (date) => {
  const now = new Date();
  const lastLogin = new Date(date);
  const diffMs = now - lastLogin;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
  return lastLogin.toLocaleDateString();
};

// GET USER BY ID
exports.getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).populate("role");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.status(200).json(user);
  } catch (error) {
    next(error);
    console.error("Error fetching user:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.userData = async (req, res, next) => {
  const id = req.params.id;
  try {
    const user = await User.findById(
      { _id: id },
      "name plainPassword username email role phone profileImage status lastLogin createdAt updatedAt"
    ).populate("role");

    if (user) {
      return res.status(200).send(user);
    } else {
      return res.status(400).send("User not found");
    }
  } catch (error) {
    next(error);
    res.status(500).send("Internal Server Error");
  }
};

// UPDATE USER
exports.updateUser = async (req, res, next) => {
  try {
    const {
      name,
      email,
      phone,
      username, // Added for new UI
      currentpassword,
      newpassword,
      confirmpassword,
      role,
      status,
    } = req.body;

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Store the old data before update
    const oldData = JSON.parse(JSON.stringify(user.toObject()));
    // clean phone number if provided
    let cleanPhone = phone;
    if (phone) {
      cleanPhone = phone.replace(/\D/g, '');
      // check if phone is being changed and if it's unique
      if (cleanPhone !== user.phone) {
        const existingPhone = await User.findOne({
          phone: cleanPhone,
          _id: { $ne: user._id } //Exlcude current user
        });
        if (existingPhone) {
          return res.status(400).json({
            displayMessage:"Phone number already in use"
          })
        }
      }
      user.phone = cleanPhone;
    }

    // Check if username is being changed and if it's unique
    if (username && username !== user.username) {
      const existingUsername = await User.findOne({ username, _id: { $ne: user._id } });
      
      if (
        existingUsername &&
        existingUsername._id.toString() !== user._id.toString()
      ) {
        return res.status(400).json({ message: "Username already in use" });
      }
      user.username = username;
    }
        // Check if email is being changed and if it's unique
    if (email && email.toLowerCase() !== user.email) {
      const existingEmail = await User.findOne({ 
        email: email.toLowerCase(),
        _id: { $ne: user._id } // Exclude current user
      });
      if (existingEmail) {
        return res.status(400).json({ message: "Email already in use" });
      }
      user.email = email.toLowerCase();
    }

    // Verify current password before making changes
    if (newpassword || confirmpassword) {
      if (!currentpassword) {
        return res.status(400).json({
          message: "Current password is required to change the password",
        });
      }
      const isMatch = await bcrypt.compare(currentpassword, user.password);
      if (!isMatch) {
        return res
          .status(400)
          .json({ message: "Current password is incorrect" });
      }
      if (newpassword !== confirmpassword) {
        return res.status(400).json({ message: "New passwords do not match" });
      }
      user.password = await bcrypt.hash(newpassword, 10);
      user.passwordChangedAt = new Date();
      // Invalidate all tokens after password change
      user.refreshTokens = [];
    }

    if (req.file) {
      if (user.profileImage?.public_id) {
        await cloudinary.uploader.destroy(user.profileImage.public_id);
      }
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: "profile_images",
      });
      user.profileImage = {
        url: result.secure_url,
        public_id: result.public_id,
      };
    }

    // Update other fields
    if (name) user.name = name;
    if (email) user.email = email.toLowerCase();
    if (phone) user.phone = phone;
    if (role) user.role = role;
    if (typeof status !== "undefined") user.status = status;

    const updatedUser = await user.save();

    await createAuditLog({
      user: req.user,
      module: "USER",
      action: "UPDATE",
      description: `Updated user: ${updatedUser.name}`,
      oldData,
      newData: updatedUser,
      req,
    });

    res
      .status(200)
      .json({ message: "User updated successfully", user: updatedUser });
  } catch (error) {
    next(error);
    console.error("Error updating user:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// DELETE USER
exports.deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.profileImage?.public_id) {
      await cloudinary.uploader.destroy(user.profileImage.public_id);
    }
    await user.deleteOne();

    await createAuditLog({
      user: req.user,
      module: "USER",
      action: "DELETE",
      description: `Deleted user: ${user.name}`,
      oldData: user,
      req,
    });

    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    next(error);
    console.error("Error deleting user:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// GET ACTIVE USERS
exports.getActiveUsers = async (req, res, next) => {
  try {
    const activeUsers = await User.find({ status: "Active" })
      .populate("role")
      .sort({ createdAt: -1 });

    res.status(200).json({
      message: "Active users fetched successfully",
      total: activeUsers.length,
      users: activeUsers,
    });
  } catch (error) {
    next(error);
    console.error("Get Active Users Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// SEARCH USERS BY EMAIL OR NAME
exports.searchUsersByEmail = async (req, res, next) => {
  try {
    const { query } = req.query;

    if (!query || query.trim().length === 0) {
      return res.status(400).json({ message: "Search query is required" });
    }

    const users = await User.find({
      $or: [
        { email: { $regex: query, $options: "i" } },
        { name: { $regex: query, $options: "i" } },
        { username: { $regex: query, $options: "i" } },
      ],
    })
      .select("name email profileImage _id username phone")
      .limit(10)
      .sort({ name: 1 });

    res.status(200).json({
      message: "Users found successfully",
      total: users.length,
      users: users,
    });
  } catch (error) {
    next(error);
    console.error("Search Users Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.getMyProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate("role");
    if (!user) return res.status(404).json({ message: "User not found" });

    res.status(200).json({ user });
  } catch (error) {
    next(error);
    console.error("Error fetching profile:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// FOR TWO FACTOR AUTH
exports.toggleTwoFactor = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    user.twoFactorEnabled = !user.twoFactorEnabled;
    await user.save();
    return res.status(200).json({
      message: `Two-factor authentication ${
        user.twoFactorEnabled ? "enabled" : "disabled"
      } successfully`,
      twoFactorEnabled: user.twoFactorEnabled,
    });
  } catch (error) {
    next(error);
    console.error("Toggle 2FA error", error);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

// FOR ACTIVATE AND DEACTIVATE ACCOUNT
exports.toggleAccountStatus = async (req, res, next) => {
  const { id } = req.params;
  // console.log("Toggle status for user ID:", id);

  try {
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Cycle through statuses: Active -> Inactive -> Blacklist -> Active
    if (user.status === "Active") {
      user.status = "Inactive";
    } else if (user.status === "Inactive") {
      user.status = "Blacklist";
    } else {
      user.status = "Active";
    }

    await user.save();
    res.status(200).json({
      status: user.status,
    });
  } catch (error) {
    next(error);
    console.error("Toggle error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// BULK DELETE USERS
exports.bulkDeleteUsers = async (req, res, next) => {
  try {
    const { ids } = req.body;
    if (!ids || !ids.length) {
      return res.status(400).json({ message: "No user IDs provided" });
    }

    const users = await User.find({ _id: { $in: ids } });
    for (const user of users) {
      if (user.profileImage && user.profileImage.public_id) {
        try {
          await cloudinary.uploader.destroy(user.profileImage.public_id);
        } catch (error) {
          console.warn(
            `Cloudinary delete failed for user ${user._id}: ${error.message}`
          );
        }
      }
    }

    await User.deleteMany({ _id: { $in: ids } });
    res.status(200).json({
      message: "Users deleted successfully",
      deletedCount: users.length,
    });
  } catch (error) {
    next(error);
    console.error("Bulk Delete Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// UPDATE LAST LOGIN (For new UI)
exports.updateLastLogin = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.lastLogin = new Date();
    await user.save();

    res.status(200).json({
      message: "Last login updated",
      lastLogin: user.lastLogin,
      formattedLastLogin: this.formatLastLogin(user.lastLogin),
    });
  } catch (error) {
    next(error);
    console.error("Update last login error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

