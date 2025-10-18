export const messages = {
  startTask: {
    noTaskName: "タスク名を入力してね！",
    taskNameTooLong:
      "タスク名が長すぎるよ！\n短くまとめて宣言し直してくれたら嬉しいなっ！",
    alreadySameTask: (taskName: string) =>
      `${taskName}をしてるのはちゃんと見てるよ？\n応援してるよ！頑張ってね！`,
    alreadyDifferentTask:
      "作業を変更するときは一度終了してからもう一度宣言してね！",
    notInVC: "VCに入ってから作業を始めてね！",
    start: (taskName: string) => `${taskName}をやるんだね！\n今日も頑張ろう！`,
  },
  endTask: {
    noWatchingTask:
      "まだ作業開始の宣言をしてないよ？\n何の作業をしてるか教えてね！",
    notInVC: "VCに入って終了宣言をしてね",
    finished: (taskName: string, duration: string) =>
      `お疲れ様！頑張ったね！\n【${taskName}】${duration}`,
  },
};
