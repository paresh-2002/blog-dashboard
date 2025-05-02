const cards = document.getElementById("cards");
const users = document.getElementById("users");
const userDetail = document.getElementById("userContainer");
const posts = document.getElementById("posts");
const addForm = document.getElementById("form");
const postTitle = document.getElementById("postTitle");
const postBody = document.getElementById("postBody");
const submit = document.getElementById("submit");
const addNewPost = document.getElementById("addItem");
const listItems = document.querySelectorAll(".sidebar ul li");
const isActive = document.querySelector(".sidebar ul li");
const closeModal = document.getElementById("closeModal");
const modal = document.getElementById("userModal");
const modalContent = document.getElementById("modalUserDetail");
const formTitle = document.getElementById("formTitle");
let allData = [];
let currentEditPostId = null;
let isEditMode = false;

document.addEventListener("DOMContentLoaded", () => {
  listItems.forEach((item) => {
    item.addEventListener("click", () => {
      listItems.forEach((li) => li.classList.remove("active"));
      item.classList.add("active");

      if (item.textContent.trim() === "Users") {
        users.style.display = "block";
        posts.style.display = "none";
        addForm.style.display = "none";
        getAllUsers();
      } else if (item.textContent.trim() === "Posts") {
        posts.style.display = "block";
        users.style.display = "none";
        addForm.style.display = "none";
      }
    });
  });

  getData();
});

addNewPost.addEventListener("click", () => {
  isEditMode = false;
  currentEditPostId = null;
  postTitle.value = "";
  postBody.value = "";
  addForm.style.display = "block";
  posts.style.display = "none";
  listItems.forEach((li) => li.classList.remove("active"));
  submit.innerText = "ADD";
  formTitle.innerText = "Add Post";
});

submit.addEventListener("click", async function (e) {
  e.preventDefault();

  const title = postTitle.value.trim();
  const body = postBody.value.trim();
  if (!title || !body) {
    alert("Fields are required");
    return;
  }

  const data = {
    userId: Math.floor(Math.random() * 10) + 1,
    title,
    body,
  };

  try {
    let res;
    if (isEditMode && currentEditPostId !== null) {
      if (currentEditPostId <= 100) {
        res = await fetch(
          `https://jsonplaceholder.typicode.com/posts/${currentEditPostId}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userId,
              title,
              body,
            }),
          }
        );
        if (!res.ok) throw new Error("Failed to update post");
        const updatedPost = await res.json();
        updatePostLocally(updatedPost);
        console.log(updatedPost);
      } else {
        let storedPosts = JSON.parse(localStorage.getItem("posts")) || [];
        const updatedPost = storedPosts.find(
          (post) => post.id === currentEditPostId
        );
        if (updatedPost) {
          updatedPost.title = title;
          updatedPost.body = body;
          updatePostLocally(updatedPost);
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
      const newPost = await res.json();
      addPostLocally(newPost);
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
  if (isActive) {
  }
});

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

function renderPostsWithUsers(allPosts) {
  cards.innerHTML = "";

  allPosts.forEach((post) => {
    const postCard = document.createElement("div");
    const userXhr = new XMLHttpRequest();
    userXhr.open(
      "GET",
      `https://jsonplaceholder.typicode.com/users/${post.userId}`,
      true
    );
    userXhr.onload = function () {
      let userName = "Unknown User";
      if (userXhr.status === 200) {
        const user = JSON.parse(userXhr.responseText);
        userName = user.name;
        postCard.addEventListener(
          "click",
          (e) => {
            // e.stopPropagation();
            if (user) showUserModal(user);
          }
          //   true
        );
      }

      postCard.className = "cards";
      postCard.setAttribute("data-id", post.id);
      postCard.innerHTML = `
                <div class="post">
                    <h1 class="post-name">${post.title}</h1>
                    <p class="post-description">${post.body}</p>
                    <h4 class="post-user">User: ${userName}</h4>
                </div>
                <div class="add-post-btn">
                    <button class='delete-btn'>Remove</button>
                    <button class='edit-btn'>Edit</button>
                </div>
            `;

      postCard.querySelector(".delete-btn").addEventListener("click", (e) => {
        e.stopPropagation();
        deletePost(post.id, postCard), true;
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

    userXhr.onerror = function () {
      console.error("Failed to fetch user for post:", post.id);
    };

    userXhr.send();
  });
}

function deletePost(postId, postCard) {
  fetch(`https://jsonplaceholder.typicode.com/posts/${postId}`, {
    method: "DELETE",
    headers: { "Content-type": "application/json" },
  })
    .then((res) => {
      if (!res.ok) throw new Error("Delete failed");

      let storedPosts = JSON.parse(localStorage.getItem("posts")) || [];
      storedPosts = storedPosts.filter((post) => post.id !== postId);
      localStorage.setItem("posts", JSON.stringify(storedPosts));
      allData = allData.filter((post) => post.id !== postId);
      // renderPostsWithUsers(allData);
      postCard.remove();
    })
    .catch((error) => console.error("Delete error:", error));
}

function updatePostLocally(updatedPost) {
  let storedPosts = JSON.parse(localStorage.getItem("posts")) || [];
  storedPosts = storedPosts.map((p) =>
    p.id === updatedPost.id ? updatedPost : p
  );
  localStorage.setItem("posts", JSON.stringify(storedPosts));
  allData = allData.map((p) => (p.id === updatedPost.id ? updatedPost : p));
}

function addPostLocally(newPost) {
  let storedPosts = JSON.parse(localStorage.getItem("posts")) || [];
  storedPosts.unshift(newPost);
  localStorage.setItem("posts", JSON.stringify(storedPosts));
  allData.unshift(newPost);
}

function showUserList(usersData) {
  if (!Array.isArray(usersData)) return;
  userDetail.innerHTML = "";
  usersData.forEach((user) => {
    renderUser(user);
  });
}

function renderUser(user) {
  const userCard = document.createElement("div");
  userCard.setAttribute("data-id", user.id);
  userCard.innerHTML = `
            <div class="user-card">
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
            </div>
        `;

  userCard.querySelector(".delete-btn").addEventListener("click", () => {
    userCard.remove();
  });

  userDetail.appendChild(userCard);
}

function getAllUsers() {
  fetch("https://jsonplaceholder.typicode.com/users")
    .then((res) => res.json())
    .then((usersData) => {
      showUserList(usersData);
    })
    .catch((error) => console.error("Failed to fetch users:", error));
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
        </div>
    `;
  modal.style.display = "flex";
}

document.getElementById("closeModal").addEventListener("click", closeUserModal);

window.addEventListener("click", (e) => {
  if (e.target === modal) {
    closeUserModal();
  }
});

document.querySelector(".modal-content").addEventListener("click", (e) => {
  e.stopPropagation();
});

function closeUserModal() {
  modal.style.display = "none";
}
