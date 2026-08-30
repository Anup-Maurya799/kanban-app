import { useState, useEffect, useRef } from "react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";

const CardModal = ({ cardId, boardId, onClose, onUpdate, onDelete }) => {
  const [card, setCard] = useState(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [commentText, setCommentText] = useState("");
  const [typingUsers, setTypingUsers] = useState([]);
  const { user } = useAuth();
  const { socket } = useSocket();
  const typingTimeoutRef = useRef(null);

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

  // --- Listen for live comment additions + typing indicators scoped to this card ---
  useEffect(() => {
    if (!socket) return;

    const handleCommentAdded = (payload) => {
      if (payload.cardId !== cardId) return;
      setCard((prev) =>
        prev ? { ...prev, comments: payload.comments } : prev,
      );
    };

    const handleTypingStart = (payload) => {
      if (payload.cardId !== cardId || payload.userId === user._id) return;
      setTypingUsers((prev) =>
        prev.some((u) => u.userId === payload.userId) ? prev : (
          [...prev, payload]
        ),
      );
    };

    const handleTypingStop = (payload) => {
      if (payload.cardId !== cardId) return;
      setTypingUsers((prev) => prev.filter((u) => u.userId !== payload.userId));
    };

    socket.on("comment-added", handleCommentAdded);
    socket.on("typing-start", handleTypingStart);
    socket.on("typing-stop", handleTypingStop);

    return () => {
      socket.off("comment-added", handleCommentAdded);
      socket.off("typing-start", handleTypingStart);
      socket.off("typing-stop", handleTypingStop);
    };
  }, [socket, cardId, user._id]);

  const handleSave = async () => {
    const res = await api.put(`/cards/${cardId}`, {
      title,
      description,
      dueDate: dueDate || null,
    });
    setCard(res.data);
    onUpdate(res.data);
  };

  const handleCommentInputChange = (e) => {
    setCommentText(e.target.value);

    if (!socket) return;
    socket.emit("typing-start", {
      boardId,
      payload: { cardId, userId: user._id, userName: user.name },
    });

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit("typing-stop", {
        boardId,
        payload: { cardId, userId: user._id },
      });
    }, 1500);
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    const res = await api.post(`/cards/${cardId}/comments`, {
      text: commentText,
    });
    setCard(res.data);
    setCommentText("");

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    socket?.emit("typing-stop", {
      boardId,
      payload: { cardId, userId: user._id },
    });
    socket?.emit("comment-added", {
      boardId,
      payload: { cardId, comments: res.data.comments },
    });
  };

  const handleDelete = async () => {
    await api.delete(`/cards/${cardId}`);
    onDelete(cardId);
    onClose();
  };

  const handleClose = () => {
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    socket?.emit("typing-stop", {
      boardId,
      payload: { cardId, userId: user._id },
    });
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
              onClick={handleClose}
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

            {typingUsers.length > 0 && (
              <p className="text-xs text-gray-400 italic mt-2">
                {typingUsers.map((u) => u.userName).join(", ")}{" "}
                {typingUsers.length === 1 ? "is" : "are"} typing...
              </p>
            )}

            <form onSubmit={handleAddComment} className="flex gap-2 mt-3">
              <input
                value={commentText}
                onChange={handleCommentInputChange}
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
