interface MarkdownFile {
    frontmatter: {
        draft?: boolean;
        date: string;
    };
}

export async function get() {
    const baseUrl = 'https://www.minmax1996.me';

    // Get all markdown files from the posts directory
    const posts = await import.meta.glob<MarkdownFile>('./blog/posts/*.md');
    console.log('Found posts:', Object.keys(posts));
    
    const publishedPosts = await Promise.all(
        Object.entries(posts).map(async ([path, getPost]) => {
            const post = await getPost();
            if (post.frontmatter.draft) return null;
            
            const slug = path.split('/').pop()?.replace('.md', '');
            console.log('Processing post:', slug, 'date:', post.frontmatter.date);
            return {
                slug,
                date: post.frontmatter.date
            };
        })
    ).then(posts => posts.filter(Boolean));

    console.log('Published posts:', publishedPosts);

    const pages = [
        { url: '', changefreq: 'daily', priority: 1.0 },
        { url: 'blog', changefreq: 'daily', priority: 0.8 },
    ];

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    ${pages.map(({ url, changefreq, priority }) => `
    <url>
        <loc>${baseUrl}/${url}</loc>
        <changefreq>${changefreq}</changefreq>
        <priority>${priority}</priority>
    </url>
    `).join('')}
    ${publishedPosts.map(post => `
    <url>
        <loc>${baseUrl}/blog/posts/${post.slug}</loc>
        <lastmod>${new Date(post.date).toISOString()}</lastmod>
        <changefreq>monthly</changefreq>
        <priority>0.7</priority>
    </url>
    `).join('')}
</urlset>`;

    return {
        body: sitemap,
        headers: {
            'Content-Type': 'application/xml'
        }
    };
} 