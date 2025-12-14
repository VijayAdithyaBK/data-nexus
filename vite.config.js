import { defineConfig } from 'vite';

export default defineConfig({
    base: './', // Use relative paths for flexible deployment
    build: {
        outDir: 'dist',
        assetsDir: 'assets',
        sourcemap: false,
        rollupOptions: {
            input: {
                main: 'index.html',
                blog: 'blog.html',
                blogPost: 'blog-post.html',
                admin: 'admin.html',
                adminDashboard: 'admin-dashboard.html',
                adminEditor: 'admin-editor.html',
            }
        }
    },
    server: {
        port: 5173,
        open: true
    }
});
