const { firestore, app } = require('firebase-admin');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
require('dotenv').config();

const db = require('./database.js');
const storage_ = require('./storage.js');
const server_email = process.env;

async function blogs(type) {
    const blogs_snapshot = db.collection('blogs');
    if (type === 'all') {
        const result = [];
        (await blogs_snapshot.get()).forEach(doc=>{
            var data = doc.data();
            data.id = doc.id;
            result.push(data);
        });
        return result;
    }else{
        const blog = await blogs_snapshot.doc(type).get();
        const doc = blogs_snapshot.doc(type);

        if(blog.data()){
            // update (view)
            doc.update({'views':blog.data().views + 1});
            return blog.data();
        }
        return undefined;
    }
}

async function update_comment(blog_id,data) {
    const blogs_snapshot = db.collection('blogs');
    const doc = blogs_snapshot.doc(blog_id);

    // pushing array to database
    const FieldValue = firestore.FieldValue
    return await doc.update({
        'comments': FieldValue.arrayUnion(data)
    }).then(()=>{
        return 'success';
    })
}

async function userProfiel(id,insights){
    const user = await db.collection('users').doc(id).get();
    const data = user.data();
    if(data){
        if(insights){
            const filter = {
                id: data.id,
                username: data.username,
                profile: data.profile,
                bio: data.bio,
                email: data.email,
                verify: data.verify,
                favorites: data.favorites
            }
            return filter;
        }else{
            const filter = {
                id: data.id,
                username: data.username,
                profile: data.profile,
                bio: data.bio
            }
            return filter;
        } 
    }
    const error = {
        id: 'Error_ID (404 Not Found)',
        username: 'Error_Username (404 Not Found)',
        profile: 'https://cdn.dribbble.com/users/5651948/screenshots/12721320/media/f37e46a901f7db41539aec21d7d9bbd9.gif'
    }
    return error;
}

async function Authentication(token){
    const user = await db.collection('users').doc(token.id).get();
    const data = user.data();
    if(data){
        if(data.password===token.key){
            return 'success'
        }
        return 'Invalid authentication'
    }
    return 'Account not found';
}

async function create_blog(data){
    if(data.form.edit){
        return await db.collection('blogs').doc(data.form.doc_id).update({
            title: data.form.title,
            banner: data.form.banner,
            main_content: data.form.main_content,
            content: data.form.content
        }).then(()=>{
            return `${data.form.doc_id}`;
        }).catch(err=>{
            console.log(err);
            return 'Err';
        });
    }
    return await db.collection('blogs').add({
        title: data.form.title,
        banner: data.form.banner,
        main_content: data.form.main_content,
        content: data.form.content,
        heart: 0,
        views: 0,
        comments: [],
        writer: data.id
    }).then(res=>{
        return `${res.id}`;
    }).catch(err=>{
        console.log(err);
        return 'Err';
    });
}

async function delete_blog(id){
    return await db.collection('blogs').doc(id).delete().then(()=>{
        return 'success';
    });
};

async function uploadFile(path, filename , id){
    const storageRef = storage_.bucket(`gs://web-blog-3dc47.appspot.com`);
    
    return await storageRef.upload(path, {
        public: true,
        destination: `profile/${filename}`,
        metadata: {
            firebaseStorageDownloadTokens: uuidv4(),
        }
    }).then(res=>{
        const user = db.collection('users').doc(id);
        user.update({
            profile: res[0].metadata.mediaLink
        })
        return res[0].metadata.mediaLink;
    }).catch(err=>{
        console.log(err);
        return 'Err';
    });
}

async function Email_NotAlreadyUse(email){
    var can_use = true;
    return db.collection('users').get().then(user => {
        user.docs.forEach(doc => {
           if (email === doc.data().email) {
                can_use = false;
           }
       });
       return can_use;
   });
}

