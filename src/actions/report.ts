import cron from "node-cron";
import db from "../db";
import redis from "../redis";
import { Client } from "discord.js";
import { messages } from "../definitions";
import { convertDurationToString, mentionUser } from "../utils";

export const scheduleReport = async (client: Client) => {
  // 毎月1日の0時0分に実行
  cron.schedule("0 0 1 * *", () => report(client));
};

export const report = async (client: Client) => {
  console.log("[DEBUG] 月次レポートの生成を開始");
  const now = Date.now();

  const allUserTasks = await redis.getAllUserTasks();
  console.log(
    `[DEBUG] ${Object.keys(allUserTasks).length}件のアクティブなユーザータスクを検出`
  );

  for (const [, userTask] of Object.entries(allUserTasks)) {
    const duration = now - userTask.startAt;
    console.log(
      `[DEBUG] タスクを更新: ${userTask.taskName} (ユーザー: ${userTask.userName}, 経過時間: ${duration}ms)`
    );
    db.incrementTaskDuration(userTask.taskId, duration);
  }

  // ここで各ギルドの報告チャンネルに報告を送る処理を書く
  const guild_list = await db.getGuildList();
  console.log(`[DEBUG] ${guild_list.length}個のギルドを処理中`);

  for (const guild of guild_list) {
    console.log(`[DEBUG] ギルドを処理中: ${guild.guildId}`);
    // 進捗ちゃんが参加しているサーバーの報告用チャンネルを取得
    let notifyChannelId: string | null = guild.notifyChannelId;
    if (!guild.notifyChannelId) {
      // DBに保存されていない場合はシステムチャンネルを使う
      notifyChannelId =
        client.guilds.cache.get(guild.guildId)?.systemChannelId || null;
      console.log(
        `[DEBUG] 通知チャンネルが未設定のため、システムチャンネルを使用: ${notifyChannelId}`
      );
    }
    // それでも報告チャンネルがなければスキップ
    if (!notifyChannelId) {
      console.log(
        `[DEBUG] ギルド ${guild.guildId} の通知チャンネルが見つからないためスキップ`
      );
      continue;
    }
    // メッセージを送れるチャンネルが存在するか確認
    const notifyChannel = await client.channels.fetch(notifyChannelId);
    if (!notifyChannel || !notifyChannel.isSendable()) {
      console.log(
        `[DEBUG] チャンネル ${notifyChannelId} にメッセージを送信できないためスキップ`
      );
      continue;
    }
    console.log(`[DEBUG] 通知チャンネルを使用: ${notifyChannelId}`);

    // 報告メッセージの作成
    let reportMessage = "";
    const joiningUserList = await db.getJoiningUser(guild.guildId);
    console.log(
      `[DEBUG] ギルド ${guild.guildId} に ${joiningUserList.length}人のユーザーを検出`
    );

    for (const joining of joiningUserList) {
      const userId = joining.userId;
      // TODO: n+1なので修正したい
      const taskList = await db.getTaskList(userId);
      console.log(
        `[DEBUG] ユーザー ${userId} は ${taskList.length}個のタスクを保有`
      );
      if (taskList.length <= 0) continue;
      reportMessage += `${mentionUser(userId)}さん\n`;
      // タスク一覧から以下のようなフォーマットのタスク情報のメッセージに変換
      // 【ゲーム開発】1:34:45
      const taskMessages = taskList.map(
        (task) =>
          `【${task.taskName}】${convertDurationToString(task.duration)}`
      );
      reportMessage += taskMessages.join("\n");
      reportMessage += "\n\n";
    }
    // 末尾に改行がついているはずなので、stripで安全に落とす
    reportMessage = reportMessage.trim();
    if (reportMessage.length > 0) {
      console.log(
        `[DEBUG] チャンネル ${notifyChannelId} にレポートメッセージを送信中`
      );
      notifyChannel.send(messages.report.startMessage);
      notifyChannel.send(reportMessage);
    } else {
      console.log(
        `[DEBUG] ギルド ${guild.guildId} に送信するレポートメッセージがありません`
      );
    }
  }

  console.log("[DEBUG] タスクを報告済みとして更新中");
  await db.updateTasksReported();

  console.log("[DEBUG] 次の期間用の新しいタスクを作成中");
  for (const [userId, userTask] of Object.entries(allUserTasks)) {
    // TODO: n+1になっている
    console.log(
      `[DEBUG] ユーザー ${userTask.userName} のタスク開始時刻を更新して新しいタスクを作成中`
    );
    const newTask = await db.addNewTask(userId, userTask.taskName);
    await redis.addUserTask(userId, {
      ...userTask,
      taskId: newTask.taskId,
      startAt: now,
    });
  }

  console.log("[DEBUG] 月次レポートの生成が完了");
};
