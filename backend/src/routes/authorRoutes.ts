import express from 'express';
import {
  getAuthors,
  getAuthorById,
  createAuthor,
  updateAuthor,
  deleteAuthor,
  getAuthorStats
} from '../controllers/authorController';

const router = express.Router();

router.route('/')
  .get(getAuthors)
  .post(createAuthor);

router.route('/:id')
  .get(getAuthorById)
  .put(updateAuthor)
  .delete(deleteAuthor);

router.route('/:id/stats')
  .get(getAuthorStats);

export default router;