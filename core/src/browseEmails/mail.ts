import { google } from 'googleapis';
import dotenv from 'dotenv';

interface emailElement {
    id: string;
    snippet: string;
    date: string;
}


interface parsedEmail {
    id: string;
    date: Date;
    snippet: string;
    amount: number;
    source: string;
}

export class MailService {
    private oAuth2: any;
    private scopes: string[];

    constructor() {
        dotenv.config();

        this.oAuth2 = new google.auth.OAuth2(
            process.env.CLIENT_ID,
            process.env.CLIENT_SECRET,
            process.env.REDIRECT_URI
        );

        this.scopes = ['https://www.googleapis.com/auth/gmail.readonly'];
    }

    async generateAuthURL(): Promise<string> {
        return new Promise((resolve, reject) => {
            const authUrl = this.oAuth2.generateAuthUrl({
                access_type: 'offline',
                scope: this.scopes,
            });
            resolve(authUrl);
            reject(new Error('Failed to generate auth URL'));
        })
    }

    async getAccessToken(code: string): Promise<any> {
        return new Promise((resolve, reject) => {
            this.oAuth2.getToken(code, (err: any, token: any) => {
                if (err) {
                    console.error('Error retrieving access token', err);
                    reject(err);
                } else {
                    resolve(token);
                }
            });
        });
    }

    async listEmails(token: any): Promise<emailElement[]> {
        this.oAuth2.setCredentials(token);
        const gmail = google.gmail({ version: 'v1', auth: this.oAuth2 });
        const result = await gmail.users.messages.list({
            userId: 'me',
            q: 'from:sumeria',
            maxResults: 1000, // Adjust this number as needed
        });
        const messages = result.data.messages;
        if (!messages || messages.length === 0) {
            return [];
        } else {
            const emailElements: emailElement[] = [];
            for (let message of messages) {
                const emailId = message.id;
                if (!emailId) {
                    continue;
                }
                const email = await gmail.users.messages.get({
                    userId: 'me',
                    id: emailId,
                });
                const emailElement: emailElement = {
                    id: emailId,
                    snippet: email.data.snippet ?? 'No snippet available',
                    date: email.data.payload?.headers?.find(header => header.name === 'Date')?.value ?? 'Unknown Date'
                }
                emailElements.push(emailElement);
            }
            return emailElements;
        }
    }

    async parseEmail(email: emailElement): Promise<parsedEmail> {
        const date = new Date(email.date);
        const amountMatch = email.snippet.match(/(\d+(\.\d{1,2})?)/);
        const sourceMatch = email.snippet.match(/from:\s*([^ ]+)/i);

        const amount = amountMatch ? parseFloat(amountMatch[0]) : 0;
        const source = sourceMatch ? sourceMatch[1] : 'Unknown Source';

        return {
            id: email.id,
            date: date,
            snippet: email.snippet,
            amount: amount,
            source: source
        };
    }
}
