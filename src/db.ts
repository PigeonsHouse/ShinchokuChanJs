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

const addNewTasksBulk = async (
  tasks: Array<{ userId: string; taskName: string }>
) => {
  // 既存タスクの重複チェック
  const existingTasks = await prisma.task.findMany({
    where: {
      OR: tasks.map((task) => ({
        userId: task.userId,
        taskName: task.taskName,
        isReported: false,
      })),
    },
  });

  if (existingTasks.length > 0) {
    const duplicates = existingTasks
      .map((t) => `${t.userId}:${t.taskName}`)
      .join(", ");
    throw new Error(
      `Task(s) with the same name already exist for user(s): ${duplicates}`
    );
  }

  // トランザクションで一括作成して取得
  return await prisma.$transaction(async (tx) => {
    // 一括作成
    await tx.task.createMany({
      data: tasks.map((task) => ({
        userId: task.userId,
        taskName: task.taskName,
      })),
    });

    // 作成されたタスクを取得
    const createdTasks = await tx.task.findMany({
      where: {
        OR: tasks.map((task) => ({
          userId: task.userId,
          taskName: task.taskName,
          isReported: false,
        })),
      },
      orderBy: {
        taskId: "desc",
      },
    });

    return createdTasks;
  });
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

const getTaskListByGuild = async (guildId: string) =>
  prisma.task.findMany({
    where: {
      isReported: false,
      user: {
        joinings: {
          some: { guildId },
        },
      },
    },
    include: {
      user: true,
    },
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
  addNewTasksBulk,
  incrementTaskDuration,
  setNotifyChannel,
  getGuildList,
  getTaskListByGuild,
  updateTasksReported,
  prepareGuild,
  prepareGuildAndUser,
  setLastTaskId,
  getLastTask,
};
