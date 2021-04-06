import jwt from 'jsonwebtoken'
import request from 'supertest'
import { Connection, createConnection } from 'typeorm'

import { app } from '../../../../app'
import authConfig from '../../../../config/auth'
import { User } from '../../entities/User'
import { ICreateUserDTO } from '../createUser/ICreateUserDTO'

describe('Authenticate User Controller', () => {
  let connection: Connection

  interface ITokenUser {
    user: User
    token: string
  }

  beforeAll(async () => {
    connection = await createConnection()
    await connection.runMigrations()
  })

  afterAll(async () => {
    await connection.dropDatabase()
    await connection.close()
  })

  const userData: ICreateUserDTO = {
    name: 'Test User',
    email: 'user@test.com',
    password: 'test123'
  }

  it('should be able to init a new session', async () => {
    await request(app).post('/api/v1/users').send(userData)

    const response = await request(app).post('/api/v1/sessions').send({
      email: userData.email,
      password: userData.password
    })

    const { user, token } = response.body
    const decodedToken = jwt.verify(token, authConfig.jwt.secret) as ITokenUser

    expect(user).toHaveProperty('id')
    expect(user).not.toHaveProperty('password')
    expect(user.name).toEqual(userData.name)
    expect(user.email).toEqual(userData.email)

    expect(decodedToken.user).toHaveProperty('id')
    expect(decodedToken.user).toHaveProperty('password')
    expect(decodedToken.user.name).toEqual(userData.name)
    expect(decodedToken.user.email).toEqual(userData.email)
  })

  it('should not be able to init a new session if it password is incorrect', async () => {
    const response = await request(app)
      .post('/api/v1/users')
      .send({
        email: userData.email,
        password: userData.password + '-incorrect'
      })

    expect(response.status).toBe(400)
  })
})
