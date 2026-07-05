import { sql } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'

import * as relations from './relations'
import * as schema from './schema'

/**
 * Thrown by getDb() when no DATABASE_URL/DATABASE_RESTRICTED_URL is
 * configured. Callers that can operate without a database (e.g. the
 * FreePlanTour guest/modal chat path) should check isDatabaseConfigured()
 * first instead of relying on this being thrown; callers that genuinely
 * require a database should let it propagate (or catch it to return a
 * clear "Database is not configured" response).
 */
export class DatabaseNotConfiguredError extends Error {
  constructor(
    message = 'DATABASE_URL or DATABASE_RESTRICTED_URL environment variable is not set'
  ) {
    super(message)
    this.name = 'DatabaseNotConfiguredError'
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, DatabaseNotConfiguredError)
    }
  }
}

export function isDatabaseConfigured(): boolean {
  return Boolean(
    process.env.DATABASE_URL || process.env.DATABASE_RESTRICTED_URL
  )
}

function createDbClient() {
  const isTest = process.env.NODE_ENV === 'test'
  const isDevelopment = process.env.NODE_ENV === 'development'

  // Prefer restricted user for application runtime
  const connectionString =
    process.env.DATABASE_RESTRICTED_URL ?? // Prefer restricted user
    process.env.DATABASE_URL ??
    (isTest ? 'postgres://user:pass@localhost:5432/testdb' : undefined)

  if (!connectionString) {
    throw new DatabaseNotConfiguredError()
  }

  // SSL configuration: Use environment variable to control SSL
  // DATABASE_SSL_DISABLED=true disables SSL completely (for local/Docker PostgreSQL)
  // Default is to enable SSL with certificate verification (for cloud databases like Neon, Supabase)
  const sslConfig =
    process.env.DATABASE_SSL_DISABLED === 'true'
      ? false // Disable SSL entirely for local PostgreSQL
      : { rejectUnauthorized: true } // Enable SSL with verification for cloud DBs

  const client = postgres(connectionString, {
    ssl: sslConfig,
    prepare: false,
    max: 20 // Max 20 connections
  })

  const instance = drizzle(client, {
    schema: { ...schema, ...relations }
  })

  // Log which connection is being used (for debugging)
  if (isDevelopment) {
    console.log(
      '[DB] Using connection:',
      process.env.DATABASE_RESTRICTED_URL
        ? 'Restricted User (RLS Active)'
        : 'Owner User (RLS Bypassed)'
    )
  }

  // Verify restricted user permissions on first connection (dev only, non-blocking)
  if (
    process.env.DATABASE_RESTRICTED_URL &&
    !isTest &&
    typeof window === 'undefined' &&
    process.env.NODE_ENV !== 'production'
  ) {
    ;(async () => {
      try {
        const result = await instance.execute<{ current_user: string }>(
          sql`SELECT current_user`
        )
        const currentUser = result[0]?.current_user

        if (isDevelopment) {
          console.log('[DB] ✓ Connection verified as user:', currentUser)
        }

        // Verify it's the restricted user (app_user)
        if (
          currentUser &&
          !currentUser.includes('app_user') &&
          !currentUser.includes('neondb_owner')
        ) {
          console.warn(
            '[DB] ⚠️ Warning: Expected app_user but connected as:',
            currentUser
          )
        }
      } catch (error) {
        console.error('[DB] ✗ Failed to verify database connection:', error)
        // Log the error but don't terminate the application
        // This allows development to continue even with connection issues
      }
    })()
  }

  return instance
}

let cachedDb: ReturnType<typeof createDbClient> | undefined

/**
 * Lazily creates (and memoizes) the Drizzle/Postgres client. Throws
 * DatabaseNotConfiguredError if neither DATABASE_URL nor
 * DATABASE_RESTRICTED_URL is set (outside test mode).
 *
 * Only call this inside request-time functions — never at module scope.
 * Importing this module (or anything that imports it) must never require a
 * database; only calling getDb() does.
 */
export function getDb(): ReturnType<typeof createDbClient> {
  if (!cachedDb) {
    cachedDb = createDbClient()
  }
  return cachedDb
}

// Helper type for all tables
export type Schema = typeof schema
