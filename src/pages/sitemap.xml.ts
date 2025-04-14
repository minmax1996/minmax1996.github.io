import { getCollection } from 'astro:content';
import { SITE_URL } from '../consts';

export async function get() {
    const posts = await getCollection('blog');
    const pages = [
        { url: '', changefreq: 'daily', priority: 1.0 },
        { url: 'blog', changefreq: 'daily', priority: 0.8 },
    ];

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    ${pages.map(({ url, changefreq, priority }) => `
    <url>
        <loc>${SITE_URL}${url}</loc>
        <changefreq>${changefreq}</changefreq>
        <priority>${priority}</priority>
    </url>
    `).join('')}
    ${posts.map(post => `
    <url>
        <loc>${SITE_URL}/blog/${post.id}</loc>
        <lastmod>${post.data.date.toISOString()}</lastmod>
        <changefreq>monthly</changefreq>
        <priority>0.7</priority>
    </url>
    `).join('')}
</urlset>`;

    return {
        body: sitemap,
    };
} 