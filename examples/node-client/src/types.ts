import http2 from 'node:http2';

export type IProcessEnv = typeof process.env;

export interface IEnvSettings extends IProcessEnv {
  HTTP2_HOST?: string;
}

export interface IConfig {
  http2: {
    host: string;
  };
}

export interface IClientStreamOnComplete {
  (data: string, stream: http2.ClientHttp2Stream): Promise<void>;
}
