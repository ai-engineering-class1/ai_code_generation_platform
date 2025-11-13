const isMobile = function (v) {
  return /(?:^1[3456789]|^9[28])\d{9}$/.test(v);
};

const isEmail = function (v) {
  return /^\b[a-z_0-9.-]{1,64}@([a-z0-9-]{1,200}.){1,5}[a-z]{1,6}$/i.test(v);
};

export default {
  isMobile,
  isEmail,
};
