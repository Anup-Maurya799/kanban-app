import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";
import api from "../api/axios";

const Dashboard = () => {
  const [workspaces, setWorkspaces] = useState([]);
  const [name, setName] = useState("");
  const [showForm, setShowForm] = useState(false);
  const navigate = useNavigate();

  const fetchWorkspaces = async () => {
    const res = await api.get("/workspaces");
    setWorkspaces(res.data);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchWorkspaces();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    await api.post("/workspaces", { name });
    setName("");
    setShowForm(false);
    fetchWorkspaces();
  };

  return (
    <MainLayout title="Dashboard">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-800">Your Workspaces</h2>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition"
          >
            + New Workspace
          </button>
        </div>

        {showForm && (
          <form
            onSubmit={handleCreate}
            className="bg-white rounded-xl shadow-sm p-4 mb-6 flex flex-col sm:flex-row gap-3"
          >
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Workspace name"
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

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {workspaces.map((ws) => (
            <div
              key={ws._id}
              onClick={() => navigate(`/workspace/${ws._id}`)}
              className="bg-white rounded-xl shadow-sm p-5 cursor-pointer hover:shadow-md transition border border-gray-50"
            >
              <div className="w-10 h-10 bg-accent/50 rounded-lg flex items-center justify-center mb-3">
                <span className="text-gray-700 font-bold">
                  {ws.name[0].toUpperCase()}
                </span>
              </div>
              <h3 className="font-semibold text-gray-800">{ws.name}</h3>
              <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                {ws.description || "No description"}
              </p>
            </div>
          ))}
          {workspaces.length === 0 && (
            <p className="text-gray-400 text-sm col-span-full text-center py-10">
              No workspaces yet — create your first one above.
            </p>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default Dashboard;
