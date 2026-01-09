const db = require('./config/database');

const FIX_IMAGES = [
    {
        slug: 'review-sony-a7v-2025',
        img: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80'
    },
    {
        slug: 'ide-bisnis-natal',
        img: 'https://images.unsplash.com/photo-1512389142860-9c449e58a543?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80'
    },
    {
        slug: 'parfum-lokal-pria',
        img: 'https://images.unsplash.com/photo-1523293188086-b469b9d39884?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80'
    }
];

async function fixImages() {
    try {
        for (const item of FIX_IMAGES) {
            await db.query("UPDATE articles SET image_url = ? WHERE slug = ?", [item.img, item.slug]);
            console.log(`Updated image for ${item.slug}`);
        }
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

fixImages();
