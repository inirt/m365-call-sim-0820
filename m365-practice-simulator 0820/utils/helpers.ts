
export const isoNow = (): string => new Date().toISOString();

const pad2 = (n: number): string => (n < 10 ? `0${n}` : `${n}`);

export const fileStamp = (): string => {
  const d = new Date();
  return `${d.getFullYear()}${pad2(d.getMonth() + 1)}${pad2(d.getDate())}-${pad2(
    d.getHours()
  )}${pad2(d.getMinutes())}${pad2(d.getSeconds())}`;
};
