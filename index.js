import express, { response } from "express";
import bcrypt, { hash } from "bcrypt";
import multer from "multer";
import env from "dotenv";
import passport from "passport";
import { Strategy } from "passport-local";
import session from "express-session";
import path from "path";
import flash from "connect-flash";
import queries from "./blog_modules/queries.js";

// Setup Multer storage
const storage = multer.diskStorage({
  destination: './uploads/',
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});
const upload = multer({ storage: storage });

const app = express();
const port = 3000;
const saltRound = 10;
env.config();

// middleware
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: true,
}));

app.use((req, res, next) => {
  res.locals.req = req;
  next();
});

app.use(flash())
app.use(express.urlencoded({extended: true}));
app.use(express.static("public"));
app.use(passport.initialize());
app.use(passport.session());
app.use('/uploads', express.static('uploads'));
app.use(express.json())

// making flash Available in views
app.use((req, res, next) => {
  res.locals.error = req.flash('error');
  next();
});


// GET METHODS ROUTES
app.get("/",  async (req, res) => {
  const projects = await queries.getProject();
  console.log(projects);
  
  res.render("index.ejs", 
    {title: "Agera Emmanuel | Portfolio", projects});
});

app.get("/admin", async(req, res) =>{
  try {

    const projects = await queries.getProject();
    const posts = await queries.getPost()
    const result = await queries.getUsers();
    const users = result.rows;
    console.log(users)
    if (req.isAuthenticated()){
      if (req.user.user_role === 'admin'){  
        res.render("admin.ejs", {posts, users, projects});
      }else {
        res.redirect("/blog")
      }
    }else{
      res.redirect("/login");
    }
  }catch(err){
    console.log(err.message);
    res.redirect("/login")
  }
});

app.get("/admin/edit/article/:id", async(req, res) =>{
  console.log(req.params.id);
  try{
    const id = Number(req.params.id);
    const {post, comments} = await queries.getPostById(id)
    if (!post) return res.redirect("/admin");

    res.render("update.ejs", {
      post: post,
      comments: comments,
      title: "Semba Tech Blog | Learn Programming | Learn Tech"
    });

  } catch (err) {
    console.error(err.message);
    res.status(500).redirect("/admin");
  } 
});

app.get("/about", (req, res) =>{
  res.render("about.ejs", {title: 'About me || Learn Programming'})
});

app.get("/privacypolicy", (req, res) => {
  res.render("privacypolicy.ejs", 
    {title: "Privacy Policy | Semba Tech Blog"});
});

app.get("/blog", async (req, res ) => {
  try{
    console.log("Connecting to:", process.env.DATABASE_URL);
    const articleData = await queries.getPost()
    if (articleData){
      res.render("blog.ejs",
      {
        posts: articleData,
        title: "Semba Tech Blog | Learn Programming" 
      });
    }

  }catch(err){
    res.render("blog.ejs", {
      posts: [],
      title: "Semba Tech Blog | Learn Programming | Learn Tech",
      errorMessage: "Sorry, we're having trouble loading the blog right now. Please try again later."
    });
  }
});

app.get("/readmore/article/:id", async (req, res) => {
  try{

    const currentPostId = Number(req.params.id);
    const {post, comments} = await queries.getPostById(currentPostId);
    const articles = await queries.getPost();

    if (!post) return res.redirect("/blog");

    res.render("readmore.ejs", {
      currentPostId,
      posts: articles,
      post: post,
      comments: comments,
      title: "Semba Tech Blog | Learn Programming | Learn Tech"
    });

  } catch (err) {
    console.error(err.message);
    res.status(500).redirect("/blog");
  } 
});

app.get("/register", (req, res) => {
    if (req.isAuthenticated()){
    res.render("newpost.ejs", 
      {title: "New article | Semba Tech Blog"});
  }else{
    res.render("register.ejs",
      {title: "Sign Up | Semba Tech Blog"});
  }
  
});

app.get("/login", (req, res) =>{
  res.render("login.ejs", {title: "Login | Semba Tech Blog"});
});

app.get("/newpost", (req, res) =>{
  if (req.isAuthenticated()){
    res.render("newpost.ejs", {user: req.user.name, title: "New article | Semba Tech Blog"});
  }else{
    res.render("login.ejs", {title: "Login | Semba Tech Blog"});
  }

});

app.get("/contact", (req, res) =>{
  res.render("contact.ejs", {title: "Contact | Agera Emmanuel"});
});


app.get("/logout", (req, res) => {
  req.logout(err => {
    if(err){
      return next(err)
    }
  });
  res.redirect("/blog");
});


// POST METHOD ROUTES

// LOGIN ROUTE
app.post("/login", 
  passport.authenticate('local',{
  successRedirect: "/newPost",
  failureRedirect: "/login",
  failureFlash: true
}));

// SUBSCRIBE ROUTE
app.post("/subscribe", async (req, res) => {
  try{
    const {email} = req.body;

    if (!email || !email.includes("@")){
      res.status(400).json({message: 'Please enter a valid email address.'});  
    }  

    let result = await queries.subscribe(email);
    return res.status(200).json({ message: result })

  }catch(err){

    console.log(`error Subscribing: ${err.message}`);

    res.status(500).json({message: 'an error occured please try again later.'});   
    
  }
});

