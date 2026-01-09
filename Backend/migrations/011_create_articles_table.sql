CREATE TABLE IF NOT EXISTS articles (
    article_id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    content TEXT NOT NULL,
    summary TEXT,
    image_url VARCHAR(255),
    category VARCHAR(100),
    author_name VARCHAR(100) DEFAULT 'Tokoo Editor',
    is_published BOOLEAN DEFAULT TRUE,
    view_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Seed some data
INSERT INTO articles (title, slug, content, summary, image_url, category, author_name) VALUES
('Review dan Harga Sony A7V 2025, Kamera Mirrorless Serba Bisa', 'review-sony-a7v-2025', 'Lorem ipsum content...', 'Kamera mirrorless terbaru dari Sony dengan fitur AI canggih.', 'https://res.cloudinary.com/delcznts7/image/upload/v1767267123/toco-seller/products/default-camera.jpg', 'Edukasi', 'Tech Reviewer'),
('7 Ide Bisnis Mudah dan Menguntungkan Saat Natal', 'ide-bisnis-natal', 'Konten bisnis natal...', 'Natal sebentar lagi, cek ide bisnis ini.', 'https://res.cloudinary.com/delcznts7/image/upload/v1767267123/toco-seller/products/default-gift.jpg', 'Edukasi', 'Business Insider'),
('Rekomendasi Parfum Lokal Pria Terbaik', 'parfum-lokal-pria', 'Konten parfum...', 'Wangi seharian dengan budget terjangkau.', 'https://res.cloudinary.com/delcznts7/image/upload/v1767267123/toco-seller/products/default-perfume.jpg', 'Edukasi', 'Style Guru');
