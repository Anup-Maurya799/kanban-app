// import Redis from "ioredis";
// import dotenv from "dotenv";

// dotenv.config();

// const redis = new Redis(process.env.REDIS_URL);

// redis.on("connect", () => console.log("Redis connected"));
// redis.on("error", (err) => console.error("Redis error:", err.message));

// export default redis;

import Redis from "ioredis";
import dotenv from "dotenv";

dotenv.config();

const redis = new Redis(process.env.REDIS_URL, {
  maxRetriesPerRequest: 3,
  retryStrategy(times) {
    if (times > 3) {
      console.log("Redis stopped retrying.");
      return null;
    }

    return 1000;
  },
});

redis.on("connect", () => {
  console.log("Redis connected");
});

redis.on("ready", () => {
  console.log("Redis ready");
});

redis.on("error", (err) => {
  console.error("Redis error:", err.message);
});

redis.on("close", () => {
  console.log("Redis connection closed");
});

export default redis;
