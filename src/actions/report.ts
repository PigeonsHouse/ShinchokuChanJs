import cron from "node-cron";

export const scheduleReport = async () => {
  // 毎月1日の0時0分に実行
  cron.schedule("0 0 1 * *", report);
};

export const report = async () => {};
