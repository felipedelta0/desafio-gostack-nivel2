import { getCustomRepository } from 'typeorm';
import AppError from '../errors/AppError';

import TransactionsRepository from '../repositories/TransactionsRepository';

class DeleteTransactionService {
  public async execute(id: string): Promise<void> {
    try {
      const transactionRepository = getCustomRepository(TransactionsRepository);
      await transactionRepository.delete(id);
    } catch (err) {
      throw new AppError('Delete error');
    }
  }
}

export default DeleteTransactionService;
