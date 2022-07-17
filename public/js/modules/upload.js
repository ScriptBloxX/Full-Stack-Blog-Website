const upload = document.querySelector('.real_file_btn');
const upload_btn = document.querySelector('#FileUpload_btn');
const id = document.querySelector('.form').id;

upload_btn.addEventListener('click',()=>{
    upload.click();
});

upload.addEventListener('change',()=>{
    if(upload.value){
        axios.post(`/setting/profile/upload/${id}`,{
            file: upload.files[0]
        },{
            headers: { "Content-Type": "multipart/form-data" },
        }).then(res=>{
            upload_btn.src = res.data.data_;
            Alert(res.data);
        });
    }
});
