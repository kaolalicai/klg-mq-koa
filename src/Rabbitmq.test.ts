import {KoaRabbitmq} from './Rabbitmq'
import * as Koa from 'koa'
import * as bodyParser from 'koa-bodyparser'
import {Context} from 'koa'
import * as supertest from 'supertest'
import {SuperTest, Test} from 'supertest'


async function delay (time) {
  return new Promise(resolve => {
    setTimeout(resolve, time)
  })
}

describe('Koa Rabbitmq test', async function () {
  let mq = new KoaRabbitmq('amqp://joda:5672', 'test')
  let count = 0
  let app: Koa
  let request: SuperTest<Test>
  const query = {b: 'hello'}
  const body = {a: 23}

  async function endPoint (ctx: Context, next) {
    expect(ctx.request.query).toEqual(query)
    expect(ctx.request.body).toEqual(body)
    ctx.body = 'Hello World'
    count++
  }

  beforeAll((done) => {
    app = new Koa()
    app.use(bodyParser())
    // app.use(async function (ctx, next) {
    //   console.log('=============')
    //   await next()
    // })
    app.use(mq.queue(endPoint, {prefetch: 2}))
    request = supertest.agent(app.listen(3007))
    done()
  })

  it(' 流程测试 ', async () => {
    await request.post('/').query(query).send({a: 23}).expect(200)
    await delay(300)
    expect(count).toEqual(1)
  })


  it(' 所有请求都被正确处理了 ', async () => {
    count = 0
    let qs = []
    for (let i = 0; i < 5; i++) {
      qs.push(request.post('/').query({b: 'hello'}).send({a: 23}))
    }
    await Promise.all(qs)
    await delay(300)
    expect(count).toEqual(5)
  })

})
