import create_blog from './modules/blog.js'

fetch('/blogs').then(res => res.json()).then(data => {
    // create elements
    data.forEach(blog => {
        create_blog(blog);
    });
    // redirect
    document.querySelectorAll('.blog-container').forEach(e => {
        e.addEventListener('click', (b) => {
            if (b.target.id !== '' && b.target.id !== 'comments' && b.target.id !== 'hearts' && b.target.id !== 'views') {
                window.location.href = `/blog/${b.target.id}`;
            }
        });
    });
});

