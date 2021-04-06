import request from 'supertest'
import { Connection, createConnection } from 'typeorm'
import { v4 as uuid } from 'uuid'

import { app } from '../../../../app'
import { ICreateUserDTO } from '../../../users/useCases/createUser/ICreateUserDTO'

describe('Create Statement Use Case', () => {
  let connection: Connection

  enum OperationType {
    DEPOSIT = 'deposit',
    WITHDRAW = 'withdraw'
  }

  interface ICreateStatementDTO {
    user_id: string
    amount: number
    description: string
    type: OperationType
  }

  const statementData: ICreateStatementDTO = {
    user_id: '',
    amount: 0,
    description: 'Statement Test',
    type: OperationType.WITHDRAW
  }

  const userData: ICreateUserDTO = {
    name: 'Test Admin',
    email: 'admin@test.com',
    password: 'test123'
  }

  beforeAll(async () => {
    connection = await createConnection()
    await connection.runMigrations()
  })

  afterAll(async () => {
    await connection.dropDatabase()
    await connection.close()
  })

  it('should be able to get one statement operation', async () => {
    await request(app).post('/api/v1/users').send(userData)

    const responseAuthenticate = await request(app)
      .post('/api/v1/sessions')
      .send({
        email: userData.email,
        password: userData.password
      })

    await request(app)
      .post('/api/v1/statements/deposit')
      .send({
        amount: 900,
        description: statementData.description
      })
      .set({
        Authorization: `Bearer ${responseAuthenticate.body.token}`
      })

    const responseWithdraw = await request(app)
      .post('/api/v1/statements/withdraw')
      .send({
        amount: 500,
        description: statementData.description
      })
      .set({
        Authorization: `Bearer ${responseAuthenticate.body.token}`
      })

    const response = await request(app)
      .get(`/api/v1/statements/${responseWithdraw.body.id}`)
      .set({
        Authorization: `Bearer ${responseAuthenticate.body.token}`
      })

    expect(response.body).toHaveProperty('id')
    expect(response.body).toHaveProperty('user_id')
    expect(response.body.type).toBe(OperationType.WITHDRAW)
    expect(response.body.amount).toBe('500.00')
    expect(response.body.description).toBe(statementData.description)
  })

  it('should no be able to get one statement operation if it user not exists', async () => {
    await request(app).post('/api/v1/users').send(userData)

    const responseAuthenticate = await request(app)
      .post('/api/v1/sessions')
      .send({
        email: userData.email,
        password: userData.password
      })

    await request(app)
      .post('/api/v1/statements/deposit')
      .send({
        amount: 900,
        description: statementData.description
      })
      .set({
        Authorization: `Bearer ${responseAuthenticate.body.token}`
      })

    const responseWithdraw = await request(app)
      .post('/api/v1/statements/withdraw')
      .send({
        amount: 500,
        description: statementData.description
      })
      .set({
        Authorization: `Bearer ${responseAuthenticate.body.token}`
      })

    const response = await request(app)
      .get(`/api/v1/statements/${responseWithdraw.body.id}`)
      .set({
        Authorization: `Bearer ${responseAuthenticate.body.token}-invalid`
      })

    expect(response.status).toBe(401)
  })

  it('should no be able to get one statement operation if it statement operation not exists', async () => {
    await request(app).post('/api/v1/users').send(userData)

    const responseAuthenticate = await request(app)
      .post('/api/v1/sessions')
      .send({
        email: userData.email,
        password: userData.password
      })

    const response = await request(app)
      .get(`/api/v1/statements/${uuid()}`)
      .set({
        Authorization: `Bearer ${responseAuthenticate.body.token}`
      })

    expect(response.status).toBe(404)
  })
})
