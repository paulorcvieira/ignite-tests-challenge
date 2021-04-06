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

  it('should be able to create a new statement deposit', async () => {
    await request(app).post('/api/v1/users').send(userData)

    const responseAuthenticate = await request(app)
      .post('/api/v1/sessions')
      .send({
        email: userData.email,
        password: userData.password
      })

    const response = await request(app)
      .post('/api/v1/statements/deposit')
      .send({
        amount: 900,
        description: statementData.description
      })
      .set({
        Authorization: `Bearer ${responseAuthenticate.body.token}`
      })

    expect(response.body).toHaveProperty('id')
    expect(response.body.user_id).toEqual(responseAuthenticate.body.user.id)
    expect(response.body.type).toEqual(OperationType.DEPOSIT)
    expect(response.body.amount).toEqual(900)
    expect(response.body.description).toEqual(statementData.description)
  })

  it('should no be able to create a new statement it if user not exists', async () => {
    await request(app).post('/api/v1/users').send(userData)

    const { secret, expiresIn } = authConfig.jwt

    const token = jwt.sign({ user: userData }, secret, {
      subject: uuid(),
      expiresIn
    })

    const response = await request(app)
      .post('/api/v1/statements/deposit')
      .send({
        amount: 0,
        description: statementData.description
      })
      .set({
        Authorization: `Bearer ${token}`
      })

    expect(response.status).toBe(404)
  })

  it('should be able to create a new statement', async () => {
    await request(app).post('/api/v1/users').send(userData)

    const responseAuthenticate = await request(app)
      .post('/api/v1/sessions')
      .send({
        email: userData.email,
        password: userData.password
      })

    const response = await request(app)
      .post('/api/v1/statements/withdraw')
      .send({
        amount: 500,
        description: statementData.description
      })
      .set({
        Authorization: `Bearer ${responseAuthenticate.body.token}`
      })

    expect(response.body).toHaveProperty('id')
    expect(response.body.user_id).toEqual(responseAuthenticate.body.user.id)
    expect(response.body.type).toEqual(OperationType.WITHDRAW)
    expect(response.body.amount).toEqual(500)
    expect(response.body.description).toEqual(statementData.description)
  })

  it('should no be able to create a new statement it if insufficient funds', async () => {
    await request(app).post('/api/v1/users').send(userData)

    const { secret, expiresIn } = authConfig.jwt

    const token = jwt.sign({ user: userData }, secret, {
      subject: uuid(),
      expiresIn
    })

    const response = await request(app)
      .post('/api/v1/statements/withdwaw')
      .send({
        amount: 1000,
        description: statementData.description,
        type: OperationType.WITHDRAW
      })
      .set({
        Authorization: `Bearer ${token}`
      })

    expect(response.status).toBe(404)
  })
})
