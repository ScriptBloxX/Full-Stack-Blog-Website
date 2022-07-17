const express = require('express');
const path = require('path');
const cookieSession = require('cookie-session');
const bcrypt = require('bcrypt');
const {body , validationResult} = require('express-validator');
const file_upload = require('express-fileupload');
var fs = require('fs');

// custom modules
const db = require('./database.js');
const api_ = require('./api.js');

const app = express();

// setting
app.use(
  express.urlencoded({ extended: false }),
  express.static("public"),
  express.json(),
  file_upload()
);

app.set('views',path.join(__dirname,'public'));
app.set('view engine','ejs');

app.use(cookieSession({
  name: 'session',
  keys:['key1','key2','key3'],
  maxAge: 3 * 24 * 60 * 60 * 1000 // 3day
}))

// custom middleware
const ifNotLoggedIn = (req,res,next)=>{
  if(!req.session.isLoggedIn){
    return res.render('login-register');
  }
  next();
}

const ifLoggedIn = (req,res,next)=>{
  if(req.session.isLoggedIn){
    return res.redirect('/home');
  }
  next();
}

// root page
app.get('/',ifNotLoggedIn,(req,res,next)=>{
  db.collection('users').doc(req.session.userID).get().then(result=>{
    if(result){
      res.render('home',{
        id: result.data().id,
        name: result.data().username,
        email: result.data().email,
        password: result.data().password,
      })
    }else if(result===undefined){
      res.render('login-register');
    }
  })
})

// register page
app.post('/register', ifLoggedIn, [
  body('email','Invalid Email Addrest').isEmail().custom((value)=>{
   var mailCheck = false;
   return db.collection('users').get().then(user=>{
      user.docs.forEach(doc=>{
        if(value === doc.data().email){
          mailCheck = true;
        }
      })
      if(mailCheck){
        return Promise.reject('This email already in use!');
      }
      return true;
    });
  }),
  body('username','This ID already in use!').custom(value=>{
     return db.collection('users').doc(value).get().then(user=>{
      if(user.data()){
        return Promise.reject('This ID already in use!');
      }
      return true;
    })
  }),
  body('username','ID is empty!').trim().not().isEmpty(),
  body('username','ID cannot be spaced').custom((value)=>{
    if(value.includes(' ')){
      return Promise.reject('ID cannot be spaced');
    }
    return true;
  }),
  body('password','The password must be of minimum length 8 characters').trim().isLength({min:8}),
  body('cf_password','Pls confirm password').trim().not().isEmpty().custom((value,{req})=>{
    if(value!==req.body.password && req.body.password.length >= 8){
      return Promise.reject('Password do not match, pls check and try again');
    }
    return true;
  })
],// end of post data validation
  (req,res,next)=>{
    const validator_result = validationResult(req);
    const {username,password,email} = req.body;
    //console.log(req.body)
    //console.log(validator_result)
    if (validator_result.isEmpty()){
      bcrypt.hash(password,12).then(hash_pass=>{
        db.collection('users').doc(username).set({
          id: username,
          username: username,
          password: hash_pass,
          email: email,
          bio: '',
          profile: 'https://cdn.dribbble.com/users/5651948/screenshots/12721320/media/f37e46a901f7db41539aec21d7d9bbd9.gif',
          verify: false,
        }).then(()=>{
          res.render('login-register');
        }).catch(err=>{
          if(err) throw err;
        })
      }).catch(err=>{
        if(err) throw err;
      })
    }else{
      let allErrors = validator_result.errors.map((error)=>{
        return error.msg;
      })
      res.render('login-register',{
        register_error: allErrors,
        old_data: req.body
      })
    }
  }
)

// login page
app.post('/',ifLoggedIn,[
  body('username').custom(value=>{
    return db.collection('users').doc(value).get().then(user=>{
      if (user.data()){
        return true;
      }
      return Promise.reject('Invalid ID!');
    })
  }),
  body('password','Password is empty').trim().not().isEmpty(),
],(req,res)=>{
  const validation_result = validationResult(req);
  const {password , username} = req.body;
  if(validation_result.isEmpty()){
    db.collection('users').doc(username).get().then(user=>{
      if (user.data()){
        bcrypt.compare(password,user.data().password).then(compare_result=>{
          if (compare_result === true){
            req.session.isLoggedIn = true;
            req.session.userID = username;
            req.session.key = user.data().password;
            res.redirect('/');
          }else{
            res.render('login-register',{
              login_errors: ['Invalid Password!']
            })
          }
        }).catch(err=>{
          if (err) throw err;
        })
      }
    }).catch(err=>{
      if (err) throw err;
    })
  } else{
    let allErrors = validation_result.errors.map(err=>{
      return err.msg;
    })
    res.render('login-register',{
      login_errors: allErrors
    })
  }
});

