import { Draggable } from "@hello-pangea/dnd";

const Card = ({ card, index, onClick }) => {
  return (
    <Draggable draggableId={card._id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onClick={() => onClick(card)}
          className={`bg-white rounded-lg p-3 mb-2 shadow-sm border border-gray-100 cursor-pointer transition
          hover:shadow-md ${snapshot.isDragging ? "shadow-lg rotate-1 ring-2 ring-primary/40" : ""}`}
        >
          <p className="text-sm font-medium text-gray-800">{card.title}</p>

          {card.labels?.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
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

          <div className="flex items-center justify-between mt-2">
            {card.dueDate && (
              <span className="text-xs text-gray-400">
                📅 {new Date(card.dueDate).toLocaleDateString()}
              </span>
            )}
            {card.comments?.length > 0 && (
              <span className="text-xs text-gray-400">
                💬 {card.comments.length}
              </span>
            )}
            {card.assignees?.length > 0 && (
              <div className="flex -space-x-2">
                {card.assignees.slice(0, 3).map((user) => (
                  <div
                    key={user._id}
                    title={user.name}
                    className="w-5 h-5 rounded-full bg-secondary/40 flex items-center justify-center text-[10px] font-semibold text-secondary border border-white"
                  >
                    {user.name[0].toUpperCase()}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </Draggable>
  );
};

export default Card;
