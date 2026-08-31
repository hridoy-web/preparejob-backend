import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { Question } from "../models/question.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";

// POST /api/v1/questions → createQuestion

export const createQuestion= asyncHandler(async(req:Request,res:Response)=>{
const {title, technology, difficulty, importanceTag,easyAnswer,advancedAnswer, } = req.body;

if(!title || !technology || !easyAnswer || !easyAnswer.explanation){
    throw new ApiError(400,"Title, Technology and easyAnswer explanation are required");
}


    const question = await Question.create({
        title,
    technology,
    difficulty,
    importanceTag,
    easyAnswer,
    advancedAnswer,
    })

    return res.status(201).json(
       new ApiResponse(201,question,"Question added Succesfully")
    )

})





// Purpose: Create a new question from the Admin Dashboard

// GET /api/v1/questions → getAllQuestions

export const getAllQuestions = asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const skip = (page - 1) * limit;

  const filter: Record<string, unknown> = {};

  if (req.query.technology) {
    filter.technology = (req.query.technology as string).toLowerCase();
  }

  if (req.query.difficulty) {
    filter.difficulty = req.query.difficulty as string;
  }

  const questions = await Question.find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const totalQuestions = await Question.countDocuments(filter);

  const responseData = {
    questions,
    pagination: {
      currentPage: page,
      totalPages: Math.ceil(totalQuestions / limit),
      totalQuestions,
      limit,
    },
  };

  return res.status(200).json(new ApiResponse(200, responseData, 'Questions fetched successfully'));
});

// Purpose: Fetch all questions with pagination and sorting for Explore page & Admin table

// GET /api/v1/questions/:id → getQuestionById

export const getQuestionById = asyncHandler(async (req: Request, res: Response) => {
    const {id} = req.params;
    const question = await Question.findById(id);

    if(!question){
        throw new ApiError(404, 'Question not found with this id');
    }

    res.status(200).json(new ApiResponse(200,question,"Question is Fetched Successfully"));
});

// Purpose: Retrieve details and answer for a single question

// PUT /api/v1/questions/:id → updateQuestion

export const updatedQuestion = asyncHandler(async(req: Request, res: Response)=>{
    const {id} = req.params;
    const updatedQuestion = await Question.findByIdAndUpdate(id,req.body,{
        new:true,
        runValidators : true,
    });


    if(!updatedQuestion){
       throw new ApiError(404,"Question not found to update");
    }

    res.status(200).json(
        new ApiResponse(200, updatedQuestion, "Question updated successfully")
    );



});

// Purpose: Update an existing question from the Admin Dashboard

// DELETE /api/v1/questions/:id → deleteQuestion


export const deleteQuestion = asyncHandler(async(req: Request, res: Response)=>{
    const {id} = req.params;

    const deleteQuestion = await Question.findByIdAndDelete(id);

    if(!deleteQuestion){
      throw  new ApiError(404,"Question not found to delete")
    };

    res.status(200).json(
      new  ApiResponse(200,"Question deleted Succesfully")
    );

})

// Purpose: Delete a question from the database


// export default {createQuestion, getAllQuestions, getQuestionById}