// verify email
app.get('/:id/verify_email/',(req,res)=>{
  const uid = req.params.id;
  if (req.session.isLoggedIn) {
    const data = {
      id: req.session.userID,
      key: req.session.key,
    }
    // Authentication
    api_.Authentication(data).then(result=>{
      if(result==='success' && data.id===uid){
        api_.userProfiel(data.id,true).then(result=>{
          if(result.verify===false){
            api_.email_verify(data,'create_token',result);
          }
          res.render('verifyEmail',{data:result});
        });
      }else{
        res.redirect('/');
      }
    });
  }else{
    res.redirect('/');
  }
});
app.get('/:id/email_verification/:token',(req,res)=>{
  if (req.session.isLoggedIn) {
    const token = req.params.token;
    const data = {
      id: req.session.userID,
      key: req.session.key,
    }

    api_.email_verify(data,'verify_token',token).then(verify_result=>{
      if(verify_result==='success'){
        api_.userProfiel(data.id,true).then(result=>{
          res.render('verifyEmail',{data:result});
        });
      }else{
        res.status(502).render('404',{data:verify_result});
      }
    });
  }else{
    res.redirect('/');
  }
});

// forgot password
app.get('/forgot-password',(req,res)=>{
  res.render('forgot-password',{
    data: {
      title: 'Please enter your account ID',
      content: "We'll send you a link to change your password to your email address.",
      email : ''
    }
  });
});
app.post('/account/forgot-password',(req,res)=>{
  if (req.body.id) {
    api_.forgotPassword(req.body.id).then(result => {
      res.render('forgot-password', {
        data: result
      });
    })
  }
});
app.get('/:id/reset-password/:token',(req,res)=>{
  const auth = {
    id: req.params.id,
    token: req.params.token
  }
  req.session.auth_id = auth.id;
  req.session.auth_token = auth.token
  res.render('forgot-password',{
    data: {
      title: 'reset-password',
      auth : auth
    }
  })
});
app.post('/reset_password',(req,res)=>{
  const auth = {
    id: req.session.auth_id,
    token: req.session.auth_token,
    password: req.body.new_password
  }
  api_.resetPassword(auth).then(result=>{
    if(result==='Token Expired'){
      res.status(502).render('404',{data:result});
    }else{
      res.render('forgot-password', {
        data: result
      });
    }
    // session destroy
    req.session = null;
  });
});

// logout
app.get('/logout',(req,res)=>{
  // session destroy
  req.session = null;
  res.redirect('/');
});

// <-- custom api --> \\

// blog editor page
app.get('/blog-editor',(req,res)=>{
  if (req.session.isLoggedIn) {
    const data = {
      id: req.session.userID,
      key: req.session.key,
    }
    // Authentication
    api_.Authentication(data).then(result=>{
      if(result==='success'){
        res.render('blog-editor');
      }else{
        res.redirect('/');
      }
    });
  }else{
    res.redirect('/');
  }
});

// Account Setting
app.get('/setting',(req,res)=>{
  if (req.session.isLoggedIn) {
    const data = {
      id: req.session.userID,
      key: req.session.key,
    }
    // Authentication
    api_.Authentication(data).then(result=>{
      if(result==='success'){
        api_.userProfiel(data.id,true).then(result=>{
          res.render('setting',{data:result});
        });
      }else{
        res.redirect('/');
      }
    });
  }else{
    res.redirect('/');
  }
});

