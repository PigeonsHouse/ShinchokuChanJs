/**
 * HH:MM:SS 形式の文字列に変換するユーティリティ関数
 * 引数の duration はミリ秒単位
 * ミリ秒は切り捨て
 * 時分秒がそれぞれ2桁になるようにゼロ埋め
 * 100時間以上の場合は HH が3桁以上になる
 */
export const convertDurationToString = (duration: number) => {
  const hours = Math.floor(duration / 3600_000);
  const minutes = Math.floor((duration % 3600_000) / 60_000);
  const seconds = Math.floor((duration % 60_000) / 1_000);
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
};

export const mentionUser = (userId: string) => `<@!${userId}>`;
