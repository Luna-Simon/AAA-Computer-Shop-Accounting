import { defineConfig } from "@neon/config/v1";

export default defineConfig({

  branch: (branch) => {
    if (branch.exists) {
      // Leave existing branches untouched
      return {};
    }
    return {};
  },
});