app.post('/setting/profile/update/:id',(req,res)=>{
  const Transfer = {
    type: 'error',
    title: 'Error',
    content: 'N/A'
  }
  const data = {
    id: req.session.userID,
    key: req.session.key,
  }
  if (req.session.isLoggedIn) {
        // Authentication
        api_.Authentication(data).then(result => {
          if (result === 'success') {
            const bodyData = req.body.data;
            // check & change password
            if(bodyData.hasOwnProperty('password')&&bodyData.hasOwnProperty('cf_password')){
              api_.user_update(data.id,bodyData.password,bodyData.cf_password,bodyData.email).then(update_result=>{
                Transfer.type = 'success';
                Transfer.title = 'Succeed!';
                if(update_result==='success1'){
                  req.session = null;
                  Transfer.content = 'Your password has been changed!';
                }else if(update_result==='success2'){
                  Transfer.content = 'Your email has been changed!';
                  Transfer.data = {email: bodyData.email};
                }else if(update_result==='success3'){
                  req.session = null;
                  Transfer.content = 'Your email & password has been changed!';
                  Transfer.data = {email: bodyData.email};
                }else{
                  Transfer.type = 'error';
                  Transfer.title = 'Error';
                  Transfer.content = update_result;
                }
                res.json(Transfer);
              });
            }else{
              api_.user_update(data.id,'','','','',bodyData.bio).then(update_result=>{
                Transfer.type = 'success';
                Transfer.title = 'Succeed!';
                if(update_result==='success'){
                  Transfer.content = 'Your bio has been changed!';
                  Transfer.data = {bio: bodyData.bio};
                }else{
                  Transfer.type = 'error';
                  Transfer.title = 'Error';
                  Transfer.content = update_result;
                }
                res.json(Transfer);
              });
            }
          } else {
            Transfer.content = 'Invalid Authentication!';
            res.json(Transfer);
          }
        });
  }else{
    Transfer.content = 'You must be logged in to update profile!';
    res.json(Transfer);
  }
});

// upload file
app.post('/setting/profile/upload/:id', (req, res) => {
  const Transfer = {
    type: 'error',
    title: 'Error',
    content: 'N/A'
  };
  const data = {
    id: req.session.userID,
    key: req.session.key,
  }
  if (req.session.isLoggedIn) {
    const id = req.params.id;
    // Authentication
    api_.Authentication(data).then(result => {
      if (result === 'success') {
        if (req.files) {
          const file = req.files.file;
          const fileName = `${id}.png`;

          file.mv(`./image_process/${fileName}`, function (err) {
            if (err) {
              Transfer.content = err;
              res.json(Transfer);
            } else {
              api_.uploadFile(`./image_process/${fileName}`, fileName , data.id).then(result => {
                Transfer.type = 'success';
                Transfer.title = 'Profile Update';
                Transfer.content = 'Upload Successfully!';
                Transfer.data_ = result;
                res.json(Transfer);
                fs.unlinkSync(`./image_process/${fileName}`);
              });
            }
          });
          
        }
      } else {
        Transfer.content = 'Invalid Authentication!';
        res.json(Transfer);
      }
    });
  } else {
    Transfer.content = 'You must be logged in to upload profile!';
    res.json(Transfer);
  }
});

// blogs zone
app.get('/blogs',(req,res)=>{
  api_.blogs('all').then(data=>{
    res.json(data);
  });
});

app.get('/blog/:id',(req,res)=>{
  api_.blogs(req.params.id).then(data=>{
    if (data === undefined) return res.status(404).render('404',{data:'404 Not Found!'});
    if (req.session.isLoggedIn) {
      if(data.writer===req.session.userID){
        data.owner = true;
      }

      api_.userProfiel(req.session.userID,true).then(user_data_result=>{
          data.favorite = user_data_result.favorites.includes(req.params.id);
          res.render('viewblog', {
            data: data,
            user_id: req.session.userID
          });
      });
    }else{
      res.render('viewblog', {
        data: data,
        user_id: 'You must be logged in!'
      });  
    }
  });
});
app.get('/blog/:id/edit',(req,res)=>{
  const auth = {
    id: req.session.userID,
    key: req.session.key,
  }

  api_.blogs(req.params.id).then(data => {
    if (data === undefined) return res.status(404).render('404', { data: '404 Not Found!' });
    if (req.session.isLoggedIn) {
      if(auth.id===data.writer){
        api_.Authentication(auth).then(result=>{
          if(result==='success'){
            res.render('blog-editor',{old_data:data});
          }else{
            res.redirect(`/blog/${req.params.id}`);
          }
        });
      }else{
        res.redirect(`/blog/${req.params.id}`);
      }
    }else{
      res.redirect(`/blog/${req.params.id}`);
    }
  });

});
app.get('/blog/:id/delete',(req,res)=>{
  const auth = {
    id: req.session.userID,
    key: req.session.key,
  }

  api_.blogs(req.params.id).then(data => {
    if (data === undefined) return res.status(404).render('404', { data: '404 Not Found!' });
    api_.Authentication(auth).then(result => {
      if(auth.id===data.writer){
        if (result === 'success') {
          api_.delete_blog(req.params.id).then(del_result=>{
            if(del_result==='success'){
              res.redirect('/');
            }else{
              res.redirect(`/blog/${req.params.id}`);
            }
          });
        } else {
          res.redirect(`/blog/${req.params.id}`);
        }
      }else{
        res.redirect(`/blog/${req.params.id}`);
      }
    });
  });

});

