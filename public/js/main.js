import create_blog from './modules/blog.js'

fetch('/blogs').then(res => res.json()).then(data => {
    // search
    const blog_data = data;
    const search_bar = document.querySelector('.search-bar');

    search_bar.addEventListener('input', e => {
        const search_input = e.target.value;
        const supposedly = [];
        const blogVisible = document.querySelectorAll('.blog-container');

        blog_data.forEach(obj=>{
            if(obj.title.toLowerCase().includes(search_input.toLowerCase())){
                if(search_input!==''){
                    supposedly.push(obj.id);
                    blogVisible.forEach(blog_=>{
                        if(!supposedly.includes(blog_.id)){
                            blog_.classList.add('hide');
                        }else{
                            blog_.classList.remove('hide');
                        }
                    });
                }else{
                    blogVisible.forEach(blog_=>{
                        if(blog_.classList.contains('hide'))
                            blog_.classList.remove('hide');
                    });
                }
            }
        });

    });

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

