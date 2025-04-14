import { Database } from 'sqlite3';
import { Transaction, User, Preference } from '../types';
import { DatabaseAdapter } from './databaseAdapter';
import { rejects } from 'assert';

export class SQLiteAdapter implements DatabaseAdapter {
    private db: Database;
    private usersTable: string = 'users';
    private transactionsTable: string = 'transactions';
    private preferencesTable: string = 'preferences';

    constructor(path = ':memory:') {
        this.db = new Database(path);
    }

    async init(): Promise<void> {
        const runAsync = (sql: string): Promise<void> =>
            new Promise((resolve, reject) => {
                this.db.run(sql, (err) => {
                    if (err) reject(err);
                    else resolve();
                });
            });

        await runAsync(`
            CREATE TABLE IF NOT EXISTS ${this.transactionsTable} (
                id TEXT PRIMARY KEY,
                userId TEXT,
                name TEXT,
                amount REAL,
                description TEXT,
                date TEXT,
                category TEXT,
                source TEXT
            )`);

        await runAsync(`
            CREATE TABLE IF NOT EXISTS ${this.usersTable} (
                id TEXT PRIMARY KEY,
                name TEXT,
                email TEXT UNIQUE,
                password TEXT
            )`);

        await runAsync(`
            CREATE TABLE IF NOT EXISTS ${this.preferencesTable} (
                id TEXT PRIMARY KEY,
                userId TEXT,
                theme TEXT,
                currency TEXT,
                language TEXT,
                notifications INTEGER
            )`);
    }

    async getAllUsers(): Promise<User[]> {

        return new Promise((resolve, reject) => {
            this.db.all(`SELECT * FROM ${this.usersTable}`, (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows as User[]);
                }
            });
        });
    }

    async getAllPreferences(): Promise<Preference[]> {

        return new Promise((resolve, reject) => {
            this.db.all(`SELECT * FROM ${this.preferencesTable}`, (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows as Preference[]);
                }
            });
        });
    }

    async getAllTransactions(): Promise<Transaction[]> {

        return new Promise((resolve, reject) => {
            this.db.all(`SELECT * FROM ${this.transactionsTable}`, (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows as Transaction[]);
                }
            });
        });
    }

    async insertUser(user: User): Promise<void> {
        return new Promise((resolve, reject) => {
            this.db.run(`INSERT INTO ${this.usersTable} (id, name, email, password) VALUES (?, ?, ?, ?)`, [user.id, user.name, user.email, user.password], (err) => {
                if (err) {
                    if ((err as any).code === 'SQLITE_CONSTRAINT') {
                        reject(new Error('Email already in use'));
                    } else {
                        reject(err);
                    }
                } else {
                    resolve();
                }
            });
        });
    }


    async deleteUser(id: string): Promise<void> {
        return new Promise((resolve, reject) => {
            this.db.run(`DELETE FROM ${this.usersTable} WHERE id = ?`, [id], (err) => {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
    }

    async updateUser(id: string, user: User): Promise<void> {
        return new Promise((resolve, reject) => {
            this.db.run(`UPDATE ${this.usersTable}
                SET name = ?, email = ?, password = ?
                WHERE id = ?`,
                [user.name, user.email, user.password, id],
                (err) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve();
                    }
                });
        })
    }

    async getUserById(id: string): Promise<User | null> {
        return new Promise((resolve, reject) => {
            this.db.get(`
                SELECT * FROM ${this.usersTable} WHERE id = ?`,
                [id],
                (err, row) => {
                    if (err) {
                        reject(err);
                    } else if (row) {
                        resolve(row as User);
                    } else {
                        resolve(null);
                    }
                })
        })
    }

    async getUserByEmail(email: string): Promise<User | null> {
        return new Promise((resolve, reject) => {
            this.db.get(`
                SELECT * FROM ${this.usersTable} WHERE email = ?`,
                [email],
                (err, row) => {
                    if (err) {
                        reject(err);
                    } else if (row) {
                        resolve(row as User);
                    } else {
                        resolve(null);
                    }
                })
        })
    }


    async getUserPreferences(userId: string): Promise<Preference | null> {
        return new Promise((resolve, reject) => {
            this.db.get(`
                SELECT * FROM ${this.preferencesTable} WHERE userId = ?`,
                [userId],
                (err, row) => {
                    if (err) {
                        reject(err);
                    } else if (row) {
                        resolve(row as Preference);
                    } else {
                        resolve(null);
                    }
                })
        })
    }

    async updateUserPreferences(userId: string, preferences: Preference): Promise<void> {
        // if the user doesn't have preferences, insert them

        return new Promise((resolve, reject) => {
            this.db.run(`
                INSERT OR REPLACE INTO ${this.preferencesTable} (userId, theme, currency, language, notifications) 
                VALUES (?, ?, ?, ?, ?)`,
                [userId, preferences.theme, preferences.currency, preferences.language, preferences.notifications],
                (err) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve();
                    }
                })
        })
    }


    async getUserTransactions(userId: string): Promise<Transaction[]> {
        return new Promise((resolve, reject) => {
            this.db.all(`
                SELECT * FROM ${this.transactionsTable} WHERE userId = ?`,
                [userId],
                (err, rows) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(rows as Transaction[]);
                    }
                }
            )
        })
    }

    async insertUserTransaction(userId: string, tx: Transaction): Promise<void> {
        return new Promise((resolve, reject) => {
            this.db.run(`
                INSERT INTO ${this.transactionsTable} (id, userId, name, amount, description, date, category, source) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [tx.id, userId, tx.name, tx.amount, tx.description, tx.date, tx.category, tx.source],
                (err) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve();
                    }
                }
            )
        })
    }

    async deleteUserTransaction(userId: string, transactionId: string): Promise<void> {
        return new Promise((resolve, reject) => {
            this.db.run(`DELETE FROM ${this.transactionsTable} WHERE id = ? AND userId = ?`,
                [transactionId, userId],
                (err) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve();
                    }
                }
            )
        })
    }

    async updateUserTransaction(userId: string, transactionId: string, tx: Transaction): Promise<void> {
        return new Promise((resolve, reject) => {
            this.db.run(`
                UPDATE ${this.transactionsTable} 
                SET (name, amount, description, date, category, source) = (?, ?, ?, ?, ?, ?)
                WHERE id = ? AND userId = ?`,
                [tx.name, tx.amount, tx.description, tx.date, tx.category, tx.source, transactionId, userId],
                (err) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve();
                    }
                }
            )
        })
    }

}


