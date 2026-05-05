// Verifica o email
function validarEmail(email) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

// ================= TOKEN =================

async function renovarToken() {
  const oldRefreshToken = localStorage.getItem("refreshToken");
  if (!oldRefreshToken) return null;

  try {
    const res = await fetch("http://localhost:3000/refresh", {
      method: "POST",
      headers: { "Content-type": "application/json" },
      body: JSON.stringify({ refreshToken: oldRefreshToken }),
    });

    if (!res.ok) {
      localStorage.clear();
      window.location.href = "index.html";
      return null;
    }

    const data = await res.json();

    localStorage.setItem("token", data.token);
    localStorage.setItem("refreshToken", data.refreshToken);

    return data.token;
  } catch (err) {
    console.error("Erro ao renovar token:", err);
    return null;
  }
}

async function fetchComAuth(url, options = {}) {
  let token = localStorage.getItem("token");

  let res = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${token}`,
    },
  });

  if (res.status === 401) {
    const novoToken = await renovarToken();
    if (!novoToken) return res;

    res = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${novoToken}`,
      },
    });
  }

  return res;
}

// ================= CADASTRO =================

async function cadastrarUsuário() {
  const name = document.querySelector("#name").value;
  const email = document.querySelector("#email").value;
  const password = document.querySelector("#password").value;

  if (!validarEmail(email)) {
    alert("Por favor, insira um email válido!");
    return;
  }

  try {
    const res = await fetch("http://localhost:3000/cadastro", {
      method: "POST",
      headers: { "Content-type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });

    const data = await res.json();

    alert(data.mensagem);

    if (res.ok) {
      window.location.href = "index.html";
    }
  } catch (err) {
    console.error("Erro:", err);
  }
}

// ================= REDIRECIONAMENTO =================

function redirecionarUsuario() {
  const token = localStorage.getItem("token");

  if (!token) {
    window.location.href = "index.html";
    return;
  }

  const payload = JSON.parse(atob(token.split(".")[1]));

  if (payload.admin) {
    window.location.href = "admin.html";
  } else {
    window.location.href = "usuario.html";
  }
}

// ================= LOGIN =================

async function logarUsuario() {
  const email = document.querySelector(".email").value;
  const password = document.querySelector(".password").value;

  if (!email || !password) {
    alert("Preencha todos os campos");
    return;
  }

  try {
    const res = await fetch("http://localhost:3000/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.mensagem);
      return;
    }

    localStorage.setItem("token", data.token);
    localStorage.setItem("refreshToken", data.refreshToken);

    redirecionarUsuario();
  } catch (err) {
    console.error("Erro:", err);
  }
}

// ================= LOGIN - GOOGLE ===================

window.handleCredentialResponse = function (response) {
  console.log("Google response:", response);

  try {
    const data = JSON.parse(atob(response.credential.split(".")[1]));

    const mensagem = document.getElementById("mensagem");
    if (mensagem) {
      mensagem.innerHTML = `
        <h3>Bem-vindo, ${data.name}!</h3>
        <img src="${data.picture}" style="width:50px;border-radius:50%">
      `;
    }
  } catch (e) {
    console.warn("Erro ao decodificar:", e);
  }

  fetch("http://localhost:3000/google-login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      token: response.credential,
    }),
  })
    .then((res) => res.json())
    .then((data) => {
      console.log("BACKEND:", data);

      if (!data.token) {
        alert("Erro no login");
        return;
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("refreshToken", data.refreshToken);

      redirecionarUsuario();
    })
    .catch((err) => console.error("Erro:", err));
};

// ================= LOGOUT =================

function desconectarUsuario() {
  localStorage.clear();
  window.location.href = "index.html";
}

// ================= PERFIL =================

function informaçõesUsuario() {
  const nome = document.querySelector(".username");
  const email = document.querySelector(".usermail");

  const token = localStorage.getItem("token");
  if (!token) return;

  const payload = JSON.parse(atob(token.split(".")[1]));

  nome.innerHTML = `Nome: ${payload.name}`;
  email.innerHTML = `Email: ${payload.email}`;
}

// ================= USUÁRIOS =================

async function mostrarUsuarios() {
  const listaDeUsuarios = document.querySelector(".exibitionUsers");

  try {
    const res = await fetchComAuth("http://localhost:3000/users");
    const data = await res.json();

    listaDeUsuarios.innerHTML = "";

    if (data.mensagem) {
      listaDeUsuarios.innerHTML = `<p>${data.mensagem}</p>`;
    } else {
      data.forEach((user) => {
        const div = document.createElement("div");
        div.classList.add("userCard");

        // 🔥 MANTIDO EXATAMENTE COMO VOCÊ USAVA
        div.innerHTML = `
          <p><strong>Nome:</strong> ${user.name}</p>
          <p><strong>Email:</strong> ${user.email}</p>
        `;

        listaDeUsuarios.appendChild(div);
      });
    }
  } catch (err) {
    console.error(err);
  }
}

// ================= ADMIN =================

async function administrarUsuarios() {
  const listaDeUsuarios = document.querySelector(".exibitionUsers");

  try {
    const res = await fetchComAuth("http://localhost:3000/users");
    const data = await res.json();

    listaDeUsuarios.innerHTML = "";

    if (data.mensagem) {
      listaDeUsuarios.innerHTML = `<p>${data.mensagem}</p>`;
    } else {
      data.forEach((user) => {
        const div = document.createElement("div");
        div.classList.add("userCard");

        // 🔥 MANTIDO EXATAMENTE COMO SEU ORIGINAL
        div.innerHTML = `
          <p><strong>Id:</strong> ${user.id || user._id}</p>
          <p><strong>Nome:</strong> ${user.name}</p>
          <p><strong>Email:</strong> ${user.email}</p>
          <p><strong>Admin:</strong> ${user.admin}</p>
        `;

        const putButton = document.createElement("button");
        putButton.innerHTML = "Atualizar Usuário";
        putButton.className = "putButton";
        putButton.dataset.email = user.email;

        const delButton = document.createElement("button");
        delButton.innerHTML = "Deletar Usuário";
        delButton.className = "delButton";
        delButton.dataset.email = user.email;

        div.append(putButton, delButton);
        listaDeUsuarios.appendChild(div);
      });
    }
  } catch (err) {
    console.error(err);
  }
}

// ================= UPDATE =================

async function atualizarUsuario(el) {
  const emailUser = el.dataset.email;

  const novoNome = prompt("Digite o novo nome:");
  const ehAdmin = confirm("Será administrador?");

  if (!novoNome) return;

  try {
    const res = await fetchComAuth(
      `http://localhost:3000/users/put/${encodeURIComponent(emailUser)}`,
      {
        method: "PUT",
        headers: { "Content-type": "application/json" },
        body: JSON.stringify({
          nome: novoNome,
          admin: ehAdmin,
        }),
      },
    );

    const data = await res.json();
    alert(data.mensagem || "Usuário atualizado!");
    location.reload();
  } catch (err) {
    console.error(err);
  }
}

// ================= DELETE =================

async function apagarUsuario(el) {
  const emailUser = el.dataset.email;

  try {
    const res = await fetchComAuth(
      `http://localhost:3000/users/delete/${encodeURIComponent(emailUser)}`,
      { method: "DELETE" },
    );

    const data = await res.json();
    alert(data.mensagem || "Usuário apagado!");
    location.reload();
  } catch (err) {
    console.error(err);
  }
}

// ================= EVENTS =================

document.addEventListener("click", (e) => {
  const el = e.target;

  if (el.classList.contains("button1")) cadastrarUsuário();
  if (el.classList.contains("button2")) logarUsuario();
  if (el.classList.contains("logout")) desconectarUsuario();
  if (el.classList.contains("putButton")) atualizarUsuario(el);
  if (el.classList.contains("delButton")) apagarUsuario(el);
});
