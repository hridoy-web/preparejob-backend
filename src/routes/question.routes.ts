import { Router } from 'express';
import { createQuestion, deleteQuestion, getAllQuestions, getQuestionById, updatedQuestion} from '../controller/question.controller.js';

const questionRouter = Router();

// Routes for Question Module
questionRouter.post('/', createQuestion);
questionRouter.get('/', getAllQuestions);
questionRouter.get('/:id', getQuestionById);
questionRouter.put('/:id', updatedQuestion);
questionRouter.delete('/:id', deleteQuestion);

export default questionRouter;