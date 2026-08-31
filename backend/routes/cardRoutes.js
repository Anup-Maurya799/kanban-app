import express from "express";
import {
  createCard,
  getCardsByBoard,
  getCardById,
  updateCard,
  moveCard,
  addComment,
  deleteCard,
} from "../controllers/cardController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", protect, createCard);
router.get("/board/:boardId", protect, getCardsByBoard);
router.put("/move", protect, moveCard);
router.get("/:id", protect, getCardById);
router.put("/:id", protect, updateCard);
router.post("/:id/comments", protect, addComment);
router.delete("/:id", protect, deleteCard);

export default router;
