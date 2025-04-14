// Suppose we have access to the database through the methods provided by ../db/databaseAdapter.ts
// and we want to implement the authentication logic using the database methods.

import { DatabaseAdapter } from "../db/databaseAdapter";
import { User } from "../types"

const { v4: uuidv4 } = require('uuid');
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const saltRounds = 10;

export class AuthService {
    private db: DatabaseAdapter;
    private secretKey: string;

    constructor(db: DatabaseAdapter, secretKey: string) {
        this.db = db;
        this.secretKey = secretKey;
    }

    async register(username: string, email: string, password: string): Promise<User | null> {
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        const id = uuidv4();
        const user: User = {
            id: id,
            name: username,
            email: email,
            password: hashedPassword
        }

        const existingUser = await this.db.getUserByEmail(email);
        if (existingUser) {
            throw new Error("User already exists");
        }

        try {
            await this.db.insertUser(user);
            return user;
        }
        catch (error) {
            throw new Error((error as any).message);
        }
    }

    private async verifyPassword(input: string, hash: string): Promise<boolean> {
        return bcrypt.compare(input, hash);
    }

    async login(email: string, password: string): Promise<string | null> {
        const user = await this.db.getUserByEmail(email);

        if (!user) {
            throw new Error("User not found");
        }

        const isMatch = await this.verifyPassword(password, user.password);
        if (!isMatch) {
            throw new Error("Invalid password");
        }

        if (await bcrypt.compare(password, user.password)) {
            return jwt.sign({ id: user.id }, this.secretKey, { expiresIn: '1h' });
        }
        return null;
    }

    async authenticate(token: string): Promise<User | null> {
        try {
            const decoded = jwt.verify(token, this.secretKey) as { id: string };
            return await this.db.getUserById(decoded.id);
        } catch (error) {
            return null;
        }
    }
}