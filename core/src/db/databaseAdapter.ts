import { Transaction, User, Preference } from '../types';

export interface DatabaseAdapter {

    init(): Promise<void>;

    getAllUsers(): Promise<User[]>;
    insertUser(user: User): Promise<void>;
    deleteUser(id: string): Promise<void>;
    updateUser(id: string, user: User): Promise<void>;
    getUserById(id: string): Promise<User | null>;

    getUserPreferences(userId: string): Promise<Preference | null>;
    updateUserPreferences(userId: string, preferences: Preference): Promise<void>;

    getUserTransactions(userId: string): Promise<Transaction[]>;
    insertUserTransaction(userId: string, tx: Transaction): Promise<void>;
    deleteUserTransaction(userId: string, transactionId: string): Promise<void>;
    updateUserTransaction(userId: string, transactionId: string, tx: Transaction): Promise<void>;
}
