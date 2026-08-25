import List from "../models/List.js";
import Card from "../models/Card.js";

// @route POST /api/lists
export const createList = async (req, res) => {
  try {
    const { title, boardId } = req.body;

    if (!title || !boardId) {
      return res
        .status(400)
        .json({ message: "Title and boardId are required" });
    }

    const lastList = await List.findOne({ board: boardId }).sort({
      position: -1,
    });
    const position = lastList ? lastList.position + 1 : 0;

    const list = await List.create({ title, board: boardId, position });
    res.status(201).json(list);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route GET /api/lists/board/:boardId
export const getListsByBoard = async (req, res) => {
  try {
    const lists = await List.find({ board: req.params.boardId }).sort({
      position: 1,
    });
    res.json(lists);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route PUT /api/lists/:id
export const updateList = async (req, res) => {
  try {
    const { title } = req.body;
    const list = await List.findById(req.params.id);
    if (!list) {
      return res.status(404).json({ message: "List not found" });
    }
    if (title) list.title = title;
    await list.save();
    res.json(list);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route PUT /api/lists/reorder
// Body: { lists: [{ id, position }, ...] }  -- used after drag-and-drop
export const reorderLists = async (req, res) => {
  try {
    const { lists } = req.body;

    const bulkOps = lists.map((l) => ({
      updateOne: {
        filter: { _id: l.id },
        update: { position: l.position },
      },
    }));

    await List.bulkWrite(bulkOps);
    res.json({ message: "Lists reordered successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route DELETE /api/lists/:id
export const deleteList = async (req, res) => {
  try {
    const list = await List.findById(req.params.id);
    if (!list) {
      return res.status(404).json({ message: "List not found" });
    }
    await Card.deleteMany({ list: list._id });
    await list.deleteOne();
    res.json({ message: "List deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