async function user_update(id,pass1,pass2,email,username,bio){
    if(bio){
        await db.collection('users').doc(id).update({
            bio: bio
        });
        return 'success';
    }
    // need fix
    if(pass1.trim().length>0){
        if(pass1.trim().length>=8){
            if(pass1===pass2){
                const user = await db.collection('users').doc(id).get();
                const data = user.data();
                if(data){
                    bcrypt.hash(pass1,12).then(hash_result=>{
                        db.collection('users').doc(id).update({
                            password: hash_result
                        });
                    });
                    if(email.includes('@')){
                        const check_result = await Email_NotAlreadyUse(email);

                        if (check_result === true) {
                            await db.collection('users').doc(id).update({
                                email: email,
                                verify: false
                            });
                            return 'success3';
                        } else {
                            return 'Your password has been changed!</br>This email already in use!';
                        }
                    }
                    return 'success1';
                }
                return 'Something Wrong!';
            }
            return 'Password do not match, pls check and try again!';
        }
        return 'The password must be of minimum length 8 characters!';
    } else if (email) {
        if (email.includes('@')) {
            const check_result = await Email_NotAlreadyUse(email);

            if (check_result === true) {
                await db.collection('users').doc(id).update({
                    email: email,
                    verify: false
                });
                return 'success2';
            } else {
                return 'This email already in use!';
            }

        }
        return 'Invalid Email Addrest!';
    } else {
        return 'Fields cannot be Empty!';
    }
};

async function email_verify(key,type,param3){
    const user = await db.collection('users').doc(key.id).get();
    const data = user.data()

    if(data){
        if (type === 'create_token') {
            const token = await db.collection('email-verify').add({
                user_id: key.id
            });
            mail_send(param3,{
                subject: 'Email Verification | StudentBlog',
                html: `<html>
                <head>
                    <style>
                        *{
                            -webkit-user-drag: none;
                            margin: 0;
                            padding: 0;
                            user-select: none;
                            font-family: 'Roboto', sans-serif;
                            text-align: center;
                        }
                        .verify-box{
                            position: relative;padding: 1rem;background-color: #202230;width: 100%;height: 200px;margin: 0 auto 0;
                        }
                        .verify-box h2{
                            color: #fff;
                            width: 100%;
                            text-align: center;
                        }
                        .verify-box a{
                            position: relative;
                            text-decoration: none;color: #5866d4;background-color: #10121b;padding: .5rem;font-size: 1.5rem;border-radius: 5px;
                        }
                        .bottom h3{
                            color:#d4d4d4;
                        }
                        .bottom img{
                            height: 40px;width: 40px;
                            margin-top: 1rem;
                        }
                    </style>
                </head>
                <body>
                    <div class="verify-box">
                        <h2>Please verify your email. And do not share this link with anyone.</h2> <br>
                        <a href="http://localhost:3000/${key.id}/email_verification/${token.id}">VERIFY</a> <br> <br>
                        <div class="bottom">
                            <h3>Thank you for using the service | StudentBlog</h3>
                            <img src="https://cdn.discordapp.com/attachments/894762208121192529/990977543261790278/icon.png">
                        </div>
                    </div>
                </body>
                </html>`
            });

            setTimeout(async ()=>{
                await db.collection('email-verify').doc(token.id).delete();
            },2*60*1000);

        }else if(type==='verify_token'){
            const token = await db.collection('email-verify').doc(param3).get();
            console.log(token.data(),param3);
            if(token.data()){
                await db.collection('users').doc(token.data().user_id).update({
                    verify: true
                });

                await db.collection('email-verify').doc(param3).delete();
                return 'success';
            }
            return 'Token Expired';
        }
    }
    return 'Account not found';
}

async function mail_send(param3,option) {
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: server_email.user,
            pass: server_email.password
        }
    });

    let mailOptions = {
        from: server_email.user,
        to: param3.email,
        subject: option.subject,
        html: option.html
    };

    return transporter.sendMail(mailOptions, (err, info)=>{
        if (err)
            console.log(err);
    })
};

