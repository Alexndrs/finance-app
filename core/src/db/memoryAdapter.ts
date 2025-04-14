import { Transaction, User, Preference } from "../types";
import { DatabaseAdapter } from "./databaseAdapter";

export class MemoryAdapter implements DatabaseAdapter {
    private db: Map<string, Transaction> = new Map();

    constructor() {
        // Initialize the in-memory database if needed
    }

    async init(): Promise<void> {
        throw new Error("Not implemented");
    }

    async getAllUsers(): Promise<User[]> {
        throw new Error("Not implemented");
    }

    async insertUser(user: User): Promise<void> {
        throw new Error("Not implemented");
    }


    async deleteUser(id: string): Promise<void> {
        throw new Error("Not implemented");
    }

    async updateUser(id: string, user: User): Promise<void> {
        throw new Error("Not implemented");
    }

    async getUserById(id: string): Promise<User | null> {
        throw new Error("Not implemented");
    }

    async getUserByEmail(email: string): Promise<User | null> {
        throw new Error("Not implemented");
    }


    async getUserPreferences(userId: string): Promise<Preference | null> {
        throw new Error("Not implemented");
    }

    async updateUserPreferences(userId: string, preferences: Preference): Promise<void> {
        throw new Error("Not implemented");
    }


    async getUserTransactions(userId: string): Promise<Transaction[]> {
        throw new Error("Not implemented");
    }

    async insertUserTransaction(userId: string, tx: Transaction): Promise<void> {
        throw new Error("Not implemented");
    }

    async deleteUserTransaction(userId: string, transactionId: string): Promise<void> {
        throw new Error("Not implemented");
    }

    async updateUserTransaction(userId: string, transactionId: string, tx: Transaction): Promise<void> {
        throw new Error("Not implemented");
    }
}