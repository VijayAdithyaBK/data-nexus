/**
 * Blog Data Management
 * Handles CRUD operations and blog data storage
 */

// ============================================================
// BLOG DATA STORAGE
// ============================================================

const BLOG_STORAGE_KEY = 'portfolio_blogs';
const IMAGE_STORAGE_KEY = 'portfolio_images';

// Sample initial data (will be replaced by actual data)
const DEFAULT_BLOGS = [
    {
        id: 'optimizing-snowflake-queries',
        title: 'Optimizing Snowflake Queries at Scale',
        slug: 'optimizing-snowflake-queries',
        category: 'Performance',
        excerpt: 'Learn how I reduced warehouse costs by 40% using clustering keys, materialized views, and query profiling.',
        content: `<h2>The Challenge</h2><p>When working with enterprise-scale Snowflake deployments, query performance and cost optimization become critical...</p>`,
        coverImage: '',
        status: 'published',
        featured: true,
        createdAt: '2024-12-01T00:00:00Z',
        updatedAt: '2024-12-01T00:00:00Z',
        readTime: 8
    },
    {
        id: 'fault-tolerant-pipelines',
        title: 'Building Fault-Tolerant Data Pipelines',
        slug: 'fault-tolerant-pipelines',
        category: 'Architecture',
        excerpt: 'A comprehensive guide to implementing retry logic, dead letter queues, and alerting for resilient ETL systems.',
        content: `<h2>Introduction</h2><p>Building fault-tolerant data pipelines is essential for production systems...</p>`,
        coverImage: '',
        status: 'published',
        featured: true,
        createdAt: '2024-11-15T00:00:00Z',
        updatedAt: '2024-11-15T00:00:00Z',
        readTime: 12
    },
    {
        id: 'sql-server-to-snowflake',
        title: 'SQL Server to Snowflake: A Deep Dive',
        slug: 'sql-server-to-snowflake',
        category: 'Migration',
        excerpt: 'Step-by-step guide to migrating legacy data warehouses to Snowflake.',
        content: `<h2>Overview</h2><p>Migrating from SQL Server to Snowflake requires careful planning...</p>`,
        coverImage: '',
        status: 'published',
        featured: true,
        createdAt: '2024-10-20T00:00:00Z',
        updatedAt: '2024-10-20T00:00:00Z',
        readTime: 15
    }
];

// ============================================================
// BLOG OPERATIONS
// ============================================================

function getBlogs() {
    const stored = localStorage.getItem(BLOG_STORAGE_KEY);
    if (stored) {
        try {
            return JSON.parse(stored);
        } catch (e) {
            console.error('Error parsing blogs:', e);
        }
    }
    // Initialize with default data
    saveBlogs(DEFAULT_BLOGS);
    return DEFAULT_BLOGS;
}

function saveBlogs(blogs) {
    localStorage.setItem(BLOG_STORAGE_KEY, JSON.stringify(blogs));
}

function getBlogById(id) {
    const blogs = getBlogs();
    return blogs.find(blog => blog.id === id) || null;
}

function createBlog(blogData) {
    const blogs = getBlogs();
    const id = generateSlug(blogData.title);

    const newBlog = {
        id,
        slug: id,
        title: blogData.title || 'Untitled',
        category: blogData.category || 'General',
        excerpt: blogData.excerpt || '',
        content: blogData.content || '',
        coverImage: blogData.coverImage || '',
        status: blogData.status || 'draft',
        featured: blogData.featured || false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        readTime: calculateReadTime(blogData.content || '')
    };

    blogs.unshift(newBlog);
    saveBlogs(blogs);
    return newBlog;
}

function updateBlog(id, updates) {
    const blogs = getBlogs();
    const index = blogs.findIndex(blog => blog.id === id);

    if (index === -1) return null;

    // Update slug if title changed
    if (updates.title && updates.title !== blogs[index].title) {
        updates.slug = generateSlug(updates.title);
    }

    // Calculate read time if content changed
    if (updates.content) {
        updates.readTime = calculateReadTime(updates.content);
    }

    blogs[index] = {
        ...blogs[index],
        ...updates,
        updatedAt: new Date().toISOString()
    };

    saveBlogs(blogs);
    return blogs[index];
}

