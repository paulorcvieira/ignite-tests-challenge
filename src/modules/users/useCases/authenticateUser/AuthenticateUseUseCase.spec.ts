import jwt from 'jsonwebtoken'

import authConfig from '../../../../config/auth'
import { AppError } from '../../../../shared/errors/AppError'
import { User } from '../../entities/User'
import { InMemoryUsersRepository } from '../../repositories/in-memory/InMemoryUsersRepository'
import { CreateUserUseCase } from '../createUser/CreateUserUseCase'
import { ICreateUserDTO } from '../createUser/ICreateUserDTO'
import { AuthenticateUserUseCase } from './AuthenticateUserUseCase'

describe('Authenticate User Use Case', () => {
  interface ITokenUser {
    user: User
    token: string
  }

  let authenticateUserUseCase: AuthenticateUserUseCase
  let usersRepositoryInMemory: InMemoryUsersRepository
  let createUserUseCase: CreateUserUseCase

  const userData: ICreateUserDTO = {
    name: 'Test Admin',
    email: 'admin@test.com',
    password: 'test123'
  }

  beforeEach(() => {
    usersRepositoryInMemory = new InMemoryUsersRepository()
    authenticateUserUseCase = new AuthenticateUserUseCase(
      usersRepositoryInMemory
    )
    createUserUseCase = new CreateUserUseCase(usersRepositoryInMemory)
  })

  it('should be able to init a new session', async () => {
    await createUserUseCase.execute(userData)

    const { user, token } = await authenticateUserUseCase.execute({
      email: userData.email,
      password: userData.password
    })

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

  it('should not be able to init a new session if it user not exists', async () => {
    await expect(
      async () =>
        await authenticateUserUseCase.execute({
          email: userData.email,
          password: userData.password
        })
    ).rejects.toBeInstanceOf(AppError)
  })
})
