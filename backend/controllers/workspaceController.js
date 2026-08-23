import Workspace from "../models/Workspace.js";
import User from "../models/User.js";

export const createWorkspace = async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({ message: "Workspace name is required" });
    }

    const workspace = await Workspace.create({
      name,
      description,
      owner: req.user._id,
      members: [{ user: req.user._id, role: "admin" }],
    });

    res.status(201).json(workspace);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getWorkspaces = async (req, res) => {
  try {
    const workspaces = await Workspace.find({
      "members.user": req.user._id,
    }).populate("owner", "name email");

    res.json(workspaces);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getWorkspaceById = async (req, res) => {
  try {
    const workspace = await Workspace.findById(req.params.id)
      .populate("owner", "name email")
      .populate("members.user", "name email avatar");

    if (!workspace) {
      return res.status(404).json({ message: "Workspace not found" });
    }

    res.json(workspace);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const inviteMember = async (req, res) => {
  try {
    const { email } = req.body;
    const workspace = await Workspace.findById(req.params.id);

    if (!workspace) {
      return res.status(404).json({ message: "Workspace not found" });
    }

    const isAdmin = workspace.members.some(
      (m) =>
        m.user.toString() === req.user._id.toString() && m.role === "admin",
    );
    if (!isAdmin) {
      return res
        .status(403)
        .json({ message: "Only admins can invite members" });
    }

    const invitedUser = await User.findOne({ email });
    if (!invitedUser) {
      return res.status(404).json({ message: "No user found with this email" });
    }

    const alreadyMember = workspace.members.some(
      (m) => m.user.toString() === invitedUser._id.toString(),
    );
    if (alreadyMember) {
      return res.status(400).json({ message: "User is already a member" });
    }

    workspace.members.push({ user: invitedUser._id, role: "member" });
    await workspace.save();

    res.json({ message: "Member added successfully", workspace });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
