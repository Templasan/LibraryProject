document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('loginForm');
    if (!form) return;

    form.addEventListener('submit', async function (event) {
        event.preventDefault();

        const erroLogin = document.getElementById('erroLogin');
        if (erroLogin) erroLogin.style.display = 'none';

        const email = document.getElementById('email').value.trim();
        const senha = document.getElementById('senha').value;

        try {
            const resp = await fetch(`${API_URL}/Auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, senha })
            });

            if (resp.ok) {
                const data = await resp.json();
                localStorage.setItem('token', data.token);
                localStorage.setItem('userEmail', email);
                window.location.href = "index.html";
            } else {
                localStorage.removeItem('token');
                localStorage.removeItem('userEmail');
                if (erroLogin) {
                    erroLogin.innerText = 'E-mail ou senha inválidos!';
                    erroLogin.style.display = 'block';
                }
            }
        } catch (err) {
            localStorage.removeItem('token');
            localStorage.removeItem('userEmail');
            if (erroLogin) {
                erroLogin.innerText = 'Erro ao conectar com o servidor.';
                erroLogin.style.display = 'block';
            }
        }
    });
});