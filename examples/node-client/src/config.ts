import 'dotenv/config';
import { IConfig, IEnvSettings } from './types';

export function makeConfig(penv: IEnvSettings): IConfig {
  return {
    http2: {
      host: penv?.HTTP2_HOST || 'http://localhost:8000',
    },
  };
}
