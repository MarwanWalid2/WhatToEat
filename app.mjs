import express from 'express'
import path from 'path'
import { fileURLToPath } from 'url';
import './config.mjs';
import session from 'express-session';
import './db.mjs';
import mongoose from 'mongoose';

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.get('/', (req, res) => {
    res.send('Welcome to the What to Eat Today App!');
  });
  

app.listen(process.env.PORT || 3000);
