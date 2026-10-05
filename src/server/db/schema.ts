// https://orm.drizzle.team/docs/sql-schema-declaration

import { pgTableCreator } from "drizzle-orm/pg-core";

/**
 * Every table must be declared through `createTable` so it gets the `sirius_` prefix.
 * drizzle-kit only manages tables matching `tablesFilter: ["sirius_*"]` in drizzle.config.ts.
 *
 * @see https://orm.drizzle.team/docs/goodies#multi-project-schema
 */
export const createTable = pgTableCreator((name) => `sirius_${name}`);
