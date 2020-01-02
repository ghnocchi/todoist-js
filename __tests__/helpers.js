require('dotenv').config();

// eslint-disable-next-line no-process-env
export const env = process.env;

export const getDateString = (d) => {
  const two = v => v <= 9 ? `0${v}` : v;
  return `${d.getFullYear()}-${two(d.getMonth() + 1)}-${two(d.getDate())}T${two(d.getHours())}:${two(d.getMinutes())}:${two(d.getSeconds())}`;
};

export const getLongDateString = (dt) => {
  // eslint-disable-next-line no-unused-vars
  const [a, b, d, Y, HMS, ...args] = dt.toString().split(' ');
  return `${a} ${d} ${b} ${Y} ${HMS} +0000`;
};