// users zone
app.get('/user/data/:id',(req,res)=>{
  api_.userProfiel(req.params.id).then(result=>{
    res.json(result);
  });
});

// create blog system
app.post('/blog/create',(req,res)=>{
  const data = {
    id: req.session.userID,
    key: req.session.key,
    form: req.body.form,
  }
  const Transfer = {
    type: 'error',
    title: 'Error',
    content: 'N/A'
  };

  if(req.session.isLoggedIn){
    // Authentication
    api_.Authentication(data).then(result => {
      if (result === 'success') {
        api_.userProfiel(data.id, true).then(result_=>{
          if(result_.verify === true){
            api_.create_blog(data).then(create_result => {
              if (create_result !== 'Err') {
                Transfer.type = 'success';
                Transfer.title = 'redirecting..';
                Transfer.content = create_result;
                res.json(Transfer);
              } else {
                Transfer.content = 'Something Wrong!';
                res.json(Transfer);
              }
            });
          }else{
            Transfer.type = 'warn';
            Transfer.title = "Email hasn't been verified!";
            Transfer.content = 'You must verify your email. to create a blog please go to <a target="_blank" href="/setting">setting</a>';
            res.json(Transfer);
          }
        });
      } else {
        Transfer.content = result;
        res.json(Transfer);
      }
    });
  }else{
    Transfer.content = 'You must be logged in to create a blog.';
    res.json(Transfer);
  }

});

// comment system
app.post('/blog/:id/api/comment',(req,res) => {
  const data = {
    blog_id: req.params.id,
    id: req.session.userID,
    key: req.session.key,
    message: req.body.message,
  }
  const Transfer = {
    type: 'error',
    title: 'Error',
    content: 'N/A'
  };

  // Authentication & Comment
  if(req.session.isLoggedIn){
    api_.Authentication(data).then(result=>{
      if(result==='success'){
        const date = new Date();
        const filter = {
          id: data.id,
          comment: data.message,
          date: date.getMonth() + 1 + '/' + date.getDate() + '/' + date.getFullYear()
        }
        api_.update_comment(data.blog_id, filter).then(result => {
          if(result==='success'){
            Transfer.type = 'success';
            Transfer.title = 'Success';
            Transfer.content = 'Your message has been commented.';
            Transfer.user = filter;
            res.json(Transfer);
          }
        });
      }else{
        Transfer.content = result;
        res.json(Transfer);
      }
    });
  }else{
    Transfer.content = 'You must be logged in to comment.';
    res.json(Transfer);
  }
});

// favorites system
app.post('/blog/:id/api/favorite',(req,res)=>{
  const auth = {
    id: req.session.userID,
    key: req.session.key,
  }
  const blog_id = req.params.id;
  const Transfer = {
    type: 'error',
    title: 'Error',
    content: 'N/A'
  };

  if (req.session.isLoggedIn) {
    api_.Authentication(auth).then(result => {
      if (result === 'success') {
        api_.favorite_blog(auth,blog_id).then(favResult=>{
          if(favResult==='Favorite' || favResult==='Unfavorite'){
            Transfer.type = 'success';
            Transfer.title = `${favResult}d!`;
            Transfer.content = 'You can view your favorites in <a href="/setting">Setting</a>';
            res.status(200).json(Transfer);
          }else{
            Transfer.content = favResult;
            res.status(404).json(Transfer);
          }
        })
      } else {
        Transfer.content = result;
        res.status(401).json(Transfer);
      }
    });
  } else {
    Transfer.content = 'You must be logged in to favorite.';
    res.status(401).json(Transfer);
  }
});

// get user profile
app.get('/profile/:id',(req,res)=>{
  const id = req.params.id;

  api_.userProfiel(id).then(result=>{
    if(result.id!=='Error_ID (404 Not Found)'){
      res.render('profile',{data:result});
    }else{
      res.render('404',{data:'404 Not Found!'});
    }
  });
});


// <-- end of custom api --> \\

// test zone //

// test zone //

app.use('/',(req,res)=>{
  res.status(404).render('404',{data:'404 Not Found!'});
});


app.listen(3000,()=> console.log('server is running...✅'));
