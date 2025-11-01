import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const getGuildById = async (guildId: string) =>
  prisma.guild.findUnique({
    where: { guildId },
  });

const addNewGuild = async (
  guildId: string,
  guildName: string,
  notifyChannelId?: string
) =>
  prisma.guild.create({
    data: {
      guildId,
      guildName,
      notifyChannelId,
    },
  });

const getUserById = async (userId: string) =>
  prisma.user.findUnique({
    where: { userId },
  });

const addNewUser = async (userId: string, userName: string) =>
  prisma.user.create({
    data: { userId, userName },
  });

const getJoining = async (userId: string, guildId: string) =>
  prisma.joining.findUnique({
    where: {
      guildId_userId: { userId, guildId },
    },
  });

const addNewJoining = async (userId: string, guildId: string) =>
  prisma.joining.create({
    data: { userId, guildId },
  });

const getTaskById = async (taskId: number) =>
  prisma.task.findUnique({
    where: { taskId, isReported: false },
  });

const getTaskByUserIdAndName = async (userId: string, taskName: string) =>
  prisma.task.findFirst({
    where: { userId, taskName, isReported: false },
  });

const addNewTask = async (userId: string, taskName: string) => {
  const existingTask = await prisma.task.findFirst({
    where: { userId, taskName, isReported: false },
  });
  if (existingTask) {
    throw new Error("Task with the same name already exists for this user.");
  }
  return await prisma.task.create({ data: { userId, taskName } });
};

const incrementTaskDuration = async (taskId: number, duration: number) =>
  prisma.task.update({
    where: { taskId, isReported: false },
    data: { duration: { increment: duration } },
  });

const setNotifyChannel = async (guildId: string, channelId: string) =>
  prisma.guild.update({
    where: { guildId },
    data: { notifyChannelId: channelId },
  });

const getGuildList = async () => prisma.guild.findMany();

const getJoiningUser = async (guildId: string) =>
  prisma.user.findMany({
    where: {
      joinings: { some: { guildId } },
    },
  });

const getTaskList = async (userId: string) =>
  prisma.task.findMany({
    where: { userId, isReported: false },
  });

const updateTasksReported = async () =>
  prisma.task.updateMany({
    data: { isReported: true },
  });

const prepareGuild = async (guildId: string, guildName: string) => {
  const dbGuild = await getGuildById(guildId);
  if (dbGuild === null) {
    await addNewGuild(guildId, guildName);
  }
};

const prepareGuildAndUser = async (
  guildId: string,
  guildName: string,
  userId: string,
  userName: string
) => {
  await prepareGuild(guildId, guildName);
  const dbGuild = await getGuildById(guildId);
  const dbUser = await getUserById(userId);
  if (dbUser === null) {
    await addNewUser(userId, userName);
  }
  const dbJoining = await getJoining(userId, guildId);
  if (dbJoining === null && dbGuild !== null) {
    await addNewJoining(userId, guildId);
  }
};

const setLastTaskId = async (userId: string, taskId: number) =>
  prisma.user.update({
    where: { userId },
    data: { lastTaskId: taskId },
  });

const getLastTask = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { userId },
    include: { lastTask: true },
  });
  return user?.lastTask ?? null;
};

export default {
  getTaskById,
  getTaskByUserIdAndName,
  addNewTask,
  incrementTaskDuration,
  setNotifyChannel,
  getGuildList,
  getJoiningUser,
  getTaskList,
  updateTasksReported,
  prepareGuild,
  prepareGuildAndUser,
  setLastTaskId,
  getLastTask,
};
