import mongoose, { Schema, Document } from 'mongoose';

export interface IEasyAnswer {
  explanation: string;
  keyPoints: string[];
}

export interface IAdvancedAnswer {
  explanation: string;
}

export type AllowedTechnology =
  | 'html'
  | 'css'
  | 'tailwind'
  | 'javascript'
  | 'typescript'
  | 'react'
  | 'nextjs'
  | 'redux'
  | 'tanstack-query'
  | 'nodejs'
  | 'expressjs'
  | 'mongodb'
  | 'mongoose'
  | 'postgresql'
  | 'prisma'
  | 'redis'
  | 'git-github'
  | 'docker';

export interface IQuestion extends Document {
  title: string;
  technology: AllowedTechnology;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  importanceTag: string;
  easyAnswer: IEasyAnswer;
  advancedAnswer?: IAdvancedAnswer;
  createdAt: Date;
  updatedAt: Date;
}

const questionSchema = new Schema<IQuestion>(
  {
    title: {
      type: String,
      required: [true, 'Question title is required'],
      trim: true,
    },
    technology: {
      type: String,
      required: [true, 'Technology category is required'],
      lowercase: true,
      trim: true,
      enum: [
        'html',
        'css',
        'tailwind',
        'javascript',
        'typescript',
        'react',
        'nextjs',
        'redux',
        'tanstack-query',
        'nodejs',
        'expressjs',
        'mongodb',
        'mongoose',
        'postgresql',
        'prisma',
        'redis',
        'git-github',
        'docker',
      ],
    },
    difficulty: {
      type: String,
      required: true,
      enum: ['Easy', 'Medium', 'Hard'],
      default: 'Easy',
    },
    importanceTag: {
      type: String,
      default: 'High Priority',
    },
    easyAnswer: {
      explanation: {
        type: String,
        required: [true, 'Easy answer explanation is required'],
      },
      keyPoints: [{ type: String }],
    },
    advancedAnswer: {
      explanation: {
        type: String,
        default: '',
      },
    },
  },
  { timestamps: true }
);

questionSchema.index({ technology: 1, difficulty: 1 });

export const Question = mongoose.models.Question || mongoose.model<IQuestion>('Question', questionSchema);