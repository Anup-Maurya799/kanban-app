import redis from "../config/redisClient.js";

export const invalidateBoardCache = async (boardId) => {
  try {
    await redis.del(`board:${boardId}`);
  } catch (error) {
    console.error("Failed to invalidate cache:", error.message);
  }
};
