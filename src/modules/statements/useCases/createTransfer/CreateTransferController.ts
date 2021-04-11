import { Request, Response } from 'express'
import { container } from 'tsyringe'

import { CreateTransferUseCase } from './CreateTransferUseCase'

export class CreateTransferController {
  public async handle(request: Request, _response: Response): Promise<void> {
    const { user_id: receive_user_id } = request.params
    const { amount, description } = request.body
    const sender_user_id = request.user.id

    const createTransferUseCase = container.resolve(CreateTransferUseCase)

    await createTransferUseCase.execute({
      amount,
      description,
      receive_user_id,
      sender_user_id
    })
  }
}
