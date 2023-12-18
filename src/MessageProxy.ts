import { ILogger, IMessage, IMessageProcessor, IMessageProxy, IMessageProxyOptions, IStreamManager } from './types';

export class MessageProxy implements IMessageProxy {
  protected msgProcessors: Record<string, IMessageProcessor> = {};
  protected logger: ILogger;

  constructor(
    public options: IMessageProxyOptions,
  ) {
    const {
      msgProcessors = {},
      logger = console,
    } = options;
    this.logger = logger;
    this.msgProcessors = msgProcessors || {};
  }

  onMessage = <TPayloadIn = any>(msgKind: string, msgProcessor: IMessageProcessor<TPayloadIn>): void => {
    this.msgProcessors[msgKind] = msgProcessor;
  }

  removeMessageProcessor = (msgKind: string): void => {
    delete this.msgProcessors[msgKind];
  }

  processMessage = async (msgIn: IMessage, streamMgr: IStreamManager) => {
    const { logger } = this;
    logger.info('processMessage', msgIn);

    if (msgIn.msgKind in this.msgProcessors) {
      // we know this message kind!
      const proc = this.msgProcessors[msgIn.msgKind];
      streamMgr.respondOK();
      await proc(msgIn, streamMgr);

    } else {

      streamMgr.respondError('unknown message kind');
    }
  }
}
