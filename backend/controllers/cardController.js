import Card from "../models/Card.js";

// @route POST /api/cards
export const createCard = async (req, res) => {
  try {
    const { title, listId, boardId } = req.body;

    if (!title || !listId || !boardId) {
      return res
        .status(400)
        .json({ message: "Title, listId, and boardId are required" });
    }

    const lastCard = await Card.findOne({ list: listId }).sort({
      position: -1,
    });
    const position = lastCard ? lastCard.position + 1 : 0;

    const card = await Card.create({
      title,
      list: listId,
      board: boardId,
      position,
    });
    res.status(201).json(card);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route GET /api/cards/board/:boardId
export const getCardsByBoard = async (req, res) => {
  try {
    const cards = await Card.find({ board: req.params.boardId })
      .populate("assignees", "name email avatar")
      .populate("comments.user", "name email")
      .sort({ position: 1 });
    res.json(cards);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route GET /api/cards/:id
export const getCardById = async (req, res) => {
  try {
    const card = await Card.findById(req.params.id)
      .populate("assignees", "name email avatar")
      .populate("comments.user", "name email");
    if (!card) {
      return res.status(404).json({ message: "Card not found" });
    }
    res.json(card);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route PUT /api/cards/:id
export const updateCard = async (req, res) => {
  try {
    const { title, description, dueDate, labels, assignees } = req.body;
    const card = await Card.findById(req.params.id);
    if (!card) {
      return res.status(404).json({ message: "Card not found" });
    }

    if (title !== undefined) card.title = title;
    if (description !== undefined) card.description = description;
    if (dueDate !== undefined) card.dueDate = dueDate;
    if (labels !== undefined) card.labels = labels;
    if (assignees !== undefined) card.assignees = assignees;

    await card.save();
    res.json(card);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route PUT /api/cards/move
// Body: { cardId, newListId, newPosition, updatedCards: [{id, position, list}] }
// updatedCards is a batch update for the source+destination list card orders
export const moveCard = async (req, res) => {
  try {
    const { cardId, newListId, updatedCards } = req.body;

    const card = await Card.findById(cardId);
    if (!card) {
      return res.status(404).json({ message: "Card not found" });
    }
    card.list = newListId;
    await card.save();

    if (updatedCards && updatedCards.length > 0) {
      const bulkOps = updatedCards.map((c) => ({
        updateOne: {
          filter: { _id: c.id },
          update: { position: c.position, list: c.list },
        },
      }));
      await Card.bulkWrite(bulkOps);
    }

    res.json({ message: "Card moved successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route POST /api/cards/:id/comments
export const addComment = async (req, res) => {
  try {
    const { text } = req.body;
    const card = await Card.findById(req.params.id);
    if (!card) {
      return res.status(404).json({ message: "Card not found" });
    }

    card.comments.push({ user: req.user._id, text });
    await card.save();

    const updatedCard = await Card.findById(req.params.id).populate(
      "comments.user",
      "name email",
    );
    res.status(201).json(updatedCard);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route DELETE /api/cards/:id
export const deleteCard = async (req, res) => {
  try {
    const card = await Card.findById(req.params.id);
    if (!card) {
      return res.status(404).json({ message: "Card not found" });
    }
    await card.deleteOne();
    res.json({ message: "Card deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
