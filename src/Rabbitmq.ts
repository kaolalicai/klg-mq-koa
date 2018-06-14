import * as _ from 'lodash'
import {Rabbitmq} from 'klg-mq'

export class KoaRabbitmq {
  mq: Rabbitmq
  handles = new Map()
  registerMap = new Map()

  constructor (url: string, prefix?: string) {
    this.mq = new Rabbitmq(url, prefix)
  }

  /**
   * 注册消费者
   * @param queue
   * @param options
   */
  register (queue) {
    if (this.registerMap.has(queue)) return
    const {handle, options} = this.handles.get(queue)
    this.mq.consumeSingleQueue(queue, options.prefetch, handle)
    this.registerMap.set(queue, true)
  }

  /**
   * 排队处理
   * @param {string} options.prefetch MQ每次处理消息的个数
   */
  queue (handle, options: { prefetch: number }) {
    return async (ctx, next) => {
      const queue = ctx.url
      if (!this.handles.has(queue)) {
        this.handles.set(queue, {
          options,
          handle
        })
      }
      // 生产
      await this.mq.queue(queue, {
        request: _.pick(ctx.request, ['query', 'body']),
        logId: ctx.logId,
        params: ctx.params
      })
      this.register(queue)
      // 状态一定为成功
      ctx.status = 200
      ctx.body = 'SUCCESS'
    }
  }
}
