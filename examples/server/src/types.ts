
export type IProcessEnv = typeof process.env;

export interface IEnvSettings extends IProcessEnv {
  HTTP2_PORT?: string;
  PG_URL?: string;
}

export interface IConfig {
  http2: {
    port: number;
  };
  db: {
    connectionString: string;
  };
}

export interface IProfile {
  id        : number;
  email     : string;
  username  : string;
  first_name: string;
  last_name : string;
}
