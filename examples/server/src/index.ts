import http2 from 'node:http2';
import fs from 'node:fs';
import { makeConfig } from './config';
import { GrisGris, MessageProxy } from './gris-gris';
import { makePgSql } from './pgSql';
import { ProfileService } from './profileService';
import { resolve } from 'node:path';

main()

function main() {
  const conf = makeConfig(process.env);
  const logger = {
    debug: console.debug,
    info: console.info,
    warn: console.warn,
    error: console.error,
  };
  const secureServerOptions: http2.SecureServerOptions = {
    key:  fs.readFileSync(resolve(__dirname, '..', '..', 'localhost-privkey.pem')),
    cert: fs.readFileSync(resolve(__dirname, '..', '..', 'localhost-cert.pem')),
  };
  const msgProxy = new MessageProxy();

  const server = new GrisGris({
    serverOptions: { port: conf.http2.port },
    secureServerOptions,
    logger,
    msgProxy,
  });

  const db = makePgSql(conf);

  const profileService = new ProfileService(logger, db);

  server.onMessage('ping', async (msgIn, stream) => {
    stream.write({ ...msgIn, payload: 'pong' });
    stream.end();
  });

  server.onMessage('profiles', async (msgIn, stream) => {
    profileService.getProfiles(msgIn, stream);
  });

  server.start();
}
