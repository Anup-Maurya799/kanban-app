// eslint-disable-next-line no-unused-vars
import { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import { DragDropContext, Droppable } from "@hello-pangea/dnd";
import MainLayout from "../layouts/MainLayout";
import List from "../components/List";
import CardModal from "../components/CardModal";
import api from "../api/axios";
import { useSocket } from "../context/SocketContext";
import { useAuth } from "../context/AuthContext";

const BoardPage = () => {
  const { boardId } = useParams();
  const { socket } = useSocket();
  // eslint-disable-next-line no-unused-vars
  const { user } = useAuth();
  const [board, setBoard] = useState(null);
  const [lists, setLists] = useState([]);
  const [cards, setCards] = useState([]);
  const [selectedCardId, setSelectedCardId] = useState(null);
  const [showListForm, setShowListForm] = useState(false);
  const [newListTitle, setNewListTitle] = useState("");
  const [toast, setToast] = useState("");

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2500);
  };

  const fetchBoardData = async () => {
    const [boardRes, listsRes, cardsRes] = await Promise.all([
      api.get(`/boards/${boardId}`),
      api.get(`/lists/board/${boardId}`),
      api.get(`/cards/board/${boardId}`),
    ]);
    setBoard(boardRes.data);
    setLists(listsRes.data.sort((a, b) => a.position - b.position));
    setCards(cardsRes.data);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchBoardData();
  }, [boardId]);

  // --- Join / leave the board's socket room ---
  useEffect(() => {
    if (!socket) return;
    socket.emit("join-board", boardId);
    return () => {
      socket.emit("leave-board", boardId);
    };
  }, [socket, boardId]);

  // --- Listen for real-time events from other users ---
  useEffect(() => {
    if (!socket) return;

    const handleCardMoved = (payload) => {
      setCards((prev) => {
        const others = prev.filter((c) => c.list !== payload.listId);
        return [...others, ...payload.cards];
      });
    };

    const handleCardCreated = (payload) => {
      setCards((prev) => {
        if (prev.some((c) => c._id === payload._id)) return prev;
        return [...prev, payload];
      });
    };

    const handleCardUpdated = (payload) => {
      setCards((prev) =>
        prev.map((c) => (c._id === payload._id ? payload : c)),
      );
    };

    const handleCardDeleted = ({ cardId }) => {
      setCards((prev) => prev.filter((c) => c._id !== cardId));
    };

    const handleListCreated = (payload) => {
      setLists((prev) => {
        if (prev.some((l) => l._id === payload._id)) return prev;
        return [...prev, payload];
      });
    };

    const handleListReordered = (payload) => {
      setLists(payload.lists);
    };

    const handleListDeleted = ({ listId }) => {
      setLists((prev) => prev.filter((l) => l._id !== listId));
      setCards((prev) => prev.filter((c) => c.list !== listId));
    };

    socket.on("card-moved", handleCardMoved);
    socket.on("card-created", handleCardCreated);
    socket.on("card-updated", handleCardUpdated);
    socket.on("card-deleted", handleCardDeleted);
    socket.on("list-created", handleListCreated);
    socket.on("list-reordered", handleListReordered);
    socket.on("list-deleted", handleListDeleted);

    return () => {
      socket.off("card-moved", handleCardMoved);
      socket.off("card-created", handleCardCreated);
      socket.off("card-updated", handleCardUpdated);
      socket.off("card-deleted", handleCardDeleted);
      socket.off("list-created", handleListCreated);
      socket.off("list-reordered", handleListReordered);
      socket.off("list-deleted", handleListDeleted);
    };
  }, [socket]);

  const handleAddList = async (e) => {
    e.preventDefault();
    if (!newListTitle.trim()) return;
    const res = await api.post("/lists", { title: newListTitle, boardId });
    setLists((prev) => [...prev, res.data]);
    setNewListTitle("");
    setShowListForm(false);
    socket?.emit("list-created", { boardId, payload: res.data });
  };

  const handleDeleteList = async (listId) => {
    const prevLists = lists;
    const prevCards = cards;
    setLists(lists.filter((l) => l._id !== listId));
    setCards(cards.filter((c) => c.list !== listId));
    try {
      await api.delete(`/lists/${listId}`);
      socket?.emit("list-deleted", { boardId, payload: { listId } });
      // eslint-disable-next-line no-unused-vars
    } catch (err) {
      setLists(prevLists);
      setCards(prevCards);
      showToast("Failed to delete list — restored");
    }
  };

  const handleAddCard = async (listId, title) => {
    const res = await api.post("/cards", { title, listId, boardId });
    setCards((prev) => [...prev, res.data]);
    socket?.emit("card-created", { boardId, payload: res.data });
  };

  const handleCardUpdate = (updatedCard) => {
    if (updatedCard) {
      setCards((prev) =>
        prev.map((c) => (c._id === updatedCard._id ? updatedCard : c)),
      );
      socket?.emit("card-updated", { boardId, payload: updatedCard });
    } else {
      fetchBoardData();
    }
  };

  const handleCardDelete = (cardId) => {
    setCards((prev) => prev.filter((c) => c._id !== cardId));
    socket?.emit("card-deleted", { boardId, payload: { cardId } });
  };

  // --- Drag and Drop Logic ---
  const onDragEnd = async (result) => {
    const { source, destination, draggableId, type } = result;
    if (!destination) return;
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) {
      return;
    }

    if (type === "LIST") {
      const prevLists = lists;
      const reordered = Array.from(lists);
      const [moved] = reordered.splice(source.index, 1);
      reordered.splice(destination.index, 0, moved);
      const reindexed = reordered.map((l, idx) => ({ ...l, position: idx }));
      setLists(reindexed);

      try {
        await api.put("/lists/reorder", {
          lists: reindexed.map((l) => ({ id: l._id, position: l.position })),
        });
        socket?.emit("list-reordered", {
          boardId,
          payload: { lists: reindexed },
        });
        // eslint-disable-next-line no-unused-vars
      } catch (err) {
        setLists(prevLists);
        showToast("Failed to reorder lists — restored");
      }
      return;
    }

    const prevCards = cards;
    const destListId = destination.droppableId;

    let updatedCards = [...cards];
    const draggedCard = updatedCards.find((c) => c._id === draggableId);
    const withoutDragged = updatedCards.filter((c) => c._id !== draggableId);

    const destCards = withoutDragged
      .filter((c) => c.list === destListId)
      .sort((a, b) => a.position - b.position);

    destCards.splice(destination.index, 0, {
      ...draggedCard,
      list: destListId,
    });
    const reindexedDest = destCards.map((c, idx) => ({ ...c, position: idx }));
    const otherCards = withoutDragged.filter((c) => c.list !== destListId);
    const finalCards = [...otherCards, ...reindexedDest];
    setCards(finalCards);

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
      socket?.emit("card-moved", {
        boardId,
        payload: { listId: destListId, cards: reindexedDest },
      });
      // eslint-disable-next-line no-unused-vars
    } catch (err) {
      setCards(prevCards);
      showToast("Failed to move card — restored");
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
    <MainLayout title={board.title} workspaceId={board.workspace}>
      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="board" type="LIST" direction="horizontal">
          {(provided) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className="flex gap-4 overflow-x-auto h-full pb-4"
            >
              {lists.map((list, index) => (
                <List
                  key={list._id}
                  list={list}
                  index={index}
                  cards={cards
                    .filter((c) => c.list === list._id)
                    .sort((a, b) => a.position - b.position)}
                  onAddCard={handleAddCard}
                  onCardClick={(card) => setSelectedCardId(card._id)}
                  onDeleteList={handleDeleteList}
                />
              ))}
              {provided.placeholder}

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
          )}
        </Droppable>
      </DragDropContext>

      {selectedCardId && (
        <CardModal
          cardId={selectedCardId}
          boardId={boardId}
          onClose={() => setSelectedCardId(null)}
          onUpdate={handleCardUpdate}
          onDelete={handleCardDelete}
        />
      )}

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-sm px-4 py-2 rounded-lg shadow-lg z-50">
          {toast}
        </div>
      )}
    </MainLayout>
  );
};

export default BoardPage;
