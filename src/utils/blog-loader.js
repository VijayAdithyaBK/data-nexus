// Blog loader utility
// Uses manual regex frontmatter parsing to avoid extra dependencies.

const blogs = import.meta.glob('/src/content/blogs/*.md', { query: '?raw', import: 'default', eager: true });

function parseFrontmatter(content) {
    const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
    if (!match) {
        return { metadata: {}, content: content };
    }

    const frontmatterRaw = match[1];
    const body = match[2];
    const metadata = {};

    frontmatterRaw.split('\n').forEach(line => {
        const parts = line.split(':');
        if (parts.length >= 2) {
            const key = parts[0].trim();
            let value = parts.slice(1).join(':').trim();

            // Handle boolean and numbers
            if (value === 'true') value = true;
            else if (value === 'false') value = false;
            else if (!isNaN(Number(value))) value = Number(value);

            metadata[key] = value;
        }
    });

    return { metadata, content: body };
}

export function getAllBlogs() {
    return Object.entries(blogs).map(([path, content]) => {
        const { metadata, content: body } = parseFrontmatter(content);
        return {
            ...metadata,
            content: body, // Raw markdown content
            path
        };
    }).sort((a, b) => new Date(b.date) - new Date(a.date));
}

export function getBlogBySlug(slug) {
    const blog = getAllBlogs().find(b => b.slug === slug);
    return blog || null;
}

export async function getFeaturedBlogs() {
    try {
        // Fetch the JSON file - in Vite/prod this might need different handling if it was a real fetch,
        // but since we are bundling, we can import it directly too.
        // Let's use glob for consistency or direct import.
        const featuredModules = import.meta.glob('/src/content/featured.json', { eager: true });
        const featuredData = Object.values(featuredModules)[0].default; // Assuming only one

        const allBlogs = getAllBlogs();
        return allBlogs.filter(blog => featuredData.featuredSlugs.includes(blog.slug));
    } catch (e) {
        console.error("Error loading featured blogs:", e);
        return [];
    }
}
