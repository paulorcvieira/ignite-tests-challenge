import jwt from 'jsonwebtoken'
import request from 'supertest'
import { Connection, createConnection } from 'typeorm'
import { v4 as uuid } from 'uuid'

import { app } from '../../../../app'
import authConfig from '../../../../config/auth'
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

  it('must be able to get balance per existing user using the user ID', async () => {
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

    await request(app)
      .post('/api/v1/statements/withdraw')
      .send({
        amount: 500,
        description: statementData.description
      })
      .set({
        Authorization: `Bearer ${responseAuthenticate.body.token}`
      })

    const response = await request(app)
      .get('/api/v1/statements/balance')
      .set({
        Authorization: `Bearer ${responseAuthenticate.body.token}`
      })

    expect(response.body.statement).toHaveLength(2)
    expect(response.body.balance).toBe(400)
  })

  it('should no be able to get balance if it user not exists', async () => {
    await request(app).post('/api/v1/users').send(userData)

    const { secret, expiresIn } = authConfig.jwt

    const token = jwt.sign({ user: userData }, secret, {
      subject: uuid(),
      expiresIn
    })

    const response = await request(app)
      .get('/api/v1/statements/balance')
      .set({
        Authorization: `Bearer ${token}`
      })

    expect(response.status).toBe(404)
  })
})
