import express, { Application, Request, Response } from 'express';
import cors from 'cors';

// Import Routes
// import questionRouter from './routes/question.routes.js'
import blogRouter from './routes/blog.routes.js';
import userRouter from './routes/user.routes.js';
import adminRouter from './routes/admin.routes.js';
import questionRouter from './routes/question.routes.js';

const app: Application = express();

// Middlewares
app.use(express.json());
app.use(cors());

// Server Check
app.get('/', (req: Request, res: Response) => {
    res.status(200).json({
        message: 'PrepareJob API is running smoothly!'
    });
});

// API Routes
app.use('/api/v1/questions', questionRouter);
app.use('/api/v1/blogs', blogRouter);
app.use('/api/v1/user', userRouter);
app.use('/api/v1/admin', adminRouter);

export default app;