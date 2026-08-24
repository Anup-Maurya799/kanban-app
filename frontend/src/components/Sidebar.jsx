import { useState, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";

const Sidebar = ({ isOpen, onClose }) => {
  const [workspaces, setWorkspaces] = useState([]);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchWorkspaces = async () => {
      try {
        const res = await api.get("/workspaces");
        setWorkspaces(res.data);
      } catch (err) {
        console.error("Failed to load workspaces", err);
      }
    };
    fetchWorkspaces();
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-20 md:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed md:static top-0 left-0 h-full w-64 bg-white border-r border-gray-100 z-30
        transform transition-transform duration-200 flex flex-col
        ${isOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0`}
      >
        <div className="p-5 border-b border-gray-100 flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">K</span>
          </div>
          <span className="font-semibold text-gray-800">KanbanApp</span>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 px-2">
            Workspaces
          </p>
          <div className="space-y-1">
            {workspaces.length === 0 && (
              <p className="text-sm text-gray-400 px-2 py-1">
                No workspaces yet
              </p>
            )}
            {workspaces.map((ws) => (
              <NavLink
                key={ws._id}
                to={`/workspace/${ws._id}`}
                className={({ isActive }) =>
                  `block px-3 py-2 rounded-lg text-sm font-medium transition ${
                    isActive ?
                      "bg-accent/40 text-gray-800"
                    : "text-gray-600 hover:bg-base"
                  }`
                }
              >
                {ws.name}
              </NavLink>
            ))}
          </div>
        </div>

        <div className="p-4 border-t border-gray-100">
          <div className="flex items-center gap-3 px-2 py-2">
            <div className="w-8 h-8 rounded-full bg-secondary/30 flex items-center justify-center text-secondary font-semibold text-sm">
              {user?.name?.[0]?.toUpperCase() || "U"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-800 truncate">
                {user?.name}
              </p>
              <p className="text-xs text-gray-400 truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full mt-2 text-sm text-red-500 hover:bg-red-50 rounded-lg py-2 transition"
          >
            Log Out
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
