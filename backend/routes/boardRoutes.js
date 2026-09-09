import express from "express";
import {
  createBoard,
  getBoardsByWorkspace,
  getBoardById,
  updateBoard,
  deleteBoard,
  getFullBoardData,
} from "../controllers/boardController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", protect, createBoard);
router.get("/workspace/:workspaceId", protect, getBoardsByWorkspace);
router.get("/:id/full", protect, getFullBoardData);
router.get("/:id", protect, getBoardById);
router.put("/:id", protect, updateBoard);
router.delete("/:id", protect, deleteBoard);

export default router;
