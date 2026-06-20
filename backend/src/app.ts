import express from 'express';
import cors from 'cors';
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
import { errorHandler } from './shared/middleware/error-handler';

const app = express();

app.use(cors());
app.use(express.json());

app.use('/subjects', subjectsRouter);
app.use('/subjects/:subjectId/chapters', subjectChaptersRouter);
app.use('/chapters', chaptersRouter);
app.use('/chapters/:chapterId/topics', chapterTopicsRouter);
app.use('/topics', topicsRouter);
app.use('/topics/:topicId/questions', topicQuestionsRouter);
app.use('/questions', questionsRouter);

app.use(errorHandler);

export default app;
