import { useState } from "react";
import { Droppable } from "@hello-pangea/dnd";
import Card from "./Card";

const List = ({ list, cards, onAddCard, onCardClick, onDeleteList }) => {
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    onAddCard(list._id, title);
    setTitle("");
    setShowForm(false);
  };

  return (
    <div className="bg-base rounded-xl w-72 flex-shrink-0 flex flex-col max-h-full">
      <div className="flex items-center justify-between px-3 py-2.5">
        <h3 className="font-semibold text-gray-700 text-sm">{list.title}</h3>
        <button
          onClick={() => onDeleteList(list._id)}
          className="text-gray-400 hover:text-red-500 transition text-sm px-1"
        >
          ✕
        </button>
      </div>

      <Droppable droppableId={list._id}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`flex-1 overflow-y-auto px-2 pb-2 min-h-[20px] rounded-lg transition ${
              snapshot.isDraggingOver ? "bg-accent/10" : ""
            }`}
          >
            {cards.map((card, index) => (
              <Card
                key={card._id}
                card={card}
                index={index}
                onClick={onCardClick}
              />
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>

      <div className="px-2 pb-2">
        {showForm ?
          <form onSubmit={handleSubmit} className="space-y-2">
            <textarea
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter card title..."
              rows={2}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
            />
            <div className="flex gap-2">
              <button
                type="submit"
                className="bg-primary text-white text-sm px-3 py-1.5 rounded-lg hover:bg-primary/90 transition"
              >
                Add
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="text-gray-400 text-sm px-2 hover:text-gray-600"
              >
                Cancel
              </button>
            </div>
          </form>
        : <button
            onClick={() => setShowForm(true)}
            className="w-full text-left text-sm text-gray-500 hover:bg-gray-100 rounded-lg px-3 py-2 transition"
          >
            + Add a card
          </button>
        }
      </div>
    </div>
  );
};

export default List;
