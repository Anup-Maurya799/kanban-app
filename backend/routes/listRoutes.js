import express from "express";
import {
  createList,
  getListsByBoard,
  updateList,
  reorderLists,
  deleteList,
} from "../controllers/listController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", protect, createList);
router.get("/board/:boardId", protect, getListsByBoard);
router.put("/reorder", protect, reorderLists);
router.put("/:id", protect, updateList);
router.delete("/:id", protect, deleteList);

export default router;
