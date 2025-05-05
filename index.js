cards = document.getElementById("cards");
users = document.getElementById("users");
userDetail = document.getElementById("userContainer");
posts = document.getElementById("posts");
addForm = document.getElementById("form");
postTitle = document.getElementById("postTitle");
postBody = document.getElementById("postBody");
submit = document.getElementById("submit");
addNewPost = document.getElementById("addItem");
listItems = document.querySelectorAll(".sidebar ul li");
modal = document.getElementById("userModal");
modalContent = document.getElementById("modalUserDetail");
formTitle = document.getElementById("formTitle");
isActive = document.querySelector(".sidebar ul li");

let allData = [];
let currentEditPostId = null;
let isEditMode = false;

document.addEventListener("DOMContentLoaded", () => {
  listItems.forEach((item) => {
    item.addEventListener("click", () => handleTabChange(item));
  });
  getData();
});

addNewPost.addEventListener("click", showAddForm);
submit.addEventListener("click", handleFormSubmit);
document.getElementById("closeModal").addEventListener("click", closeUserModal);
document
  .querySelector(".modal-content")
  .addEventListener("click", (e) => e.stopPropagation());
window.addEventListener("click", (e) => e.target === modal && closeUserModal());

function handleTabChange(item) {
  listItems.forEach((li) => li.classList.remove("active"));
  item.classList.add("active");

  const tab = item.textContent.trim();
  users.style.display = tab === "Users" ? "block" : "none";
  posts.style.display = tab === "Posts" ? "block" : "none";
  addForm.style.display = "none";

  if (tab === "Users") getAllUsers();
}

function showAddForm() {
  isEditMode = false;
  currentEditPostId = null;
  postTitle.value = "";
  postBody.value = "";
  addForm.style.display = "block";
  posts.style.display = "none";
  listItems.forEach((li) => li.classList.remove("active"));
  submit.innerText = "ADD";
  formTitle.innerText = "Add Post";
}

