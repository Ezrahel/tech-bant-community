import { Client, Account, Databases, Storage, ID } from 'appwrite';

const client = new Client();

client
  .setEndpoint(import.meta.env.VITE_APPWRITE_ENDPOINT || 'https://fra.cloud.appwrite.io/v1')
  .setProject(import.meta.env.VITE_APPWRITE_PROJECT_ID || '687554510016ab1d992a');

export const account = new Account(client);
export const databases = new Databases(client);
export const storage = new Storage(client);

export { ID };
export default client;