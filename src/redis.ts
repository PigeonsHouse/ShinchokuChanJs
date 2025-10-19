import Redis from "ioredis";

const redis = new Redis({
  host: process.env.REDIS_HOST,
  port: Number(process.env.REDIS_PORT!),
  password: process.env.REDIS_PASSWORD!,
});

export type UserTask = {
  userName: string;
  startAt: number; // エポックミリ秒
  taskId: number;
  taskName: string;
  replyChannelId: string;
};

const isUserTask = (obj: any): obj is UserTask => {
  return (
    typeof obj === "object" &&
    obj !== null &&
    typeof obj.userName === "string" &&
    typeof obj.startAt === "number" &&
    typeof obj.taskId === "number" &&
    typeof obj.taskName === "string" &&
    typeof obj.replyChannelId === "string"
  );
};

export const addUserTask = async (userId: string, task: UserTask) => {
  await redis.set(userId, JSON.stringify(task));
};

export const getUserTask = async (userId: string): Promise<UserTask | null> => {
  const task = await redis.get(userId);
  if (!task) return null;

  try {
    const parsedTask = JSON.parse(task);
    if (!isUserTask(parsedTask)) return null;

    return parsedTask;
  } catch (error) {
    // JSONのパースに失敗した場合
    return null;
  }
};

export const removeUserTask = async (userId: string) => {
  await redis.del(userId);
};

export default {
  addUserTask,
  getUserTask,
  removeUserTask,
};
