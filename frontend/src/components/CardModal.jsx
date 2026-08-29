import { useState, useEffect } from "react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

const CardModal = ({ cardId, onClose, onUpdate, onDelete }) => {
  const [card, setCard] = useState(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [commentText, setCommentText] = useState("");
  // eslint-disable-next-line no-unused-vars
  const { user } = useAuth();

  const fetchCard = async () => {
    const res = await api.get(`/cards/${cardId}`);
    setCard(res.data);
    setTitle(res.data.title);
    setDescription(res.data.description || "");
    setDueDate(res.data.dueDate ? res.data.dueDate.split("T")[0] : "");
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchCard();
  }, [cardId]);

  const handleSave = async () => {
    const res = await api.put(`/cards/${cardId}`, {
      title,
      description,
      dueDate: dueDate || null,
    });
    setCard(res.data);
    onUpdate(res.data);
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    const res = await api.post(`/cards/${cardId}/comments`, {
      text: commentText,
    });
    setCard(res.data);
    setCommentText("");
  };

  const handleDelete = async () => {
    await api.delete(`/cards/${cardId}`);
    onDelete(cardId);
    onClose();
  };

  if (!card) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[85vh] overflow-y-auto">
        <div className="p-5 sm:p-6 space-y-5">
          <div className="flex items-start justify-between gap-3">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={handleSave}
              className="text-lg font-semibold text-gray-800 flex-1 outline-none border-b border-transparent focus:border-primary/50 transition"
            />
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-xl leading-none"
            >
              ✕
            </button>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onBlur={handleSave}
              rows={3}
              placeholder="Add a more detailed description..."
              className="w-full mt-1 px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Due Date
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              onBlur={handleSave}
              className="block mt-1 px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Comments
            </label>
            <div className="space-y-2 mt-2 max-h-40 overflow-y-auto">
              {card.comments?.map((c, i) => (
                <div key={i} className="bg-base rounded-lg px-3 py-2">
                  <p className="text-xs font-medium text-gray-700">
                    {c.user?.name || "User"}
                  </p>
                  <p className="text-sm text-gray-600">{c.text}</p>
                </div>
              ))}
              {card.comments?.length === 0 && (
                <p className="text-xs text-gray-400">No comments yet</p>
              )}
            </div>
            <form onSubmit={handleAddComment} className="flex gap-2 mt-3">
              <input
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Write a comment..."
                className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
              <button
                type="submit"
                className="bg-secondary text-white px-4 py-2 rounded-lg text-sm hover:bg-secondary/90 transition"
              >
                Send
              </button>
            </form>
          </div>

          <button
            onClick={handleDelete}
            className="text-red-500 text-sm hover:bg-red-50 rounded-lg px-3 py-2 transition"
          >
            Delete Card
          </button>
        </div>
      </div>
    </div>
  );
};

export default CardModal;