// forgot password
async function forgotPassword(id){
    var found = false;
    const userAccount = await db.collection('users').doc(id).get();
    if(userAccount.data()){
        const email = userAccount.data().email;

        return db.collection('users').get().then(user => {
            user.docs.forEach(async doc => {
                if (email === doc.data().email) {
                    found = true;

                    // generate token
                    const token = await db.collection('reset-password-token').add({
                        id: id
                    });
                    // destroy token
                    setTimeout(async ()=>{
                        await db.collection('reset-password-token').doc(token.id).delete();
                    },2*60*1000);

                    mail_send({email:email},{
                        'subject': 'Reset Password | StudentBlog',
                        'html': `<html>
                        <head>
                            <style>
                                *{
                                    -webkit-user-drag: none;
                                    margin: 0;
                                    padding: 0;
                                    user-select: none;
                                    font-family: 'Roboto', sans-serif;
                                    text-align: center;
                                }
                                .verify-box{
                                    position: relative;padding: 1rem;background-color: #202230;width: 100%;height: 200px;margin: 0 auto 0;
                                }
                                .verify-box h2{
                                    color: #fff;
                                    width: 100%;
                                    text-align: center;
                                }
                                .verify-box a{
                                    position: relative;
                                    text-decoration: none;color: #5866d4;background-color: #10121b;padding: .5rem;font-size: 1.5rem;border-radius: 5px;
                                }
                                .bottom h3{
                                    color:#d4d4d4;
                                }
                                .bottom img{
                                    height: 40px;width: 40px;
                                    margin-top: 1rem;
                                }
                            </style>
                        </head>
                        <body>
                            <div class="verify-box">
                                <h2>You can reset your password using this token. Please do not share this link to anyone.</h2> <br>
                                <a href="http://localhost:3000/${id}/reset-password/${token.id}">Reset Password</a> <br> <br>
                                <div class="bottom">
                                    <h3>Thank you for using the service | StudentBlog</h3>
                                    <img src="https://cdn.discordapp.com/attachments/894762208121192529/990977543261790278/icon.png">
                                </div>
                            </div>
                        </body>
                        </html>`
                    });
                }
            });
            if(found===true){
                return {
                    title: 'Success',
                    content: `We have sent a password reset request to the email `,
                    email : email,
                    last_content: 'please check it within 2 minutes.'
                };
            }
        });

    }else{
        return {
            title: 'Account is not found!',
            content: 'Please check your Account ID is correct or not. then try again',
            email : 'Not Found!'
        };
    }
};

// reset password
async function resetPassword(auth){
    const get_token = await db.collection('reset-password-token').doc(auth.token).get();
    const tokenID = get_token.data();

    if(tokenID){
        if(tokenID.id === auth.id){
            bcrypt.hash(auth.password,12).then(async hash_result=>{
                db.collection('users').doc(tokenID.id).update({
                    password: hash_result
                });
                await db.collection('reset-password-token').doc(auth.token).delete();
            });
            return {
                title: 'Successfully!',
                content: 'Your password has been changed. You can now login at ',
            };
        }
    }
    return 'Token Expired';
};

// favorite blog
async function favorite_blog(user_,blog_id){
    const user = db.collection('users').doc(user_.id);
    const blog = db.collection('blogs').doc(blog_id);

    if((await blog.get()).data() && (await user.get()).data()){
        const user_data = (await user.get()).data();
        const blog_data = (await blog.get()).data();
        const FieldValue = firestore.FieldValue

        // if haven't favorite this blog
        if(!user_data.favorites.includes(blog_id)){
            await blog.update({'heart': blog_data.heart + 1});
            return await user.update({
                'favorites': FieldValue.arrayUnion(blog_id)
            }).then(()=>{
                return 'Favorite';
            });
        }else{ // if already favorite this blog
            await blog.update({'heart': blog_data.heart - 1});
            return await user.update({
                'favorites': FieldValue.arrayRemove(blog_id)
            }).then(()=>{
                return 'Unfavorite';
            });
        }

    }else{
        return '[404] Blog or User is not found!';
    }

}


module.exports = {
    blogs,
    update_comment, 
    userProfiel,
    Authentication, 
    create_blog,
    delete_blog,
    uploadFile,
    user_update,
    email_verify,
    forgotPassword,
    resetPassword,
    favorite_blog
};
console.log('APIs ✅');