async function handleFormSubmit(e) {
  e.preventDefault();
  const title = postTitle.value.trim();
  const body = postBody.value.trim();
  if (!title || !body) return alert("Fields are required");

  const data = { userId: Math.floor(Math.random() * 10) + 1, title, body };
  try {
    let res, newPost;
    if (isEditMode && currentEditPostId !== null) {
      if (currentEditPostId <= 100) {
        res = await fetch(
          `https://jsonplaceholder.typicode.com/posts/${currentEditPostId}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...data, userId }),
          }
        );
        if (!res.ok) throw new Error("Failed to update post");
        newPost = await res.json();
        updatePost(newPost);
      } else {
        let storedPosts = JSON.parse(localStorage.getItem("posts")) || [];
        const updatedPost = storedPosts.find(
          (post) => post.id === currentEditPostId
        );
        if (updatedPost) {
          updatedPost.title = title;
          updatedPost.body = body;
          updatePost(updatedPost);
        }
      }
      alert("Post updated successfully");
      isActive.classList.add("active");
    } else {
      res = await fetch("https://jsonplaceholder.typicode.com/posts", {
        method: "POST",
        headers: { "Content-type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to add post");
      newPost = await res.json();
      addPost(newPost);
      alert("Post added successfully");
      isActive.classList.add("active");
    }

    postTitle.value = "";
    postBody.value = "";
    addForm.style.display = "none";
    posts.style.display = "block";
    renderPostsWithUsers(allData);
  } catch (error) {
    console.error("Error:", error);
  }
}

function getData() {
  cards.innerHTML = '<p class="loading">Loading...</p>';
  fetch("https://jsonplaceholder.typicode.com/posts")
    .then((res) => res.json())
    .then((fetchedPosts) => {
      const storedPosts = JSON.parse(localStorage.getItem("posts")) || [];
      allData = [...storedPosts, ...fetchedPosts];
      renderPostsWithUsers(allData);
    })
    .catch((error) => {
      console.error("Error:", error);
      cards.innerHTML = "<p>Failed to load data.</p>";
    });
}

function renderPostsWithUsers(post) {
  cards.innerHTML = "";
  if (!post || post.length === 0) {
    cards.innerHTML = '<p class="foundMgs">Posts is Empty</p>';
    return;
  }
  post.forEach((post) => {
    const userXhr = new XMLHttpRequest();
    userXhr.open(
      "GET",
      `https://jsonplaceholder.typicode.com/users/${post.userId}`,
      true
    );
    userXhr.onload = function () {
      const user =
        userXhr.status === 200 ? JSON.parse(userXhr.responseText) : null;
      const postCard = document.createElement("div");
      postCard.className = "cards";
      postCard.setAttribute("data-id", post.id);
      postCard.innerHTML = `
        <div class="post">
          <h1 class="post-name">${post.title}</h1>
          <p class="post-description">${post.body}</p>
          <h4 class="post-user">User: ${user ? user.name : "Unknown User"}</h4>
        </div>
        <div class="add-post-btn">
          <button class='delete-btn'>Remove</button>
          <button class='edit-btn'>Edit</button>
        </div>`;

      if (user) {
        postCard.addEventListener("click", () => showUserModal(user));
      }

      postCard.querySelector(".delete-btn").addEventListener("click", (e) => {
        e.stopPropagation();
        deletePost(post.id, postCard);
      });

      postCard.querySelector(".edit-btn").addEventListener(
        "click",
        (e) => {
          e.stopPropagation();
          isEditMode = true;
          currentEditPostId = post.id;
          userId = post.userId;
          postTitle.value = post.title;
          postBody.value = post.body;
          addForm.style.display = "block";
          posts.style.display = "none";
          listItems.forEach((li) => li.classList.remove("active"));
          submit.innerText = "Update";
          formTitle.innerText = "Update Post";
        },
        true
      );

      cards.appendChild(postCard);
    };
    userXhr.onerror = () =>
      console.error("Failed to fetch user for post:", post.id);
    userXhr.send();
  });
}

function deletePost(id, card) {
  fetch(`https://jsonplaceholder.typicode.com/posts/${id}`, {
    method: "DELETE",
    headers: { "Content-type": "application/json" },
  })
    .then((res) => {
      if (!res.ok) throw new Error("Delete failed");
      let stored = JSON.parse(localStorage.getItem("posts")) || [];
      stored = stored.filter((p) => p.id !== id);
      localStorage.setItem("posts", JSON.stringify(stored));
      allData = allData.filter((p) => p.id !== id);
      card.remove();
    })
    .catch((error) => console.error("Delete error:", error));
}

function updatePost(updatedPost) {
  let stored = JSON.parse(localStorage.getItem("posts")) || [];
  stored = stored.map((p) => (p.id === updatedPost.id ? updatedPost : p));
  localStorage.setItem("posts", JSON.stringify(stored));
  allData = allData.map((p) => (p.id === updatedPost.id ? updatedPost : p));
}

function addPost(post) {
  let stored = JSON.parse(localStorage.getItem("posts")) || [];
  const fullPost = { ...post, id: Date.now() };
  stored.unshift(fullPost);
  localStorage.setItem("posts", JSON.stringify(stored));
  allData.unshift(fullPost);
}

function getAllUsers() {
  fetch("https://jsonplaceholder.typicode.com/users")
    .then((res) => res.json())
    .then((data) => {
      userDetail.innerHTML = "";
      data.forEach(renderUser);
    })
    .catch((error) => console.error("Failed to fetch users:", error));
}

function renderUser(user) {
  if (!user || user.length === 0) {
    userDetail.innerHTML = '<p class="foundMgs">Posts is Empty</p>';
    return;
  }
  const card = document.createElement("div");
  card.innerHTML = `
    <div class="user-card" data-id="${user.id}">
      <div class="user-header">
        <h2 class="user-name">${user.name}</h2>
        <p class="user-email">${user.email}</p>
      </div>
      <div class="user-body">
        <p><strong>Address:</strong> ${user.address.city}</p>
        <p><strong>Phone:</strong> ${user.phone}</p>
      </div>
      <div class="add-post-btn">
        <button class="delete-btn">Remove</button>
      </div>
    </div>`;

  card
    .querySelector(".delete-btn")
    .addEventListener("click", () => card.remove());
  userDetail.appendChild(card);
}

function showUserModal(user) {
  modalContent.innerHTML = `
    <div class="user-card">
      <div class="user-header">
        <h2 class="user-name">${user.name}</h2>
        <p class="user-email">${user.email}</p>
      </div>
      <div class="user-body">
        <p><strong>City:</strong> ${user.address.city}</p>
        <p><strong>Phone:</strong> ${user.phone}</p>
        <p><strong>Company:</strong> ${user.company.name}</p>
      </div>
    </div>`;
  modal.style.display = "flex";
}

function closeUserModal() {
  modal.style.display = "none";
}