function deleteBlog(id) {
    const blogs = getBlogs();
    const filtered = blogs.filter(blog => blog.id !== id);

    if (filtered.length === blogs.length) return false;

    saveBlogs(filtered);
    return true;
}

function archiveBlog(id) {
    // Remove featured status when archiving
    return updateBlog(id, { status: 'archived', featured: false });
}

function unarchiveBlog(id) {
    // Unarchive to draft status
    return updateBlog(id, { status: 'draft' });
}

function publishBlog(id) {
    return updateBlog(id, { status: 'published' });
}

function unpublishBlog(id) {
    return updateBlog(id, { status: 'draft' });
}

// ============================================================
// FEATURED BLOG OPERATIONS
// ============================================================

const MAX_FEATURED = 3;

function getFeaturedBlogs() {
    const blogs = getBlogs();
    return blogs
        .filter(blog => blog.featured && blog.status === 'published')
        .slice(0, MAX_FEATURED);
}

function getFeaturedCount() {
    const blogs = getBlogs();
    return blogs.filter(blog => blog.featured).length;
}

function toggleFeatured(id) {
    const blogs = getBlogs();
    const blog = blogs.find(b => b.id === id);

    if (!blog) return { success: false, message: 'Blog not found' };

    // If trying to feature and already at limit
    if (!blog.featured && getFeaturedCount() >= MAX_FEATURED) {
        return {
            success: false,
            message: `Maximum ${MAX_FEATURED} featured posts allowed. Unfeature another post first.`
        };
    }

    blog.featured = !blog.featured;
    blog.updatedAt = new Date().toISOString();
    saveBlogs(blogs);

    return {
        success: true,
        featured: blog.featured,
        message: blog.featured ? 'Post featured!' : 'Post unfeatured'
    };
}

// ============================================================
// IMAGE OPERATIONS
// ============================================================

function getImages() {
    const stored = localStorage.getItem(IMAGE_STORAGE_KEY);
    if (stored) {
        try {
            return JSON.parse(stored);
        } catch (e) {
            console.error('Error parsing images:', e);
        }
    }
    return [];
}

function saveImages(images) {
    localStorage.setItem(IMAGE_STORAGE_KEY, JSON.stringify(images));
}

function addImage(imageData) {
    const images = getImages();
    const newImage = {
        id: Date.now().toString(),
        name: imageData.name,
        url: imageData.url, // Base64 or path
        type: imageData.type,
        createdAt: new Date().toISOString()
    };

    images.unshift(newImage);
    saveImages(images);
    return newImage;
}

function deleteImage(id) {
    const images = getImages();
    const filtered = images.filter(img => img.id !== id);
    saveImages(filtered);
    return true;
}

// ============================================================
// UTILITY FUNCTIONS
// ============================================================

function generateSlug(title) {
    return title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')
        .substring(0, 50);
}

function calculateReadTime(content) {
    // Strip HTML tags and count words
    const text = content.replace(/<[^>]*>/g, '');
    const words = text.split(/\s+/).filter(word => word.length > 0).length;
    const minutes = Math.ceil(words / 200); // 200 words per minute
    return Math.max(1, minutes);
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

// ============================================================
// EXPORT/IMPORT FOR GIT SYNC
// ============================================================

function exportBlogsToJSON() {
    const blogs = getBlogs();
    const dataStr = JSON.stringify(blogs, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = 'blogs.json';
    a.click();

    URL.revokeObjectURL(url);
}

function importBlogsFromJSON(jsonString) {
    try {
        const blogs = JSON.parse(jsonString);
        if (Array.isArray(blogs)) {
            saveBlogs(blogs);
            return true;
        }
    } catch (e) {
        console.error('Error importing blogs:', e);
    }
    return false;
}

// ============================================================
// EXPORTS
// ============================================================

export {
    getBlogs,
    getBlogById,
    createBlog,
    updateBlog,
    deleteBlog,
    archiveBlog,
    unarchiveBlog,
    publishBlog,
    unpublishBlog,
    getFeaturedBlogs,
    getFeaturedCount,
    toggleFeatured,
    getImages,
    addImage,
    deleteImage,
    formatDate,
    generateSlug,
    calculateReadTime,
    exportBlogsToJSON,
    importBlogsFromJSON
};
