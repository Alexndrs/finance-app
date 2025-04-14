import { SQLiteAdapter } from '../db/sqliteAdapter';
import { User, Preference, Transaction } from '../types';
import { randomUUID } from 'crypto';


async function runTest(testName: string, testFn: () => Promise<void>) {
    try {
        await testFn();
        console.log(`✅ Test "${testName}" passed`);
    } catch (err) {
        console.error(`❌ Test "${testName}" failed:`, err);
    }
}



async function testInsertAndGetUsers() {
    const adapter = new SQLiteAdapter("testInsertAndGetUsers.db");
    await adapter.init();

    const newUser: User = {
        id: randomUUID(),
        name: 'Alex',
        email: 'Alex@example.com',
        password: 'hashedpassword123',
    };

    await adapter.insertUser(newUser);

    const users = await adapter.getAllUsers();
    console.assert(users.length > 0, 'No users found in the database');
    console.assert(users.some(u => u.email === newUser.email), 'Inserted user not found');
}

async function testGetUserById() {
    const adapter = new SQLiteAdapter("testGetUserById.db");
    await adapter.init();

    const newUser: User = {
        id: randomUUID(),
        name: 'John Doe',
        email: 'john.doe@example.com',
        password: 'securepassword123',
    };

    await adapter.insertUser(newUser);

    const retrievedUser = await adapter.getUserById(newUser.id);
    console.assert(retrievedUser !== null, 'User was not found');
    console.assert(retrievedUser?.id === newUser.id, 'User ID does not match');
    console.assert(retrievedUser?.email === newUser.email, 'User email does not match');

    const nonExistentUser = await adapter.getUserById('non-existent-id');
    console.assert(nonExistentUser === null, 'Non-existent user should return null');
}

async function testUserPreferences() {
    const adapter = new SQLiteAdapter("testUserPreferences.db");
    await adapter.init();

    const userId = randomUUID();
    const preferences: Preference = {
        id: randomUUID(),
        userId,
        theme: 'dark',
        currency: 'USD',
        language: 'en',
        notifications: true,
    };

    await adapter.updateUserPreferences(userId, preferences);

    const allPreferences = await adapter.getAllPreferences();

    const retrievedPreferences = await adapter.getUserPreferences(userId);
    console.assert(retrievedPreferences !== null, 'Preferences were not found');
    console.assert(retrievedPreferences?.theme === preferences.theme, 'Theme does not match');
    console.assert(retrievedPreferences?.currency === preferences.currency, 'Currency does not match');
}


async function testUserTransactions() {
    const adapter = new SQLiteAdapter("testUserTransactions.db");
    await adapter.init();

    const userId = randomUUID();
    const transaction: Transaction = {
        id: randomUUID(),
        userId,
        name: 'Groceries',
        amount: 50.25,
        description: 'Weekly groceries',
        date: new Date(),
        category: 'Food',
        source: 'Credit Card',
    };

    await adapter.insertUserTransaction(userId, transaction);

    const transactions = await adapter.getUserTransactions(userId);
    console.assert(transactions.length > 0, 'No transactions found');
    console.assert(transactions.some(tx => tx.id === transaction.id), 'Inserted transaction not found');

    await adapter.deleteUserTransaction(userId, transaction.id);

    const transactionsAfterDelete = await adapter.getUserTransactions(userId);
    console.assert(transactionsAfterDelete.length === 0, 'Transaction was not deleted');
}

async function testUpdateUser() {
    const adapter = new SQLiteAdapter("testUpdateUser.db");
    await adapter.init();

    const newUser: User = {
        id: randomUUID(),
        name: 'Jane Doe',
        email: 'jane.doe@example.com',
        password: 'initialpassword',
    };

    await adapter.insertUser(newUser);

    const updatedUser: User = {
        ...newUser,
        name: 'Jane Smith',
        email: 'jane.smith@example.com',
        password: 'updatedpassword',
    };

    await adapter.updateUser(newUser.id, updatedUser);

    const retrievedUser = await adapter.getUserById(newUser.id);
    console.assert(retrievedUser?.name === updatedUser.name, 'User name was not updated');
    console.assert(retrievedUser?.email === updatedUser.email, 'User email was not updated');
    console.assert(retrievedUser?.password === updatedUser.password, 'User password was not updated');
}


async function runAllTests() {
    await runTest('Insert and Get Users', testInsertAndGetUsers);
    await runTest('Get User By ID', testGetUserById);
    await runTest('User Preferences', testUserPreferences);
    await runTest('User Transactions', testUserTransactions);
    await runTest('Update User', testUpdateUser);
}

runAllTests();