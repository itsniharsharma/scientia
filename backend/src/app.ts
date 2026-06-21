import express from 'express';
import cors from 'cors';
import authRouter from './modules/auth/auth.routes';
import testsRouter from './modules/tests/tests.routes';
import attemptsRouter from './modules/attempts/attempts.routes';
import studentRouter from './modules/student/student.routes';
import batchesRouter from './modules/batches/batches.routes';
import teacherRouter from './modules/teacher/teacher.routes';
import subjectsRouter from './modules/subjects/subjects.routes';
import {
  subjectChaptersRouter,
  chaptersRouter,
} from './modules/chapters/chapters.routes';
import {
  chapterTopicsRouter,
  topicsRouter,
} from './modules/topics/topics.routes';
import {
  topicQuestionsRouter,
  questionsRouter,
} from './modules/questions/questions.routes';
import cloudinaryRouter from './modules/cloudinary/cloudinary.routes';
import { errorHandler } from './shared/middleware/error-handler';

const app = express();

// Allow the Electron renderer (dev: localhost:5173, prod: file:// → null origin) + public website
const allowedOrigins = new Set(['http://localhost:5173', 'http://localhost:5174', 'null']);
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.has(origin)) callback(null, true);
      else callback(new Error('CORS: origin not allowed'));
    },
  }),
);
app.use(express.json());

app.use('/auth', authRouter);
app.use('/tests', testsRouter);
app.use('/attempts', attemptsRouter);
app.use('/student', studentRouter);
// /teacher/batches MUST be registered before /teacher to avoid prefix collision
app.use('/teacher/batches', batchesRouter);
app.use('/teacher', teacherRouter);
app.use('/subjects', subjectsRouter);
app.use('/subjects/:subjectId/chapters', subjectChaptersRouter);
app.use('/chapters', chaptersRouter);
app.use('/chapters/:chapterId/topics', chapterTopicsRouter);
app.use('/topics', topicsRouter);
app.use('/topics/:topicId/questions', topicQuestionsRouter);
app.use('/questions', questionsRouter);
app.use('/cloudinary', cloudinaryRouter);

app.use(errorHandler);

export default app;
