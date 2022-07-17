document.querySelectorAll('.category_btn').forEach(e=>{
    e.addEventListener('click',(btn)=>{
        document.querySelectorAll('.miniform').forEach(e=>{
            if(e.id===btn.target.id+'_'){
                e.classList.add('active');
            }else{
                e.classList.remove('active');
            }
        });
    });
});

document.querySelectorAll('.summit-btn').forEach(e=>{
    e.addEventListener('click',(btn)=>{
        const targetID = btn.target.id
        const form = document.querySelector(`#${targetID}-form_`);
        const update = {}

        // add data to obj
        form.querySelectorAll('input').forEach(input=>{
            if(input.id){
                update[input.id] = input.value;
            }
        });

        axios.post(`/setting/profile/update/${id}`,{
            data: update
        }).then(res => {
            Alert(res.data);

            // fake realtime update
            if (res.data.data) {
                const newUpdate = res.data.data;
                Object.keys(newUpdate).forEach(item => {
                    if (document.querySelector(`#${item}`)) {
                        document.querySelector(`#${item}`).placeholder = newUpdate[item];
                        document.querySelector(`#${item}`).value = '';
                    };
                });
            }

        });
        // debugger point..
    });
});

// btn
const form = document.querySelector('.right-container');

document.querySelector('#back_btn').addEventListener('click',()=>{
    window.location.href = '/';
});

// logout btn
document.querySelector('#logout-btn').addEventListener('click',()=>{
    window.location.href = '/logout';
});