app.post("/comment", async (req, res) =>{

  try {

    const {username, email, comment_message, id} = req.body;
    console.log(email, username, comment_message, id)
    if(!email.includes("@")) {
      return res.status(400).json({message: "Please enter an invalid email."});
    }

    await queries.sendComment(username, email, comment_message, id);
    return res.status(200).json({message: 'Comment sent successfully thank you!'});

  } catch(err){

    console.log(`Error at /comment `, err.message);
    return res.status(500).json({message: 'An error occured please try again later'});

  }
});

app.post("/message", async (req, res) =>{
  const {fullName, email, title, message} = req.body;

  if (!email.includes('@')){
    return res.status(400).json({message: "Please Enter a valid email."})
  }
  try {
    await queries.sendMessage(fullName, email, title, message)
    return res.status(200).json("Thank you for messaging. response will be sent shortly");
  } catch (err){
    console.log("Error sending messsage: ", err.message);
    return res.status(500).json({message: "An error occured Please try again later"});
  }
});

// SIGNUP ROUTE
app.post("/signup", upload.single("profile_pic"), async (req, res) =>{

  const {fullName, email, password1, password2, } = req.body;
  const image = req.file;
  const user_role = 'user';

  try{

    const result = await queries.checkEmail(email);

    if (result.rows.length > 0){

      res.render("register.ejs", 
        {
        title: "Sign Up | Semba Tech Blog",
        message:" Email Already Exists"
      });
    
    }else{
      
      if (password1 !== password2){
        res.render("register.ejs",
          {
            message:" ensure passwords are thesame",
            title: "Sign Up | Semba Tech Blog",
          });

      }else{

        // Hashing passward Using bcrypt
        bcrypt.hash(password1, saltRound, async (err, hash) =>{
          if (err){
            console.log(`error hasshing password ${err}`);
          }else{
            console.log(`successfully hash: ${hash}`)
            try{

              const currentUser = await queries.signUpUser(fullName, email, hash, user_role)

              req.login(currentUser.rows[0], (err) => {
                if (err){
                  console.log(err.message)
                }else{
                  console.log("success");
                  res.redirect("/newPost");
                }
              });

            } catch(err){
              console.log(`Error submitting form: ${err.message}`);
              res.render("register.ejs",
                {
                  title: "Sign Up | Semba Tech Blog",
                  message:"Error occurred please try again later"
                }
              );
            }
          }
        });

      }

    }

  } catch (err){
    console.log(err.message);
  }

});

// UPDATE ROUTE
app.post("/admin/update", async(req, res) =>{
  try{

    const {id, content, title, article_img_url} = req.body;

    if (!id || !content || !title){
      return res.status(400).json({message: `Fields can't be empty!`})
    }
    
    await queries.updateArticle(title, content, article_img_url, id);
    return res.status(200).json({message: `Article updated successfully!`})

  }catch (err){

    console.log(err.message);
    return res.status(500).json({message: `An error occured please try again!`})
  }
});

app.post("/admin/delete/article/:id", async (req,res) =>{
  try{
    
    await queries.deleteFromDb(req.params.id, 'articles', 'article_id');
    return res.redirect("/admin");
    
  }catch(err){
    console.log(err.message);
    return res.redirect("/admin");
  }
});


app.post("/admin/delete/project/:id", async (req, res) =>{
  try{

    await queries.deleteFromDb(req.params.id, 'projects', 'id');
    return res.redirect("/admin");
    
  }catch(err){
    console.log(err.message);
    return res.redirect("/admin");
  }
});

app.post("/admin/uploadproject",
  upload.single('project_img'), 
  async (req, res) => {

  try{

    const {project_title, project_description, link} = req.body;
    const project_img = req.file;

    await queries.uploadProject(project_title, project_description, project_img.filename, link);
    window.alert("Project successfully Added!");
    res.redirect("/admin");

  }catch(err){
    console.log(err.message);
    res.redirect("/admin");
  }
})

app.post("/submitPost", upload.single('post_img'), async(req, res) => {
  try {
    const {title, content} = req.body;
    const userId = req.user.user_id;
    
    if (req.file === undefined) {
      await queries.sendArticle(title, content, userId)
       
      res.redirect("/blog");

    }else{
      const imagePath = `/uploads/${req.file.filename}`;

      await queries.sendArticleWithImg(title, content, userId, imagePath) 
  
     res.redirect("/blog");
    }
  
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ success: false, error: `Upload failed ${err.message}`  });
  }

  
});


passport.use(
  new Strategy(async function verify(username, password, cb) {
    try {
      const result = await queries.checkEmail(username);
      if (result.rows.length > 0) {
        const user = result.rows[0];
        const storedHashedPassword = user.password;
        bcrypt.compare(password, storedHashedPassword, (err, valid) => {
          if (err) {
            //Error with password check
            console.error("Error comparing passwords:", err);
            return cb(err);
          } else {
            if (valid) {
              //Passed password check
              console.log('Success! at password');
              return cb(null, user, {message: "Success"});
              
            } else {
              //Did not pass password check
              console.log('Failure! at password');
              return cb(null, false, {message: "incorrect Username or password Please try again"});
            }
          }
        });
      } else {
        console.log("User not found")
        return cb(null, false, {message: "User not found"});
      }
    } catch (err) {
      console.log(err);
      return cb(null, false, {message: "An error occured pls try again!"} )
    }
  })
);

passport.serializeUser((user, cb) => {
  cb(null, user);
});
passport.deserializeUser((user, cb) => {
  cb(null, user);
});


app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});

