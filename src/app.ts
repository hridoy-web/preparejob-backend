import express, { Application, Request, Response } from 'express';
import cors from 'cors';

// Router Imports
import blogRouter from './routes/blog.routes.js';
import userRouter from './routes/user.routes.js';
import adminRouter from './routes/admin.routes.js';
import questionRouter from './routes/question.routes.js';

const app: Application = express();

const allowedOrigins = [
    'https://preparejob.infozia.site',
    'http://localhost:3000',
    'http://localhost:5173'
];

// Middlewares
app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
}));

app.use(express.json({ limit: '16kb' }));
app.use(express.urlencoded({ extended: true, limit: '16kb' }));

// Health Check Endpoint
app.get('/', (req: Request, res: Response) => {
    res.status(200).json({
        success: true,
        message: 'PrepareJob API is running smoothly!'
    });
});

// API Routes
app.use('/api/v1/questions', questionRouter);
app.use('/api/v1/blogs', blogRouter);
app.use('/api/v1/user', userRouter);
app.use('/api/v1/admin', adminRouter);

export default app;