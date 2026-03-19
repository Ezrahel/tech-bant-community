import { Pool, QueryResult, QueryResultRow } from 'pg';

let pool: Pool | null = null;
let warnedMissingConnection = false;

function getConnectionString(): string | null {
    return process.env.SUPABASE_DB_URL || process.env.DATABASE_URL || null;
}

function getPool(): Pool | null {
    const connectionString = getConnectionString();
    if (!connectionString) {
        if (!warnedMissingConnection) {
            console.warn('Direct database connection is not configured; falling back to non-SQL counter updates.');
            warnedMissingConnection = true;
        }
        return null;
    }

    if (!pool) {
        pool = new Pool({
            connectionString,
            max: 5,
            ssl: connectionString.includes('sslmode=disable') ? false : { rejectUnauthorized: false },
        });
    }

    return pool;
}

export async function queryOptional<T extends QueryResultRow>(text: string, values: unknown[] = []): Promise<QueryResult<T> | null> {
    const activePool = getPool();
    if (!activePool) return null;
    return activePool.query<T>(text, values);
}
