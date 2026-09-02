import mongoose, { Schema, Document } from 'mongoose';

export interface IComment {
  userId: string;
  userName: string;
  userImage?: string;
  commentText: string;
  createdAt?: Date;
}

export interface IBlog extends Document {
  title: string;
  slug: string;
  content: string;
  bannerImage: string;
  category: string;
  readTime: string;
  likes: string[];
  comments: IComment[];
  createdAt: Date;
  updatedAt: Date;
}

const commentSchema = new Schema<IComment>(
  {
    userId: { type: String, required: true },
    userName: { type: String, required: true },
    userImage: { type: String },
    commentText: { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

const blogSchema = new Schema<IBlog>(
  {
    title: {
      type: String,
      required: [true, 'Blog title is required'],
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    content: {
      type: String,
      required: [true, 'Blog content is required'],
    },
   bannerImage: {
      url: {
         type: String,
         required: [true, 'Banner image URL is required']
           },
      publicId: {
         type: String,
         required: [true, 'Banner image publicId is required'] 
       },
    },
    category: {
      type: String,
      required: true,
      trim: true,
    },
    readTime: {
      type: String,
      default: '5 min read',
    },
    likes: [{ type: String }],
    comments: [commentSchema],
  },
  { timestamps: true }
);

export const Blog = mongoose.models.Blog || mongoose.model<IBlog>('Blog', blogSchema);
