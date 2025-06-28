


const pTags = document.querySelectorAll("p");
pTags.forEach(p => {
  p.classList.add('animate');
});

  function toggleDarkMode() {
    document.body.classList.toggle("dark-mode");
  }


  window.addEventListener("load", function () {
    const loader = document.getElementById("loader");
    loader.style.opacity = "0";
    setTimeout(() => loader.style.display = "none", 2000);
  });


// FAQs display on Click
const questions = document.querySelectorAll('.unhide');

questions.forEach(question => {

  question.addEventListener('click', ()=>{

    const answer = question.nextElementSibling;

    if (answer.style.display === 'none'){
      answer.style.display = 'block'

    }else {
      answer.style.display = 'none'
    }

  });
});

// links Scroll Animation
document.querySelectorAll('a[href^="#"]').forEach(anchor =>{

  anchor.addEventListener("click", function (e) {
    e.preventDefault();

    const target = document.querySelector(this.getAttribute("href"));
    const checkbox = document.getElementById("toggler");

    if (target){

      checkbox.checked = false;
      target.scrollIntoView({
        behavior: "smooth"
      });

    }

  });
});

// scroll animations
const observer = new IntersectionObserver((entries) =>{
  entries.forEach(entry => {
    if (entry.isIntersecting){
      entry.target.classList.add('rm-animate');
      observer.unobserve(entry.target);
    }
  });
},{threshold: .3});

const animatingElements = document.querySelectorAll('.animate');
animatingElements.forEach(element =>{
  observer.observe(element);
});



function initEditor() {
  if (!window.tinymce) {
    const script = document.createElement('script');
    script.src = "https://cdn.tiny.cloud/1/8g7rvpan3w7uwjxovkwcdsv5p00b4lat6ktlzo1xsfxywa32/tinymce/7/tinymce.min.js";
    script.referrerPolicy = 'origin';
    script.onload = () => {
      tinymce.init({
        selector: '#content',
        plugins: ['autolink', 'link', 'lists', 'image', 'table', 'wordcount'],
        toolbar: 'undo redo | bold italic underline | bullist numlist | link image table | removeformat',
      });
    };
    document.head.appendChild(script);
  }
}

// FUNCTION TO POP MESSAGE MESSAGE
function showToast(message, color = "#4BB543") {
  const toast = document.getElementById("toast");
  toast.style.backgroundColor = color;
  toast.textContent = message;
  toast.style.visibility = "visible";
  toast.style.opacity = 1;

  setTimeout(() => {
    toast.style.opacity = 0;
    toast.style.visibility = "hidden";
  }, 3000); // hides after 3s
}



document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('subscribe');
  if (!form) return;

  const emailInput = form.querySelector('#email');
  const message = form.querySelector('#message');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = emailInput.value.trim();

    if (!email) {

      showToast("Please enter your email address!", " #d62c19");  

      return;
    }

    try {
      const res = await fetch("/subscribe", {
        method: "POST",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const data = await res.json();
      console.log("Server response:", data);

      if (res.ok) {

        showToast(data.message || "Thank you for subscribing", " #19b20f");
        form.reset();

      } else {
        showToast(data.message || "Subscription failed. Try again.", " #d62c19");
      }
    } catch (err) {

      showToast("An error occurred. Please try again later.", "#d62c19");

    }
  });
});

document.addEventListener('DOMContentLoaded', () =>{

  const form = document.getElementById("comment");
  if (form){
   
    form.addEventListener('submit', async (e) =>{
      e.preventDefault();
      
      const username = form.querySelector("#username").value;
      const email = form.querySelector("#email").value.trim();
      const comment_message = form.querySelector("#comment_message").value;
      const id = form.querySelector("#postId").value;
  
      try{
    
        if (!username || !email || !comment_message) {
    
          showToast("please fill all fields!", " #d62c19")
          return;
        }
    
        const res = await fetch("/comment", {
          method: "POST",
          headers: {'content-type': 'application/json'},
          body: JSON.stringify({username, email, comment_message, id})
        });
    
        const data = await res.json();
        
        if (res.ok){
          showToast(data.message || 'comments sent successfully!', ' #19b20f');
          form.reset();
        }else{
          showToast("Fail to send comment please try again!", " #d62c19");
        }
  
      } catch (err){
  
        showToast("An error occured please try again!",  '#d62c19')
        
      } 
    });
  }
});

document.addEventListener("DOMContentLoaded", () =>{
  const messageForm = document.getElementById("messageForm");
  messageForm.addEventListener('submit', async (e) =>{
    e.preventDefault();
  
    const fullName = document.getElementById("fullName").value;
    const email = document.getElementById("email").value.trim();
    const title = document.getElementById('title').value;
    const message = document.getElementById('message').value;
  
    if (!fullName || !email || !title || !message){
      showToast("Please Fill all fields!", " #d62c19");
      return;
    }
    try{
  
      const res = await fetch("/message", {
        method: "post",
        headers: {"content-type": "application/json"},
        body: JSON.stringify({fullName, email, title, message})
      });
    
      const data = await res.json();

      if (res.ok){
        showToast(data.message || "Message sent successfully!", ' #19b20f' );
        messageForm.reset();
      }else{
        showToast("Fail to send message please try again!", " #d62c19");
      }
    }catch(err){
      console.log(err.message);      
      showToast("An error occured Please try again later", " #d62c19");
    }
  
  });
});

// UPDATE POST FORM!
const updateForm = document.getElementById("updateForm");
updateForm.addEventListener('submit', async (e) =>{
  e.preventDefault()
  const id = updateForm.querySelector('#id').value;
  const title = updateForm.querySelector('#title').value;
  const content = updateForm.querySelector('#content').value;
  const article_img_url = updateForm.querySelector('#article_img_url').value;
  
  try{
  
    if (!id || !title || !content || !article_img_url){
      showToast("Ensure all fields are entered!", " #d62c19");
      return;
    }
  
    const res = await fetch("/admin/update", {
      method: "post",
      headers: {'content-type': "application/json"},
      body: JSON.stringify({id, title, content, article_img_url})
    });

    const data = await res.json();

    if (res.ok){
      showToast(data.message || "Article updated successfully", " #19b20f");
      updateForm.reset();
    }else{
      showToast("Fail please try again!", " #d62c19");
    }

  }catch(err){
    console.log(`the error is: `, err.message)
    showToast("An error occured please try again!", " #d62c19");
  }
});