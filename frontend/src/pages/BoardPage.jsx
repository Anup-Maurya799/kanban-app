import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { DragDropContext } from "@hello-pangea/dnd";
import MainLayout from "../layouts/MainLayout";
import List from "../components/List";
import CardModal from "../components/CardModal";
import api from "../api/axios";

const BoardPage = () => {
  const { boardId } = useParams();
  const [board, setBoard] = useState(null);
  const [lists, setLists] = useState([]);
  const [cards, setCards] = useState([]);
  const [selectedCardId, setSelectedCardId] = useState(null);
  const [showListForm, setShowListForm] = useState(false);
  const [newListTitle, setNewListTitle] = useState("");

  const fetchBoardData = async () => {
    const [boardRes, listsRes, cardsRes] = await Promise.all([
      api.get(`/boards/${boardId}`),
      api.get(`/lists/board/${boardId}`),
      api.get(`/cards/board/${boardId}`),
    ]);
    setBoard(boardRes.data);
    setLists(listsRes.data);
    setCards(cardsRes.data);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchBoardData();
  }, [boardId]);

  const handleAddList = async (e) => {
    e.preventDefault();
    if (!newListTitle.trim()) return;
    const res = await api.post("/lists", { title: newListTitle, boardId });
    setLists([...lists, res.data]);
    setNewListTitle("");
    setShowListForm(false);
  };

  const handleDeleteList = async (listId) => {
    await api.delete(`/lists/${listId}`);
    setLists(lists.filter((l) => l._id !== listId));
    setCards(cards.filter((c) => c.list !== listId));
  };

  const handleAddCard = async (listId, title) => {
    const res = await api.post("/cards", { title, listId, boardId });
    setCards([...cards, res.data]);
  };

  const handleCardUpdate = () => {
    fetchBoardData();
  };

  const handleCardDelete = (cardId) => {
    setCards(cards.filter((c) => c._id !== cardId));
  };

  // --- Drag and Drop Logic ---
  const onDragEnd = async (result) => {
    const { source, destination, draggableId } = result;
    if (!destination) return;
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) {
      return;
    }

    // Clone current cards grouped by list
    // eslint-disable-next-line no-unused-vars
    const sourceListId = source.droppableId;
    const destListId = destination.droppableId;

    let updatedCards = [...cards];

    // Remove dragged card from its old position
    const draggedCard = updatedCards.find((c) => c._id === draggableId);
    const withoutDragged = updatedCards.filter((c) => c._id !== draggableId);

    // Get destination list's cards (excluding dragged), sorted by position
    const destCards = withoutDragged
      .filter((c) => c.list === destListId)
      .sort((a, b) => a.position - b.position);

    // Insert dragged card at new index
    destCards.splice(destination.index, 0, {
      ...draggedCard,
      list: destListId,
    });

    // Reassign positions for destination list
    const reindexedDest = destCards.map((c, idx) => ({ ...c, position: idx }));

    // Keep all other cards (not in dest list) untouched
    const otherCards = withoutDragged.filter((c) => c.list !== destListId);

    const finalCards = [...otherCards, ...reindexedDest];
    setCards(finalCards);

    // Prepare payload for backend
    const updatedCardsPayload = reindexedDest.map((c) => ({
      id: c._id,
      position: c.position,
      list: destListId,
    }));

    try {
      await api.put("/cards/move", {
        cardId: draggableId,
        newListId: destListId,
        updatedCards: updatedCardsPayload,
      });
    } catch (err) {
      console.error("Failed to save card move", err);
      fetchBoardData(); // rollback by refetching
    }
  };

  if (!board) {
    return (
      <MainLayout title="Board">
        <p className="text-gray-400 text-center mt-10">Loading board...</p>
      </MainLayout>
    );
  }

  return (
    <MainLayout title={board.title}>
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex gap-4 overflow-x-auto h-full pb-4">
          {lists
            .sort((a, b) => a.position - b.position)
            .map((list) => (
              <List
                key={list._id}
                list={list}
                cards={cards
                  .filter((c) => c.list === list._id)
                  .sort((a, b) => a.position - b.position)}
                onAddCard={handleAddCard}
                onCardClick={(card) => setSelectedCardId(card._id)}
                onDeleteList={handleDeleteList}
              />
            ))}

          <div className="w-72 flex-shrink-0">
            {showListForm ?
              <form
                onSubmit={handleAddList}
                className="bg-base rounded-xl p-3 space-y-2"
              >
                <input
                  autoFocus
                  value={newListTitle}
                  onChange={(e) => setNewListTitle(e.target.value)}
                  placeholder="List title"
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="bg-primary text-white text-sm px-3 py-1.5 rounded-lg hover:bg-primary/90 transition"
                  >
                    Add List
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowListForm(false)}
                    className="text-gray-400 text-sm px-2 hover:text-gray-600"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            : <button
                onClick={() => setShowListForm(true)}
                className="w-full bg-base/60 hover:bg-base rounded-xl px-4 py-3 text-sm text-gray-500 transition text-left"
              >
                + Add another list
              </button>
            }
          </div>
        </div>
      </DragDropContext>

      {selectedCardId && (
        <CardModal
          cardId={selectedCardId}
          onClose={() => setSelectedCardId(null)}
          onUpdate={handleCardUpdate}
          onDelete={handleCardDelete}
        />
      )}
    </MainLayout>
  );
};

export default BoardPage;
