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
    const adapter = new SQLiteAdapter();
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

async function testUniqueEmailConstraint() {
    const adapter = new SQLiteAdapter();
    await adapter.init();

    const user1: User = {
        id: randomUUID(),
        name: 'User One',
        email: 'duplicate@example.com',
        password: 'password123',
    };

    const user2: User = {
        id: randomUUID(),
        name: 'User Two',
        email: 'duplicate@example.com', // Même email que user1
        password: 'password456',
    };

    await adapter.insertUser(user1);

    try {
        await adapter.insertUser(user2);
        console.assert(false, 'Expected an error when inserting a user with a duplicate email');
    } catch (err) {
        console.assert((err as any).message === 'Email already in use', 'Unexpected error message');
    }
}

async function testGetUserById() {
    const adapter = new SQLiteAdapter();
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

async function testGetUserByEmail() {
    const adapter = new SQLiteAdapter();
    await adapter.init();

    const newUser: User = {
        id: randomUUID(),
        name: 'Alice',
        email: 'alice@example.com',
        password: 'securepassword123',
    };

    // Insérer un utilisateur
    await adapter.insertUser(newUser);

    // Récupérer l'utilisateur par email
    const retrievedUser = await adapter.getUserByEmail(newUser.email);
    console.assert(retrievedUser !== null, 'User was not found by email');
    console.assert(retrievedUser?.id === newUser.id, 'User ID does not match');
    console.assert(retrievedUser?.email === newUser.email, 'User email does not match');
    console.assert(retrievedUser?.name === newUser.name, 'User name does not match');
    console.assert(retrievedUser?.password === newUser.password, 'User password does not match');

    // Tester un email inexistant
    const nonExistentUser = await adapter.getUserByEmail('non-existent@example.com');
    console.assert(nonExistentUser === null, 'Non-existent email should return null');
}

async function testUserPreferences() {
    const adapter = new SQLiteAdapter();
    await adapter.init();

    const user: User = {
        id: randomUUID(),
        name: 'PrefsUser',
        email: 'prefs@example.com',
        password: 'pass'
    };

    await adapter.insertUser(user);

    const prefs: Preference = {
        id: randomUUID(),
        userId: user.id,
        theme: 'dark',
        currency: 'EUR',
        language: 'fr',
        notifications: true
    };

    await adapter.updateUserPreferences(user.id, prefs);

    const retrieved = await adapter.getUserPreferences(user.id);
    console.assert(retrieved !== null, 'Preferences were not found');
    console.assert(retrieved?.theme === prefs.theme, 'Theme does not match');
}

async function testUserTransactions() {
    const adapter = new SQLiteAdapter();
    await adapter.init();

    const user: User = {
        id: randomUUID(),
        name: 'TxUser',
        email: 'tx@example.com',
        password: 'pass'
    };
    await adapter.insertUser(user);

    const tx: Transaction = {
        id: randomUUID(),
        userId: user.id,
        name: 'Groceries',
        amount: 50.5,
        description: 'Weekly shopping',
        date: new Date('2025-04-14'),
        category: 'Food',
        source: 'Debit Card'
    };

    await adapter.insertUserTransaction(user.id, tx);
    let userTxs = await adapter.getUserTransactions(user.id);
    console.assert(userTxs.length === 1, 'Transaction not inserted');

    // Update
    const updatedTx = { ...tx, amount: 75.0, name: 'Groceries - Updated' };
    await adapter.updateUserTransaction(user.id, tx.id, updatedTx);

    userTxs = await adapter.getUserTransactions(user.id);
    console.assert(userTxs[0].amount === 75.0, 'Transaction amount not updated');

    // Delete
    await adapter.deleteUserTransaction(user.id, tx.id);
    userTxs = await adapter.getUserTransactions(user.id);
    console.assert(userTxs.length === 0, 'Transaction not deleted');
}

async function testUpdateUser() {
    const adapter = new SQLiteAdapter();
    await adapter.init();

    const user: User = {
        id: randomUUID(),
        name: 'Initial',
        email: 'initial@example.com',
        password: 'initpass'
    };

    await adapter.insertUser(user);

    const updated: User = {
        ...user,
        name: 'Updated Name',
        email: 'updated@example.com',
        password: 'newpass'
    };

    await adapter.updateUser(user.id, updated);

    const result = await adapter.getUserById(user.id);
    console.assert(result?.name === updated.name, 'User name was not updated');
    console.assert(result?.email === updated.email, 'User email was not updated');
    console.assert(result?.password === updated.password, 'User password was not updated');
}

async function testDeleteUser() {
    const adapter = new SQLiteAdapter();
    await adapter.init();

    const user: User = {
        id: randomUUID(),
        name: 'ToDelete',
        email: 'delete@example.com',
        password: 'pass'
    };

    await adapter.insertUser(user);
    await adapter.deleteUser(user.id);

    const deleted = await adapter.getUserById(user.id);
    console.assert(deleted === null, 'User was not deleted');
}


async function runAllTests() {
    console.log('\n======== Running SQLiteAdapter Tests ========');

    await runTest('Insert and Get Users', testInsertAndGetUsers);
    await runTest('Unique Email Constraint', testUniqueEmailConstraint);
    await runTest('Get User By ID', testGetUserById);
    await runTest('Get User By Email', testGetUserByEmail);
    await runTest('Update User', testUpdateUser);
    await runTest('Delete User', testDeleteUser);
    await runTest('User Preferences', testUserPreferences);
    await runTest('User Transactions', testUserTransactions);

}

runAllTests();