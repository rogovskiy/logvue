// eslint-disable-next-line import/prefer-default-export
export const validateRegex = (re: string) => {
  try {
    RegExp(re);
    return { valid: true, error: null };
  } catch (e) {
    return { valid: false, error: e.message };
  }
};
