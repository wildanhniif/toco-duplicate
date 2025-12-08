-- Check categories di database
SELECT COUNT(*) as total_categories FROM categories;

-- Show sample categories
SELECT 
    category_id,
    name,
    slug,
    parent_id
FROM categories 
ORDER BY name ASC
LIMIT 20;

-- Check parent categories (top level)
SELECT 
    category_id,
    name,
    slug
FROM categories 
WHERE parent_id IS NULL
ORDER BY name ASC
LIMIT 10;

-- Check classified categories (Motor, Mobil, Property)
SELECT 
    category_id,
    name,
    slug,
    parent_id
FROM categories 
WHERE slug LIKE '%motor%' 
   OR slug LIKE '%mobil%' 
   OR slug LIKE '%properti%'
   OR slug LIKE '%rumah%'
   OR slug LIKE '%kost%'
ORDER BY name ASC;
