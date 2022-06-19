import 'dotenv/config';
import { IConfig, IEnvSettings } from './types';

export function makeConfig(penv: IEnvSettings): IConfig {
  return {
    http2: {
      port: Number.parseInt(penv?.HTTP2_PORT || '8000'),
    },
    db: {
      connectionString: penv.PG_URL || 'postgresql://dbuser:secretpassword@database.server.com:3211/mydb',
    },
  };
}
