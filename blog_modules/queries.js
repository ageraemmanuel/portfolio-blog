import env from "dotenv";


env.config();

import { Pool } from "pg";


// setting Up postgres database 
const db = new Pool ({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
});


// GET ALL ARTICLES
async function getPost() {
  const articles = await db.query(
    `SELECT * FROM articles ORDER BY articles.article_id DESC;`
  );
  if (articles.rows.length > 0){
    return articles.rows
  }
}

async function getUsers() {
  return await db.query("SELECT * FROM users;")
}

// GET ARTICLE BY ID
async function getPostById(id) {
  if (isNaN(id)) throw new Error("Invalid article ID");


  const [articles, comments] = await Promise.all([
    db.query(
      `SELECT users.name, users.user_img_url, articles.article_id AS art_id, 
        articles.title, articles.article_content, articles.article_created_on, 
        articles.article_img_url, COUNT(comments.comment_id) AS total_comments 
        FROM users 
        JOIN articles ON users.user_id = articles.author_id 
        LEFT JOIN comments ON comments.article_id = articles.article_id 
        WHERE articles.article_id = $1 
        GROUP BY users.name, users.user_img_url, articles.article_id;`,
      [id]
    ),

    db.query(
      `SELECT article_id, commentor_name, comment_content, comment_created_on 
        FROM comments 
        WHERE article_id = $1 
        ORDER BY comment_created_on DESC;`,
      [id]
    )
  ]);

  if (!articles.rows.length) {
    console.log("NO ARTICLES FOUND")
    return null;
  }
  
  return {
    post: articles.rows[0],
    comments: comments.rows,
  }
}

// SUBSCRIBE USER
async function subscribe(email) {
  const result = await db.query("SELECT * FROM subscribers where email = $1", [email]);
  console.log('check email is:', result.rows);
  if (result.rows.length <= 0){
    await db.query(`INSERT INTO subscribers (email) VALUES ($1)`,[email]);
    return "Thank you for subscribing!";
  }else{
    return "Already subscribed thank you!";
  }
}

// SEND COMMENTS
async function sendComment(username, email, comment, article_id ) {
  await db.query("INSERT INTO comments (comment_content, commentor_name, commentor_email, article_id) VALUES($1,$2,$3,$4);",
    [comment, username, email, article_id]
  );
}

// CHECK IF USER EXISTS
async function checkEmail(email) {

  const result = await db.query("SELECT * FROM users WHERE email = $1", [email]);
  return result;
  
}


// SIGNUP USER
async function signUpUser(fullName, email, hash, user_role) {
  
  const user = await db.query("INSERT INTO users (name, email, password, user_role) VALUES($1, $2, $3, $4 ) RETURNING email, password",
    [fullName, email, hash, user_role]
  );

  return user

}

// SEND MESSAGE
async function sendMessage(fullName, email, title, message) {
  db.query("INSERT INTO messages (name, email, title, message) VALUES($1, $2, $3, $4)",
        [fullName, email, title, message]
      );
}

async function sendArticle(title, content, userId) {
   await db.query(
      "INSERT INTO articles (title, article_content, author_id) VALUES($1, $2, $3)",
      [title, content, userId]
    );
}


async function sendArticleWithImg(title, content, userId, imagePath) {
  
  await db.query(
  "INSERT INTO articles (title, article_content, author_id, article_img_url) VALUES($1, $2, $3, $4)",
  [title, content, userId, imagePath]
  );
}

// UPDATE ARTICLE
async function updateArticle(title, content, article_img_url, id) {
  await db.query("UPDATE articles SET title = $1, article_content = $2, article_img_url = $3 WHERE article_id = $4", [title, content, article_img_url, id])
}

async function uploadProject(project_title, project_description, project_img_url, link) {
  await db.query("INSERT INTO projects (project_title, project_description, project_img_url, links) VALUES ($1, $2, $3, $4)",
    [project_title, project_description, project_img_url, link]
  );
}

async function getProject() {
  const result = await db.query("SELECT * FROM projects");
  return result.rows;
}

async function deleteFromDb(id, table, key){
  await db.query(`DELETE FROM ${table} WHERE ${key} = $1`, [id]);
}

async function updateProject(project_title, project_description, project_img_url, id) {
  await db.query("UPDATE projects SET project_title = $1, project_description = $2, project_img_url = $3 WHERE id = $4", [project_title, project_description, project_img_url, id]);
}



const queries = {getPost, getUsers, updateArticle, getPostById, updateProject, uploadProject, getProject, subscribe, sendComment, checkEmail, signUpUser, sendMessage, sendArticle, sendArticleWithImg,  deleteFromDb}

export default queries 
