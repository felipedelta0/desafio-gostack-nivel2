import csvParse from 'csv-parse';
import fs from 'fs';
import path from 'path';
import { getRepository, In, getCustomRepository } from 'typeorm';
import Transaction from '../models/Transaction';
import uploadConfig from '../config/upload';
import Category from '../models/Category';
import TransactionsRepository from '../repositories/TransactionsRepository';

interface CVSTransaction {
  title: string;
  type: 'income' | 'outcome';
  value: number;
  category: string;
}
class ImportTransactionsService {
  async execute(csvFileName: string): Promise<Transaction[] | null> {
    const transactions: CVSTransaction[] = [];
    const categories: string[] = [];
    const categoriesRepository = getRepository(Category);
    const transactionsRepository = getCustomRepository(TransactionsRepository);

    const csvTransactionsFilePath = path.join(
      uploadConfig.directory,
      csvFileName,
    );
    const csvFileExists = await fs.promises.stat(csvTransactionsFilePath);
    if (csvFileExists) {
      const readCSVStream = fs.createReadStream(csvTransactionsFilePath);

      const parseStream = csvParse({
        from_line: 2,
        ltrim: true,
        rtrim: true,
      });

      const parseCSV = readCSVStream.pipe(parseStream);
      parseCSV.on('data', async line => {
        const [title, type, value, category] = line.map((cell: string) =>
          cell.trim(),
        );

        if (!title || !type || !value) return;

        categories.push(category);
        transactions.push({ title, type, value, category });
      });

      await new Promise(resolve => {
        parseCSV.on('end', resolve);
      });

      const existentCategories = await categoriesRepository.find({
        where: {
          title: In(categories),
        },
      });

      const existentCategoriesTitles = existentCategories.map(
        category => category.title,
      );

      const addCategoriesTitles = categories
        .filter(category => !existentCategoriesTitles.includes(category))
        .filter((value, index, self) => self.indexOf(value) === index);

      const newCategories = categoriesRepository.create(
        addCategoriesTitles.map(title => ({ title })),
      );

      await categoriesRepository.save(newCategories);

      const finalCategories = [...newCategories, ...existentCategories];

      const createdTransactions = transactionsRepository.create(
        transactions.map(transaction => ({
          title: transaction.title,
          type: transaction.type,
          value: transaction.value,
          category: finalCategories.find(
            category => category.title === transaction.category,
          ),
        })),
      );

      await transactionsRepository.save(createdTransactions);
      await fs.promises.unlink(csvTransactionsFilePath);
      return createdTransactions;
    }
    return null;
  }
}

export default ImportTransactionsService;
