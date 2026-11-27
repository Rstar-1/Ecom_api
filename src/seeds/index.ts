import { seedInitialRoles } from "../modules/roles/role.seed";
import { logger } from "../utils/logger";

/** Runs all initial system seeds on startup */
export const seedDatabase = async (): Promise<void> => {
  await seedInitialRoles().catch((error: unknown) =>
    logger.warn(`⚠️ Role seed skipped: ${error instanceof Error ? error.message : String(error)}`)
  );
};

export { seedInitialRoles } from "../modules/roles/role.seed";
