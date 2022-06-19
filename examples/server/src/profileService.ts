import { IMessage, ILogger, IStream, ts } from './gris-gris';
import { IPgSql } from './pgSql';

export class ProfileService {

  constructor(
    protected readonly logger: ILogger,
    protected readonly db: IPgSql,
  ) {
    // do nothing
  }

  async getProfiles(msgIn: IMessage, stream: IStream) {
    const offset = msgIn.payload?.offset ?? 0;

    for await (const rows of this.db.profiles(offset)) {
      const msgOut: IMessage = {
        ...msgIn,
        at: ts(),
        idx: 0,
        done: true,
        payload: rows, // batching is middle ground between sending rows 1-by-1 and in hundreds
      }
      stream.write(msgOut);
    }

    const msgOut: IMessage = {
      ...msgIn,
      at: ts(),
      idx: 0,
      done: true,
      payload: null, // batching is middle ground between sending rows 1-by-1 and in hundreds
    }
    stream.write(msgOut);
  }

}