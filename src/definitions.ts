export const messages = {
  common: {
    denyDM: "DMでは使えないよ！サーバー内で使ってね！",
    notInVC: "VCに入ってからコマンドを使ってね！",
  },
  startTask: {
    noTaskName: "タスク名を入力してね！",
    taskNameTooLong:
      "タスク名が長すぎるよ！\n短くまとめて宣言し直してくれたら嬉しいなっ！",
    alreadySameTask: (taskName: string) =>
      `${taskName} をしてるのはちゃんと見てるよ？\n応援してるよ！頑張ってね！`,
    alreadyDifferentTask:
      "作業を変更するときは一度終了してからもう一度宣言してね！",
    start: (taskName: string) => `${taskName} をやるんだね！\n今日も頑張ろう！`,
  },
  restartTask: {
    noTask:
      "再開するタスクが見つからないよ？\n`/start_task`で新しく作業を始めてね！",
    alreadySameTask: (taskName: string) =>
      `${taskName} をしてるのはちゃんと見てるよ？\n応援してるよ！頑張ってね！`,
    restart: (taskName: string) =>
      `${taskName} を再開するんだね！\n今日も頑張ろう！`,
  },
  endTask: {
    noWatchingTask:
      "まだ作業開始の宣言をしてないよ？\n何の作業をしてるか教えてね！",
    finished: (taskName: string, duration: string) =>
      `お疲れ様！頑張ったね！\n【${taskName}】${duration}`,
  },
  setReportChannel: {
    set: "月次報告をこのチャンネルでするね！",
  },
  report: {
    startMessage:
      "みんな先月もいっぱい頑張ったね！1ヶ月お疲れ様！みんなの先月の進捗を報告するよ！",
  },
};
