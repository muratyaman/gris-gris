import http2 from 'node:http2';
import { makeClientSession } from './clientSession';
import { makeClientStream } from './clientStream';
import { IClientStreamOnComplete } from './types';

main();

function main() {
  const clientSession = makeClientSession(
    
    // on connect
    session => {

      const onComplete: IClientStreamOnComplete = async (data: string, stream: http2.ClientHttp2Stream) => {
        console.log('onComplete', { data });
        stream.end();
        session.close();
      }

      const stream1 = makeClientStream(session, 'ping', onComplete);
      console.log('ping stream', stream1);

      const stream2 = makeClientStream(session, 'profiles', onComplete);
      console.log('profiles stream', stream2);

    }
  );

  console.log(clientSession);
}
