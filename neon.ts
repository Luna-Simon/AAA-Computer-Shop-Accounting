import { defineConfig } from "@neon/config/v1";

export default defineConfig({
  // This accounting application uses Lakebase Postgres directly via Prisma ORM.
  // Postgres is provisioned by default on every Neon project.
  // No additional Neon primitives (Auth, Functions, Object Storage, AI Gateway)
  // are required for this application.

  // Configure the production branch for the accounting app
  branch: (branch) => {
    if (branch.exists) {
      // Leave existing branches untouched
      return {};
    }
    return {};
  },
});
