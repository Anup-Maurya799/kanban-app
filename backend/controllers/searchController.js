import Card from '../models/Card.js';
import Board from '../models/Board.js';
import Workspace from '../models/Workspace.js';

// @route GET /api/search?query=xxx&workspaceId=xxx
export const searchCards = async (req, res) => {
  try {
    const { query, workspaceId } = req.query;

    if (!query || query.trim().length === 0) {
      return res.status(400).json({ message: 'Search query is required' });
    }

    if (!workspaceId) {
      return res.status(400).json({ message: 'workspaceId is required' });
    }

    // Confirm user is a member of this workspace
    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) {
      return res.status(404).json({ message: 'Workspace not found' });
    }
    const isMember = workspace.members.some(
      (m) => m.user.toString() === req.user._id.toString()
    );
    if (!isMember) {
      return res.status(403).json({ message: 'Not a member of this workspace' });
    }

    // Get all boards under this workspace
    const boards = await Board.find({ workspace: workspaceId }).select('_id title');
    const boardIds = boards.map((b) => b._id);

    // Search cards by title or description (case-insensitive)
    const cards = await Card.find({
      board: { $in: boardIds },
      $or: [
        { title: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } },
        { labels: { $regex: query, $options: 'i' } },
      ],
    })
      .populate('assignees', 'name email')
      .limit(50);

    // Attach board title to each result for display context
    const boardMap = {};
    boards.forEach((b) => (boardMap[b._id] = b.title));

    const results = cards.map((card) => ({
      _id: card._id,
      title: card.title,
      description: card.description,
      board: card.board,
      boardTitle: boardMap[card.board] || 'Unknown board',
      list: card.list,
      dueDate: card.dueDate,
      labels: card.labels,
      assignees: card.assignees,
    }));

    res.json(results);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};