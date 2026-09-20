import mongoose, { Schema, Document } from 'mongoose';

export interface IEasyAnswer {
  explanation: string;
  keyPoints: string[];
}

export interface IAdvancedAnswer {
  explanation: string;
}

export type AllowedTechnology =
  | 'html5'
  | 'css3'
  | 'tailwind-css'
  | 'javascript'
  | 'typescript'
  | 'react'
  | 'nextjs'
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
  serial: number;
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
    serial: {
      type: Number,
    },
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
        'html5',
        'css3',
        'tailwind-css',
        'javascript',
        'typescript',
        'react',
        'nextjs',
        'nodejs',
        'expressjs',
        'mongodb',
        'mongoose',
        'postgresql',
        'prisma',
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

// Automatic Serial Generation Middleware
questionSchema.pre('save', async function (next) {
  if (this.isNew && !this.serial) {
    const lastQuestion = await mongoose.model('Question')
      .findOne({ technology: this.technology })
      .sort({ serial: -1 });
    
    this.serial = lastQuestion ? lastQuestion.serial + 1 : 1;
  }
  (next as any)();
});

questionSchema.index({ technology: 1, difficulty: 1 });

export const Question = mongoose.models.Question || mongoose.model<IQuestion>('Question', questionSchema);