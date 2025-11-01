-- CreateTable
CREATE TABLE "guilds" (
    "guildId" TEXT NOT NULL,
    "guildName" TEXT NOT NULL,
    "notifyChannelId" TEXT,

    CONSTRAINT "guilds_pkey" PRIMARY KEY ("guildId")
);

-- CreateTable
CREATE TABLE "users" (
    "userId" TEXT NOT NULL,
    "userName" TEXT NOT NULL,
    "lastTaskId" INTEGER,

    CONSTRAINT "users_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "joinings" (
    "guildId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "joinings_pkey" PRIMARY KEY ("guildId","userId")
);

-- CreateTable
CREATE TABLE "tasks" (
    "taskId" SERIAL NOT NULL,
    "taskName" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "isReported" BOOLEAN NOT NULL DEFAULT false,
    "duration" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "tasks_pkey" PRIMARY KEY ("taskId")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_lastTaskId_key" ON "users"("lastTaskId");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_lastTaskId_fkey" FOREIGN KEY ("lastTaskId") REFERENCES "tasks"("taskId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "joinings" ADD CONSTRAINT "joinings_guildId_fkey" FOREIGN KEY ("guildId") REFERENCES "guilds"("guildId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "joinings" ADD CONSTRAINT "joinings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("userId") ON DELETE CASCADE ON UPDATE CASCADE;
