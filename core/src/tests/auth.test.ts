import { SQLiteAdapter } from '../db/sqliteAdapter';
import { DatabaseAdapter } from '../db/databaseAdapter';
import { AuthService } from '../auth/auth';
import { User } from '../types';
import { randomUUID } from 'crypto';
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";


async function runTest(testName: string, testFn: () => Promise<void>) {
    try {
        await testFn();
        console.log(`✅ Test "${testName}" passed`);
    } catch (err) {
        console.error(`❌ Test "${testName}" failed:`, err);
    }
}

// ----------- MOCK TESTS --------------

function getMockAdapter(): DatabaseAdapter {
    const users: Record<string, User> = {};

    return {
        init: async () => { },
        getAllUsers: async () => Object.values(users),
        insertUser: async (user) => {
            if (Object.values(users).some(u => u.email === user.email)) {
                throw new Error("User already exists");
            }
            users[user.id] = user;
        },
        deleteUser: async (id) => { delete users[id]; },
        updateUser: async (id, user) => { users[id] = user; },
        getUserById: async (id) => users[id] || null,
        getUserByEmail: async (email) => Object.values(users).find(u => u.email === email) || null,
        getUserPreferences: async () => null,
        updateUserPreferences: async () => { },
        getUserTransactions: async () => [],
        insertUserTransaction: async () => { },
        deleteUserTransaction: async () => { },
        updateUserTransaction: async () => { }
    };
}

async function runAllTests() {
    console.log('\n======== Running Auth Tests ========');

    // ---------- Tests unitaires avec mock ----------
    const mockAuth = new AuthService(getMockAdapter(), "secret");

    await runTest("register() should store a new user (mock)", async () => {
        const user = await mockAuth.register("mockuser", "mock@example.com", "mockpass");
        if (!user || user.email !== "mock@example.com") throw new Error("Registration failed");
    });

    await runTest("register() should throw if email already exists (mock)", async () => {
        let errorCaught = false;
        try {
            await mockAuth.register("another", "mock@example.com", "mockpass");
        } catch (err) {
            errorCaught = true;
        }
        if (!errorCaught) throw new Error("Duplicate email not handled");
    });

    await runTest("login() should return a valid JWT (mock)", async () => {
        const token = await mockAuth.login("mock@example.com", "mockpass");
        const decoded = jwt.verify(token!, "secret") as any;
        if (!decoded.id) throw new Error("Invalid token");
    });

    await runTest("login() should fail with wrong password (mock)", async () => {
        let errorCaught = false;
        try {
            await mockAuth.login("mock@example.com", "wrongpass");
        } catch (err) {
            errorCaught = (err as Error).message === "Invalid password";
        }
        if (!errorCaught) throw new Error("Expected error was not thrown for wrong password (mock)");
    });

    await runTest("login() should fail with non-existing user (mock)", async () => {
        let errorCaught = false;
        try {
            await mockAuth.login("unknown@example.com", "mockpass");
        } catch (err) {
            errorCaught = (err as Error).message === "User not found";
        }
        if (!errorCaught) throw new Error("Expected error was not thrown for unknown user (mock)");
    });

    await runTest("authenticate() should retrieve a user from token (mock)", async () => {
        const token = await mockAuth.login("mock@example.com", "mockpass");
        const user = await mockAuth.authenticate(token!);
        if (!user || user.email !== "mock@example.com") throw new Error("Authentication failed");
    });

    await runTest("authenticate() should return null for invalid token (mock)", async () => {
        const user = await mockAuth.authenticate("invalid.token.here");
        if (user) throw new Error("Should not authenticate invalid token");
    });

    // ---------- Tests d'intégration avec SQLite ----------
    const sqliteDb = new SQLiteAdapter();
    await sqliteDb.init();
    const sqliteAuth = new AuthService(sqliteDb, "sqlite_secret");

    const testEmail = `test_${randomUUID()}@test.com`;
    const testPassword = "secure123";

    await runTest("register() with SQLite should store a user", async () => {
        const user = await sqliteAuth.register("sqliteUser", testEmail, testPassword);
        if (!user || user.email !== testEmail) throw new Error("Registration with SQLite failed");
    });

    await runTest("register() should throw if email already exists (SQLite)", async () => {
        let errorCaught = false;
        try {
            await sqliteAuth.register("another", testEmail, testPassword);
        } catch (err) {
            errorCaught = true;
        }
        if (!errorCaught) throw new Error("Duplicate email not handled in SQLite");
    });

    await runTest("login() with SQLite should return a token", async () => {
        const token = await sqliteAuth.login(testEmail, testPassword);
        if (!token) throw new Error("Login with SQLite failed");
        const decoded = jwt.verify(token, "sqlite_secret") as any;
        if (!decoded.id) throw new Error("JWT decoding failed");
    });

    await runTest("login() should fail with wrong password (SQLite)", async () => {
        let errorCaught = false;
        try {
            await sqliteAuth.login(testEmail, "wrongpass");
        } catch (err) {
            errorCaught = (err as Error).message === "Invalid password";
        }
        if (!errorCaught) throw new Error("Expected error was not thrown for wrong password (SQLite)");
    });


    await runTest("authenticate() with SQLite should return user", async () => {
        const token = await sqliteAuth.login(testEmail, testPassword);
        const user = await sqliteAuth.authenticate(token!);
        if (!user || user.email !== testEmail) throw new Error("Auth from token failed (SQLite)");
    });

    await runTest("authenticate() should return null for invalid token (SQLite)", async () => {
        const user = await sqliteAuth.authenticate("bad.token.value");
        if (user) throw new Error("Invalid token accepted (SQLite)");
    });
}

// Appel explicite
runAllTests();
