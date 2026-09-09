import { useState, useEffect, useRef } from "react";
// eslint-disable-next-line no-unused-vars
import { useParams } from "react-router-dom";
import api from "../api/axios";
import SearchDropdown from "./SearchDropdown";
import NotificationBell from "./NotificationBell";

const Navbar = ({ onMenuClick, title, workspaceId }) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const debounceRef = useRef(null);

  useEffect(() => {
    if (!query.trim() || !workspaceId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setResults([]);
      setShowDropdown(false);
      return;
    }

    setShowDropdown(true);
    setLoading(true);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await api.get("/search", {
          params: { query, workspaceId },
        });
        setResults(res.data);
      } catch (err) {
        console.error("Search failed", err);
      } finally {
        setLoading(false);
      }
    }, 400); // debounce 400ms

    return () => clearTimeout(debounceRef.current);
  }, [query, workspaceId]);

  return (
    <header className="h-16 bg-white border-b border-gray-100 flex items-center px-4 sm:px-6 gap-3 sm:gap-4 sticky top-0 z-10">
      <button
        onClick={onMenuClick}
        className="md:hidden w-9 h-9 flex items-center justify-center rounded-lg hover:bg-base transition flex-shrink-0"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M3 12h18M3 6h18M3 18h18" strokeLinecap="round" />
        </svg>
      </button>

      <h1 className="font-semibold text-gray-800 text-lg truncate hidden sm:block flex-shrink-0">
        {title}
      </h1>

      {workspaceId && (
        <div className="relative flex-1 max-w-md">
          <div className="relative">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" strokeLinecap="round" />
            </svg>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => query.trim() && setShowDropdown(true)}
              placeholder="Search cards..."
              className="w-full pl-9 pr-3 py-2 rounded-lg bg-base text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition"
            />
          </div>
          {showDropdown && (
            <SearchDropdown
              results={results}
              loading={loading}
              onClose={() => {
                setShowDropdown(false);
                setQuery("");
              }}
            />
          )}
        </div>
      )}

      <div className="ml-auto flex-shrink-0">
        <NotificationBell />
      </div>
    </header>
  );
};

export default Navbar;
