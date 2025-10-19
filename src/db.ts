import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const getGuildById = async (guildId: string) =>
  prisma.guild.findUnique({
    where: { guildId },
  });

export const addNewGuild = async (
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

export const getUserById = async (userId: string) =>
  prisma.user.findUnique({
    where: { userId },
  });

export const addNewUser = async (userId: string, userName: string) =>
  prisma.user.create({
    data: { userId, userName },
  });

export const getJoining = async (userId: string, guildId: string) =>
  prisma.joining.findUnique({
    where: {
      guildId_userId: { userId, guildId },
    },
  });

export const addNewJoining = async (userId: string, guildId: string) =>
  prisma.joining.create({
    data: { userId, guildId },
  });

export const getTaskById = async (taskId: number) =>
  prisma.task.findUnique({
    where: { taskId, isReported: false },
  });

export const getTaskByUserIdAndName = async (
  userId: string,
  taskName: string
) =>
  prisma.task.findFirst({
    where: { userId, taskName, isReported: false },
  });

export const addNewTask = async (userId: string, taskName: string) => {
  const existingTask = await prisma.task.findFirst({
    where: { userId, taskName, isReported: false },
  });
  if (existingTask) {
    throw new Error("Task with the same name already exists for this user.");
  }
  return await prisma.task.create({ data: { userId, taskName } });
};

export const incrementTaskDuration = async (taskId: number, duration: number) =>
  prisma.task.update({
    where: { taskId, isReported: false },
    data: { duration: { increment: duration } },
  });

export const setNotifyChannel = async (guildId: string, channelId: string) =>
  prisma.guild.update({
    where: { guildId },
    data: { notifyChannelId: channelId },
  });

export const getGuildList = async () => prisma.guild.findMany();

export const getJoiningUser = async (guildId: string) =>
  prisma.user.findMany({
    where: {
      joinings: { some: { guildId } },
    },
  });

export const getTaskList = async (userId: string) =>
  prisma.task.findMany({
    where: { userId, isReported: false },
  });

export const updateTaskReported = async (taskId: number) =>
  prisma.task.update({
    where: { taskId },
    data: { isReported: true },
  });

export const prepareGuild = async (guildId: string, guildName: string) => {
  const dbGuild = await getGuildById(guildId);
  if (dbGuild === null) {
    await addNewGuild(guildId, guildName);
  }
};

export const prepareGuildAndUser = async (
  guildId: string,
  guildName: string,
  userId: string,
  userName: string
) => {
  await prepareGuild(guildId, guildName);
  const dbUser = await getUserById(userId);
  if (dbUser === null) {
    await addNewUser(userId, userName);
  }
};

export default {
  getGuildById,
  addNewGuild,
  getUserById,
  addNewUser,
  getJoining,
  addNewJoining,
  getTaskById,
  getTaskByUserIdAndName,
  addNewTask,
  incrementTaskDuration,
  setNotifyChannel,
  getGuildList,
  getJoiningUser,
  getTaskList,
  updateTaskReported,
  prepareGuild,
  prepareGuildAndUser,
};
