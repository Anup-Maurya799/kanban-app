import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";
import api from "../api/axios";

const WorkspaceSettings = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [workspace, setWorkspace] = useState(null);
  const [boards, setBoards] = useState([]);
  const [inviteEmail, setInviteEmail] = useState("");
  const [message, setMessage] = useState("");
  const [boardTitle, setBoardTitle] = useState("");
  const [showBoardForm, setShowBoardForm] = useState(false);

  const fetchWorkspace = async () => {
    const res = await api.get(`/workspaces/${id}`);
    setWorkspace(res.data);
  };

  const fetchBoards = async () => {
    const res = await api.get(`/boards/workspace/${id}`);
    setBoards(res.data);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchWorkspace();
    fetchBoards();
  }, [id]);

  const handleInvite = async (e) => {
    e.preventDefault();
    setMessage("");
    try {
      await api.post(`/workspaces/${id}/invite`, { email: inviteEmail });
      setMessage("Member invited successfully ✅");
      setInviteEmail("");
      fetchWorkspace();
    } catch (err) {
      setMessage(err.response?.data?.message || "Failed to invite member");
    }
  };

  const handleCreateBoard = async (e) => {
    e.preventDefault();
    if (!boardTitle.trim()) return;
    await api.post("/boards", { title: boardTitle, workspaceId: id });
    setBoardTitle("");
    setShowBoardForm(false);
    fetchBoards();
  };

  if (!workspace) {
    return (
      <MainLayout title="Workspace Settings">
        <p className="text-gray-400 text-center mt-10">Loading...</p>
      </MainLayout>
    );
  }

  return (
    <MainLayout title={`${workspace.name}`} workspaceId={id}>
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Boards Section */}
        <div className="bg-white rounded-xl shadow-sm p-5 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800">Boards</h3>
            <button
              onClick={() => setShowBoardForm(!showBoardForm)}
              className="bg-primary text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-primary/90 transition"
            >
              + New Board
            </button>
          </div>

          {showBoardForm && (
            <form
              onSubmit={handleCreateBoard}
              className="flex flex-col sm:flex-row gap-3 mb-4"
            >
              <input
                type="text"
                value={boardTitle}
                onChange={(e) => setBoardTitle(e.target.value)}
                placeholder="Board title"
                className="flex-1 px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
              <button
                type="submit"
                className="bg-secondary text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-secondary/90 transition"
              >
                Create
              </button>
            </form>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {boards.map((board) => (
              <div
                key={board._id}
                onClick={() => navigate(`/board/${board._id}`)}
                className="rounded-lg p-4 cursor-pointer hover:opacity-90 transition text-white font-medium"
                style={{ backgroundColor: board.background }}
              >
                {board.title}
              </div>
            ))}
            {boards.length === 0 && (
              <p className="text-sm text-gray-400 col-span-full">
                No boards yet — create one above.
              </p>
            )}
          </div>
        </div>

        {/* Workspace Info */}
        <div className="bg-white rounded-xl shadow-sm p-5 sm:p-6">
          <h3 className="font-semibold text-gray-800 mb-1">Workspace Info</h3>
          <p className="text-sm text-gray-500 mb-4">
            {workspace.description || "No description"}
          </p>
          <p className="text-xs text-gray-400">
            Owner:{" "}
            <span className="font-medium text-gray-600">
              {workspace.owner?.name}
            </span>
          </p>
        </div>

        {/* Members Section */}
        <div className="bg-white rounded-xl shadow-sm p-5 sm:p-6">
          <h3 className="font-semibold text-gray-800 mb-4">Members</h3>
          <div className="space-y-3 mb-6">
            {workspace.members.map((m) => (
              <div
                key={m.user._id}
                className="flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-secondary/30 flex items-center justify-center text-secondary font-semibold text-sm">
                    {m.user.name[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-800">
                      {m.user.name}
                    </p>
                    <p className="text-xs text-gray-400">{m.user.email}</p>
                  </div>
                </div>
                <span
                  className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                    m.role === "admin" ?
                      "bg-primary/10 text-primary"
                    : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {m.role}
                </span>
              </div>
            ))}
          </div>

          <form
            onSubmit={handleInvite}
            className="flex flex-col sm:flex-row gap-3"
          >
            <input
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="Invite by email"
              required
              className="flex-1 px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            <button
              type="submit"
              className="bg-primary text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition"
            >
              Invite
            </button>
          </form>
          {message && <p className="text-sm text-gray-600 mt-3">{message}</p>}
        </div>
      </div>
    </MainLayout>
  );
};

export default WorkspaceSettings;
