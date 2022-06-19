import { Pool } from 'pg';
import Cursor from 'pg-cursor';
import { IConfig, IProfile } from './types';

// @see https://node-postgres.com/api/cursor

export type IPgSql = ReturnType<typeof makePgSql>;

export function makePgSql(conf: IConfig) {
  const { connectionString } = conf.db;
  const _pool = new Pool({ connectionString });

  // use generics for row type
  async function asyncCursor<T = any>(cursor: Cursor<T>, pageSize = 10): Promise<T[]> {
    return new Promise((resolve, reject) => {
      cursor.read(pageSize, (err, rows) => {
        if (err) reject(err);
        resolve(rows);
      });
    });
  }

  async function* queryWithCursor<T = any>(text: string, values: any[], pageSize = 10) {
    console.info('PgSQL queryWithCursor...');
    const client = await _pool.connect();
    const cursor = client.query(new Cursor<T>(text, values));
    try {
      while (true) {
        const rows: T[] = await asyncCursor<T>(cursor, pageSize);
        if (rows.length === 0) break;
        // for (const row of rows) {
        //   yield row;
        // }
        yield rows; // send small batches, rather than 1-by-1
      }
    } catch (err) {
      console.error('queryWithCursor error', err);
    } finally {
      if (cursor) {
        await cursor.close();
      }
    }
  };

  async function* profiles(offset = 0) {
    // e.g. get 1000 records but in batches of 10
    console.info('PgSQL profiles...');
    const text = `
SELECT
  id,
  email,
  username,
  first_name,
  last_name
FROM public.profile 
ORDER BY last_name, first_name 
LIMIT 1000
OFFSET $1
`;
    const values = [ offset ];

    yield* queryWithCursor<IProfile>(text, values);
  }

  return { _pool, queryWithCursor, profiles };
}
