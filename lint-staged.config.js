/** @type {import("lint-staged").Config} */
export default {
  "*": ["pnpm prettier . --write", "pnpm eslint . --fix"],
};
