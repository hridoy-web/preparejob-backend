import { Router } from 'express';
import {
  createQuestion,
  deleteQuestion,
  getAllQuestions,
  getQuestionById,
  updateQuestion,
} from '../controller/question.controller.js';

const router = Router();

// Routes for Question Module
router.route('/')
  .post(createQuestion)
  .get(getAllQuestions);

router.route('/:id')
  .get(getQuestionById)
  .put(updateQuestion)
  .delete(deleteQuestion);

export default router;