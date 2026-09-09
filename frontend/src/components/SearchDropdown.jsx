import { useNavigate } from "react-router-dom";

const SearchDropdown = ({ results, loading, onClose }) => {
  const navigate = useNavigate();

  const handleResultClick = (result) => {
    navigate(`/board/${result.board}`);
    onClose();
  };

  return (
    <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-lg border border-gray-100 max-h-80 overflow-y-auto z-50">
      {loading && (
        <p className="text-sm text-gray-400 text-center py-4">Searching...</p>
      )}

      {!loading && results.length === 0 && (
        <p className="text-sm text-gray-400 text-center py-4">
          No results found
        </p>
      )}

      {!loading &&
        results.map((card) => (
          <div
            key={card._id}
            onClick={() => handleResultClick(card)}
            className="px-4 py-3 hover:bg-base cursor-pointer border-b border-gray-50 last:border-0"
          >
            <p className="text-sm font-medium text-gray-800">{card.title}</p>
            <p className="text-xs text-gray-400 mt-0.5">
              in <span className="font-medium">{card.boardTitle}</span>
              {card.dueDate &&
                ` · Due ${new Date(card.dueDate).toLocaleDateString()}`}
            </p>
            {card.labels?.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1.5">
                {card.labels.map((label, i) => (
                  <span
                    key={i}
                    className="text-xs px-2 py-0.5 rounded-full bg-accent/40 text-gray-700"
                  >
                    {label}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
    </div>
  );
};

export default SearchDropdown;
