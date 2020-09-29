import { EntityRepository, getRepository, Repository } from 'typeorm';

import Transaction from '../models/Transaction';

interface Balance {
  income: number;
  outcome: number;
  total: number;
}

interface Response {
  transactions: Transaction[];
  balance: Balance;
}

@EntityRepository(Transaction)
class TransactionsRepository extends Repository<Transaction> {
  public async getBalance(): Promise<Balance> {
    const repository = getRepository(Transaction);

    const transactions = await repository.find();

    const income = transactions
      .filter(trans => trans.type === 'income')
      .reduce((previous, trans) => previous + trans.value, 0);

    const outcome = transactions
      .filter(trans => trans.type === 'outcome')
      .reduce((previous, trans) => previous + trans.value, 0);

    const total = income - outcome;

    return { income, outcome, total };
  }

  public async getAll(): Promise<Response> {
    const transactions = await this.find();
    const balance = await this.getBalance();
    const final = { transactions, balance };
    return final;
  }
}

export default TransactionsRepository;
