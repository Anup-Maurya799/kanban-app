export const initSocket = (io) => {
  io.on("connection", (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    // Join a specific board's "room" so events only broadcast to users viewing that board
    socket.on("join-board", (boardId) => {
      socket.join(boardId);
      console.log(`Socket ${socket.id} joined board room: ${boardId}`);
    });

    socket.on("leave-board", (boardId) => {
      socket.leave(boardId);
      console.log(`Socket ${socket.id} left board room: ${boardId}`);
    });

    // --- Card events ---
    socket.on("card-moved", ({ boardId, payload }) => {
      socket.to(boardId).emit("card-moved", payload);
    });

    socket.on("card-created", ({ boardId, payload }) => {
      socket.to(boardId).emit("card-created", payload);
    });

    socket.on("card-updated", ({ boardId, payload }) => {
      socket.to(boardId).emit("card-updated", payload);
    });

    socket.on("card-deleted", ({ boardId, payload }) => {
      socket.to(boardId).emit("card-deleted", payload);
    });

    // --- List events ---
    socket.on("list-created", ({ boardId, payload }) => {
      socket.to(boardId).emit("list-created", payload);
    });

    socket.on("list-reordered", ({ boardId, payload }) => {
      socket.to(boardId).emit("list-reordered", payload);
    });

    socket.on("list-deleted", ({ boardId, payload }) => {
      socket.to(boardId).emit("list-deleted", payload);
    });

    // --- Typing indicator (Day 6-7 will use this) ---
    socket.on("typing-start", ({ boardId, payload }) => {
      socket.to(boardId).emit("typing-start", payload);
    });

    socket.on("typing-stop", ({ boardId, payload }) => {
      socket.to(boardId).emit("typing-stop", payload);
    });

    // --- Comment events (Day 6-7) ---
    socket.on("comment-added", ({ boardId, payload }) => {
      socket.to(boardId).emit("comment-added", payload);
    });

    socket.on("disconnect", () => {
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });
};
