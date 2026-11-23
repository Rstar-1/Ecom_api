import { seedInitialRoles } from "../modules/roles/role.seed";
import { seedInitialSeo } from "../modules/seo/seo.service";
import { logger } from "../utils/logger";

/** Runs all initial system seeds on startup */
export const seedDatabase = async (): Promise<void> => {
  await seedInitialRoles().catch((error: unknown) =>
    logger.warn(`⚠️ Role seed skipped: ${error instanceof Error ? error.message : String(error)}`)
  );
  await seedInitialSeo().catch((error: unknown) =>
    logger.warn(`⚠️ SEO seed skipped: ${error instanceof Error ? error.message : String(error)}`)
  );
};

export { seedInitialRoles } from "../modules/roles/role.seed";
export { seedInitialSeo } from "../modules/seo/seo.service";
