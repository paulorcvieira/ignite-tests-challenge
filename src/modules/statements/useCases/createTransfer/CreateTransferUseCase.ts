import { container, inject, injectable } from 'tsyringe'

import { AppError } from '../../../../shared/errors/AppError'
import { IUsersRepository } from '../../../users/repositories/IUsersRepository'
import { OperationType } from '../../entities/Statement'
import { CreateStatementUseCase } from '../createStatement/CreateStatementUseCase'

interface IRequest {
  receive_user_id: string
  sender_user_id: string
  amount: number
  description: string
}

@injectable()
export class CreateTransferUseCase {
  constructor(
    @inject('UsersRepository')
    private usersRepository: IUsersRepository
  ) {}

  public async execute({
    receive_user_id,
    sender_user_id,
    amount,
    description
  }: IRequest): Promise<void> {
    if (amount <= 0) {
      throw new AppError('Amount must be greater than 0.')
    }

    const receiveUser = await this.usersRepository.findById(receive_user_id)

    if (!receiveUser) {
      throw new AppError('Receive user not found.')
    }

    const senderUser = await this.usersRepository.findById(sender_user_id)

    if (!senderUser) {
      throw new AppError('Sender user not found.')
    }

    const createStatementUseCase = container.resolve(CreateStatementUseCase)

    await createStatementUseCase.execute({
      amount: amount * -1,
      description,
      type: OperationType.TRANSFER,
      user_id: senderUser.id as string
    })

    await createStatementUseCase.execute({
      amount,
      description,
      type: OperationType.TRANSFER,
      user_id: receiveUser.id as string
    })
  }
}
