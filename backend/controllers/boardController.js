import Board from "../models/Board.js";
import Workspace from "../models/Workspace.js";
import List from "../models/List.js";
import Card from "../models/Card.js";

// @route POST /api/boards
export const createBoard = async (req, res) => {
  try {
    const { title, workspaceId, background } = req.body;

    if (!title || !workspaceId) {
      return res
        .status(400)
        .json({ message: "Title and workspaceId are required" });
    }

    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) {
      return res.status(404).json({ message: "Workspace not found" });
    }

    const isMember = workspace.members.some(
      (m) => m.user.toString() === req.user._id.toString(),
    );
    if (!isMember) {
      return res
        .status(403)
        .json({ message: "Not a member of this workspace" });
    }

    const board = await Board.create({
      title,
      workspace: workspaceId,
      background: background || "#6C63FF",
      createdBy: req.user._id,
    });

    res.status(201).json(board);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route GET /api/boards/workspace/:workspaceId
export const getBoardsByWorkspace = async (req, res) => {
  try {
    const boards = await Board.find({ workspace: req.params.workspaceId }).sort(
      {
        createdAt: -1,
      },
    );
    res.json(boards);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route GET /api/boards/:id
export const getBoardById = async (req, res) => {
  try {
    const board = await Board.findById(req.params.id).populate(
      "createdBy",
      "name email",
    );
    if (!board) {
      return res.status(404).json({ message: "Board not found" });
    }
    res.json(board);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route PUT /api/boards/:id
export const updateBoard = async (req, res) => {
  try {
    const { title, background } = req.body;
    const board = await Board.findById(req.params.id);
    if (!board) {
      return res.status(404).json({ message: "Board not found" });
    }

    if (title) board.title = title;
    if (background) board.background = background;
    await board.save();

    res.json(board);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route DELETE /api/boards/:id
export const deleteBoard = async (req, res) => {
  try {
    const board = await Board.findById(req.params.id);
    if (!board) {
      return res.status(404).json({ message: "Board not found" });
    }

    // Cascade delete: remove all lists and cards under this board
    await Card.deleteMany({ board: board._id });
    await List.deleteMany({ board: board._id });
    await board.deleteOne();

    res.json({ message: "Board deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
