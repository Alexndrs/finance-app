export interface Transaction {
    id: string;
    userId: string;
    name: string;
    amount: number;
    description: string;
    date: Date;
    category: string;
    source: string;
}

export interface User {
    id: string;
    name: string;
    email: string;
    password: string;
}

export interface Preference {
    id: string;
    userId: string;
    theme: string;
    currency: string;
    language: string;
    notifications: boolean;
}
