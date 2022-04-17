import { init as initDatabase, User, Stats } from '@helpers';
import dotenv from 'dotenv';

if (process.env.NODE_ENV !== 'production') {
    dotenv.config();
}

await initDatabase();
console.log('TODO: create migration script');
