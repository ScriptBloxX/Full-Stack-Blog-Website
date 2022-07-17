// configs
const pl = {
    input: 'Text',
    img: 'Image url address',
    readonly_: {
        Empty : true,
        Text : false,
        Image: false,
        Iframe: false
    },
    embed: {
        Empty : false,
        Text : false,
        Image: true,
        Iframe: false
    },
    embed_src_:{
        Iframe: true  
    }
}
 
// tools btn
document.querySelectorAll('.btn').forEach(e=>{
    e.addEventListener('click',(btn)=>{
        const id = btn.target.id;
        const tc = btn.target.textContent;
        add_element(id.substr(4),pl.readonly_[tc],pl.embed[tc],pl.embed_src_[tc]);
    });
});

// add a new element to form
function add_element(id,readonly,embed,embed_doc){
    const form = document.querySelector('.form-container');
    
    const element = document.createElement(id);
    element.required = true;
    element.id = 'new_line';
    element.placeholder = pl[id]
    if(embed){
        element.placeholder = 'URL Address';
        element.classList.add('image_input');
    }
    if(embed_doc){
        element.placeholder = 'Embed (Only URL Address)';
        element.classList.add('iframe_input'); 
    }

    form.appendChild(element);
}

// post api
document.querySelector('.summit-btn').addEventListener('click',()=>{
    // empty check
    const Transfer = {
        type: 'warn',
        title: 'Warning',
        content: 'Title , Main Content , Banner URL Cannot be Empty.'
    };
    if(isEmpty(selector('#title'))) return Alert(Transfer);
    if(isEmpty(selector('#main_content'))) return Alert(Transfer);
    if(isEmpty(selector('#banner'))) return Alert(Transfer);

    // loop get all text content
    const content = [];
    document.querySelectorAll('#new_line').forEach(e=>{
        if(e.classList.contains('image_input')){
            content.push({'img': e.value});
            return;
        }else if(e.classList.contains('iframe_input')){
            content.push({'iframe': e.value});
            return;
        }
        content.push(e.value);
    })

    // data form
    const form = {
        title: selector('#title'),
        main_content: selector('#main_content'),
        banner: selector('#banner'),
        content: content,
        edit: false
    }
    if(document.querySelector('.edit-b')){
        form.edit = true;
        form.doc_id = window.location.href.substring(window.location.href.indexOf('blog/')+'blog/'.length,window.location.href.indexOf('/edit'));
    }
    // axios post api
    axios.post(`/blog/create`,{
        form: form
    }).then(res=>{
        if(res.data.type==='success'){
            // remove text
            document.querySelectorAll('input').forEach(e => {
                e.value = '';
            })
            document.querySelector('#main_content').value = '';
            
            const url_ = `/blog/${res.data.content}`;
            window.location.href = url_;
        }

        Alert(res.data);
    }).catch(err=>{
        console.log(err);
    });
});

// other func
function selector(val){
    return document.querySelector(val).value;
}
function isEmpty(str) {
    return !str.trim().length;
}
