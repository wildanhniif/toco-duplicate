const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { getAllArticles, getArticleBySlug, getArticleById, createArticle, updateArticle, deleteArticle } = require('../controllers/articleController');

router.get('/', getAllArticles);
router.get('/manage/:id', protect, getArticleById);
router.get('/:slug', getArticleBySlug);
router.post('/', protect, createArticle);
router.put('/:id', protect, updateArticle);
router.delete('/:id', protect, deleteArticle);

module.exports = router;
