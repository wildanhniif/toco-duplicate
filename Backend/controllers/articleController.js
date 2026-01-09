const db = require('../config/database');

/**
 * @desc    Get all articles
 * @route   GET /api/articles
 */
const getAllArticles = async (req, res) => {
  try {
    const { category, q, limit = 10, page = 1 } = req.query;
    let sql = `SELECT *, article_id as id FROM articles WHERE is_published = 1`;
    const params = [];

    if (category) {
      sql += ` AND category = ?`;
      params.push(category);
    }

    if (q) {
      sql += ` AND (title LIKE ? OR summary LIKE ?)`;
      params.push(`%${q}%`, `%${q}%`);
    }

    sql += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
    const offset = (page - 1) * limit;
    params.push(parseInt(limit), offset);

    const [articles] = await db.query(sql, params);
    
    // Get total count for pagination
    const [countResult] = await db.query(`SELECT COUNT(*) as total FROM articles WHERE is_published = 1`);
    const total = countResult[0].total;

    res.json({
        data: articles,
        meta: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            totalPages: Math.ceil(total / limit)
        }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

/**
 * @desc    Get article by slug
 * @route   GET /api/articles/:slug
 */
const getArticleBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const [articles] = await db.query(`SELECT *, article_id as id FROM articles WHERE slug = ?`, [slug]);

    if (articles.length === 0) {
      return res.status(404).json({ message: 'Article not found' });
    }

    // Increment view count
    await db.query(`UPDATE articles SET view_count = view_count + 1 WHERE slug = ?`, [slug]);

    res.json(articles[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

const slugify = (text) => {
  return text.toLowerCase()
    .replace(/[^\w ]+/g, '')              
    .replace(/ +/g, '-');
};

/**
 * @desc    Create new article
 * @route   POST /api/articles
 */
const createArticle = async (req, res) => {
  try {
    const { title, summary, content, category, image_url, is_published = 1 } = req.body;
    let { slug } = req.body;

    if (!title || !content) {
      return res.status(400).json({ message: 'Title and Content are required' });
    }

    if (!slug) {
       slug = slugify(title);
    }

    // Ensure slug uniqueness
    const [existing] = await db.query("SELECT id FROM articles WHERE slug = ?", [slug]);
    if (existing.length > 0) {
        slug = `${slug}-${Date.now()}`;
    }

    const author_name = req.user ? req.user.name : "Admin";

    const [result] = await db.query(
      `INSERT INTO articles (title, slug, summary, content, category, image_url, author_name, is_published) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [title, slug, summary, content, category, image_url, author_name, is_published]
    );

    res.status(201).json({ 
        message: 'Article created successfully',
        id: result.insertId,
        slug
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

/**
 * @desc    Update article
 * @route   PUT /api/articles/:id
 */
const updateArticle = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, slug, summary, content, category, image_url, is_published } = req.body;

    // Build update query
    const updates = [];
    const values = [];

    if (title) { updates.push("title = ?"); values.push(title); }
    if (slug) { updates.push("slug = ?"); values.push(slug); }
    if (summary) { updates.push("summary = ?"); values.push(summary); }
    if (content) { updates.push("content = ?"); values.push(content); }
    if (category) { updates.push("category = ?"); values.push(category); }
    if (image_url) { updates.push("image_url = ?"); values.push(image_url); }
    if (is_published !== undefined) { updates.push("is_published = ?"); values.push(is_published); }
    
    if (updates.length === 0) {
        return res.json({ message: 'No changes made' });
    }

    values.push(id);

    await db.query(`UPDATE articles SET ${updates.join(', ')} WHERE article_id = ?`, values);

    res.json({ message: 'Article updated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

/**
 * @desc    Delete article
 * @route   DELETE /api/articles/:id
 */
const deleteArticle = async (req, res) => {
  try {
    const { id } = req.params;
    await db.query(`DELETE FROM articles WHERE article_id = ?`, [id]);
    res.json({ message: 'Article deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

/**
 * @desc    Get article by ID (for admin/edit)
 * @route   GET /api/articles/manage/:id
 */
const getArticleById = async (req, res) => {
  try {
    const { id } = req.params;
    const [articles] = await db.query(`SELECT *, article_id as id FROM articles WHERE article_id = ?`, [id]);

    if (articles.length === 0) {
      return res.status(404).json({ message: 'Article not found' });
    }

    res.json(articles[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

module.exports = {
  getAllArticles,
  getArticleBySlug,
  getArticleById,
  createArticle,
  updateArticle,
  deleteArticle
};
