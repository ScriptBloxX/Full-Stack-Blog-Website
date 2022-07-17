//hard code bc i'm very headache with passing variables through ejs to es6 module

function list_(id){
    fetch('/blogs').then(res => res.json()).then(data => {
        // create elements
        data.forEach(blog => {
            if(blog.writer===id){
                create_blog(blog);
            }
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
}

function create_blog(blog) {
    const container = document.querySelector('.previews-blog');
    // create element
    const blog_container = document.createElement('div');
    blog_container.id = blog.id;
    blog_container.classList.add('blog-container');

    // redirect
    const redirect = document.createElement('div');
    redirect.classList.add('redirect');
    redirect.id = blog.id;
    blog_container.appendChild(redirect);

    // user container
    const user = document.createElement('div');
    user.classList.add('user');
    blog_container.appendChild(user);
    // childe
    const title = document.createElement('h2');
    title.innerHTML = blog.title;
    user.appendChild(title);

    const writer = document.createElement('h3');
    writer.innerHTML = blog.writer;
    user.appendChild(writer);

    const content = document.createElement('h3');
    content.classList.add('content');
    content.innerHTML = blog.main_content;
    user.appendChild(content);

    // nav container
    const bottom_nav = document.createElement('div');
    bottom_nav.classList.add('bottom-nav');
    blog_container.appendChild(bottom_nav);
    // childe
    const eyes_emoji = document.createElement('i');
    eyes_emoji.classList.add('ri-eye-line');
    bottom_nav.appendChild(eyes_emoji);
    const views_ = document.createElement('h3');
    views_.id = 'views';
    views_.innerHTML = blog.views;
    bottom_nav.appendChild(views_);

    const heart_emoji = document.createElement('i');
    heart_emoji.classList.add('ri-heart-2-line');
    bottom_nav.appendChild(heart_emoji);
    const heart_ = document.createElement('h3');
    heart_.id = 'hearts';
    heart_.innerHTML = blog.heart;
    bottom_nav.appendChild(heart_);

    const comment_emoji = document.createElement('i');
    comment_emoji.classList.add('ri-message-3-line');
    bottom_nav.appendChild(comment_emoji);
    const comment_ = document.createElement('h3');
    comment_.id = 'comments';
    comment_.innerHTML = blog.comments.length;
    bottom_nav.appendChild(comment_);

    // banner
    const banner = document.createElement('img');
    banner.classList.add('banner');
    banner.src = blog.banner;
    blog_container.appendChild(banner);

    // add child to container
    container.appendChild(blog_container);
}

// btn
const form = document.querySelector('.right-container');

document.querySelector('#back_btn').addEventListener('click',()=>{
    window.location.href = '/';
});
