// user profile
async function cp(user_id, bio) {
    fetch(`/user/data/${user_id}`).then(res => res.json())
        .then(data => {
            if (bio===true) {
                document.querySelector(`#bio-${user_id}`).innerHTML = data.bio;
            }else{
                const pf_image = document.querySelectorAll(`#profile-${user_id}`);
                pf_image.forEach(element => {
                    element.src = data.profile;
                    element.addEventListener('click',()=>{
                        window.location.href = `/profile/${user_id}`;
                    });
                });
            }
        });
}

// comment api
document.querySelector('.comment-submit-btn').addEventListener('click',()=>{
    const current_url = window.location.href;
    const blog_id = current_url.substring(current_url.indexOf('blog/')+'blog/'.length);
    const message = document.querySelector('#comment_input');

    // empty check
    const Transfer = {
        type: 'warn',
        title: 'Warning',
        content: 'Comment cannot be Empty.'
    };
    if(isEmpty(message.value)) return Alert(Transfer);

    axios.post(`/blog/${blog_id}/api/comment`,{
        message : message.value,
    }).then(res=>{
        if(res.data.type==='success'){
            closePopup();
            CreateCommentElement(res.data.user);
            message.value = '';
        }
        Alert(res.data);
    }).catch(err=>{
        console.log(err);
    })
});

// comment popup
const comment_btn = document.querySelector('#comment_btn');
comment_btn.addEventListener('click', () => {
    Popup({
        title: 'username',
        type: 'information'
    }); 
});

// close popup
document.querySelector('#close_cm_btn').addEventListener('click', async () => {
    closePopup()
});

async function Popup(data) {
    const typeColor = {
        error: '#e64d6c',
        warn: '#ff8c00',
        information: '#5866d4',
        success: '#2eac62'
    }
    await stlyeFix('.container', 'filter', 'brightness(.5) blur(2px)');
    await stlyeFix('.notification-comment', 'transition', 'all linear .2s');
    await stlyeFix('.notification-comment', 'visibility', 'visible');
    await stlyeFix('.notification-comment', 'opacity', '1');
    await stlyeFix(`.notification-comment`, 'transform', 'scale(.9)');
    await stlyeFix('#alert-icon2', 'color', typeColor[data.type]);
    document.querySelector('.alert-title').innerHTML = data.title;
    await stlyeFix('body','overflow','hidden');
    window.scrollTo(0, 0);
};
async function closePopup(){
    await stlyeFix('.container', 'filter', 'none');
    await stlyeFix(`.notification-comment`, 'transform', 'scale(.8)');
    await stlyeFix('.notification-comment', 'opacity', '0');
    await stlyeFix('.notification-comment', 'visibility', 'hidden');
    await stlyeFix('.notification-comment', 'transition', 'none');
    await stlyeFix('body','overflow','unset');
};

// fake realtime comment
function CreateCommentElement(data){
    document.querySelector('#comment').innerHTML = parseInt(document.querySelector('#comment').innerHTML) + 1;
    const container = document.querySelector('.comment-container');
    // 1
    const user_container = document.createElement('div');
    user_container.classList.add('user-container');
    // 2
    const flex_group = document.createElement('div');
    flex_group.classList.add('flex-group');
    user_container.appendChild(flex_group);

    const comment_date = document.createElement('h2');
    comment_date.innerHTML = `${data.id} ${data.date}`;
    user_container.appendChild(comment_date);

    //3
    const user_ = document.createElement('div');
    user_.classList.add('user_');
    flex_group.appendChild(user_);

    const content = document.createElement('div');
    content.classList.add('user_');
    flex_group.appendChild(content);

    //4
    const profile = document.createElement('div');
    profile.classList.add('profile');
    profile.id = data.id;
    user_.appendChild(profile);

    const img = document.createElement('img');
    img.id = `profile-${data.id}`;
    img.src = data.profile
    profile.appendChild(img);

    //5
    const h3 = document.createElement('h3');
    h3.innerHTML = data.comment;
    content.appendChild(h3);

    container.appendChild(user_container);
    cp(data.id);
}

// other func
function isEmpty(str) {
    return !str.trim().length;
}

// btn & responsive
const form = document.querySelector('.right-container');

document.querySelector('#back_btn').addEventListener('click',()=>{
    window.location.href = '/';
});

document.querySelector('#open_comment_from_btn').addEventListener('click',()=>{
    const element_style = window.getComputedStyle(form);
    if(element_style.visibility==='visible' || form.classList.contains('cm-f-visible')){
        form.classList.remove('cm-f-visible');
    }else{
        form.classList.add('cm-f-visible');
    }
});

// edit & delete 
const edit_btn = document.querySelector('.edit-btn');
const delete_btn = document.querySelector('.delete-btn');

if(edit_btn && delete_btn){
    const current_url = window.location.href;
    const blog_id = current_url.substring(current_url.indexOf('blog/')+'blog/'.length);

    const AlertData = {
        type: 'warn',
        title: 'Warning',
        content: `Are you sure you want to <a href="/blog/${blog_id}/delete" class="delete-blog-btn-warning">DELETE</a> this blog? If you are sure please click on the red text.`
    };

    edit_btn.addEventListener('click', () => {
        window.location.href = `/blog/${blog_id}/edit`;
    });

    delete_btn.addEventListener('click',()=>{
        Alert(AlertData);
    });
}

// favorites btn
const favbtn = document.querySelector('#favorite-btn');
const heart_number = document.querySelector('#heart');

favbtn.addEventListener('click',()=>{
    const current_url = window.location.href;
    const blog_id = current_url.substring(current_url.indexOf('blog/')+'blog/'.length);

    axios.post(`/blog/${blog_id}/api/favorite`).then(res => {
        if (res.data.title === 'Favorited!') {
            favbtn.className = "ri-heart-2-fill";
            heart_number.innerHTML = parseInt(heart_number.innerHTML) + 1;
        } else if (res.data.title === 'Unfavorited!') {
            favbtn.className = "ri-heart-2-line";
            heart_number.innerHTML = parseInt(heart_number.innerHTML) - 1;
        }
        Alert(res.data);
    }).catch(err => {
        console.log(err);
    })

});
