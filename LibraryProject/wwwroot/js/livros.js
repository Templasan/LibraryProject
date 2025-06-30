// Funcionalidades específicas para gerenciamento de livros

document.addEventListener('DOMContentLoaded', () => {
    // Carregar lista de livros ao iniciar a página
    carregarLivros();

    // Configurar evento de envio do formulário
    const form = document.getElementById('formLivro');
    if (form) {
        form.addEventListener('submit', cadastrarLivro);
    }
});

// Função utilitária para requisições autenticadas exceto GET
async function livroRequestComToken(url, method = 'GET', body = null) {
    const token = localStorage.getItem('jwtToken');
    // Só adiciona Content-Type se houver body (evita problemas no DELETE)
    const headers = {};
    if (method !== 'GET' && token) {
        headers['Authorization'] = 'Bearer ' + token;
    }
    if (body) headers['Content-Type'] = 'application/json';

    const options = { method, headers };
    if (body) options.body = JSON.stringify(body);

    const response = await fetch(url, options);

    if (response.status === 401) {
        alert('Sua sessão expirou. Faça login novamente.');
        window.location.href = 'login.html';
        throw new Error('Não autorizado');
    }

    return response;
}

// Função para carregar livros da API (GET - sem token)
async function carregarLivros() {
    try {
        const response = await fetch(`${API_URL}/Livros`);
        if (!response.ok) {
            throw new Error(`Erro ao carregar livros: ${response.status}`);
        }

        const livros = await response.json();

        const listaLivros = document.getElementById('listaLivros');
        if (!listaLivros) return;

        if (livros.length === 0) {
            listaLivros.innerHTML = '<p>Nenhum livro cadastrado.</p>';
            return;
        }

        listaLivros.innerHTML = '';

        livros.forEach(livro => {
            const item = document.createElement('div');
            item.className = 'item';
            item.innerHTML = `
                <h3>${livro.titulo}</h3>
                ${livro.capaUrl ? `<img src="${livro.capaUrl}" alt="Capa do livro" class="capa-livro" style="max-width:100px; display:block; margin-bottom:8px;">` : ''}
                <p><strong>Autor:</strong> ${livro.autor}</p>
                <p><strong>Ano:</strong> ${livro.anoPublicacao}</p>
                <p><strong>Editora:</strong> ${livro.editora}</p>
                <p><strong>ISBN:</strong> ${livro.isbn}</p>
                <p><strong>Páginas:</strong> ${livro.numeroPaginas}</p>
                <p class="status ${livro.disponivel ? 'disponivel' : 'indisponivel'}">
                    ${livro.disponivel ? 'Disponível' : 'Indisponível'}
                </p>
                <div class="acoes">
                    <button onclick="editarLivro(${livro.id})">Editar</button>
                    <button class="delete" onclick="excluirLivro(${livro.id})">Excluir</button>
                </div>
            `;
            listaLivros.appendChild(item);
        });
    } catch (error) {
        console.error('Erro ao carregar livros:', error);
        const listaLivros = document.getElementById('listaLivros');
        if (listaLivros) {
            listaLivros.innerHTML = '<p class="error">Erro ao carregar livros. Verifique se a API está em execução.</p>';
        }
    }
}

// Função para cadastrar um novo livro (POST - usa token)
async function cadastrarLivro(event) {
    event.preventDefault();

    const form = event.target;

    const livro = {
        titulo: form.titulo.value,
        autor: form.autor.value,
        anoPublicacao: parseInt(form.anoPublicacao.value),
        editora: form.editora.value,
        isbn: form.isbn.value,
        numeroPaginas: parseInt(form.numeroPaginas.value),
        capaUrl: form.capaUrl.value, // <--- Adicionado aqui
        disponivel: true
    };

    try {
        const response = await livroRequestComToken(`${API_URL}/Livros`, 'POST', livro);

        if (!response.ok) {
            throw new Error(`Erro ao cadastrar livro: ${response.status}`);
        }

        alert('Livro cadastrado com sucesso!');
        form.reset();
        carregarLivros();
    } catch (error) {
        console.error('Erro ao cadastrar livro:', error);
        alert(`Erro ao cadastrar livro: ${error.message}`);
    }
}

// Função para excluir um livro (DELETE - usa token)
async function excluirLivro(id) {
    if (!confirm('Tem certeza que deseja excluir este livro?')) {
        return;
    }

    try {
        const response = await livroRequestComToken(`${API_URL}/Livros/${id}`, 'DELETE');
        if (!response.ok) {
            throw new Error(`Erro ao excluir livro: ${response.status}`);
        }

        alert('Livro excluído com sucesso!');
        carregarLivros();
    } catch (error) {
        console.error('Erro ao excluir livro:', error);
        alert(`Erro ao excluir livro: ${error.message}`);
    }
}

// Função para editar um livro (GET - sem token)
async function editarLivro(id) {
    try {
        const response = await fetch(`${API_URL}/Livros/${id}`);

        if (!response.ok) {
            throw new Error(`Erro ao carregar livro: ${response.status}`);
        }

        const livro = await response.json();

        // Preencher o formulário com os dados do livro
        const form = document.getElementById('formLivro');
        if (form) {
            form.titulo.value = livro.titulo;
            form.autor.value = livro.autor;
            form.anoPublicacao.value = livro.anoPublicacao;
            form.editora.value = livro.editora;
            form.isbn.value = livro.isbn;
            form.numeroPaginas.value = livro.numeroPaginas;
            if (form.capaUrl) form.capaUrl.value = livro.capaUrl || ""; // <--- Adicionado aqui

            // Adicionar um campo oculto para o ID e mudar o texto do botão
            let idField = form.querySelector('input[name="id"]');
            if (!idField) {
                idField = document.createElement('input');
                idField.type = 'hidden';
                idField.name = 'id';
                form.appendChild(idField);
            }
            idField.value = livro.id;

            const submitButton = form.querySelector('button[type="submit"]');
            if (submitButton) {
                submitButton.textContent = 'Atualizar Livro';
            }

            // Mudar o comportamento do formulário para atualizar em vez de cadastrar
            form.removeEventListener('submit', cadastrarLivro);
            form.addEventListener('submit', function (e) {
                e.preventDefault();
                atualizarLivro(form);
            }, { once: true });
        }
    } catch (error) {
        console.error('Erro ao carregar livro para edição:', error);
        alert(`Erro ao carregar livro para edição: ${error.message}`);
    }
}

// Função para atualizar um livro (PUT - usa token)
async function atualizarLivro(form) {
    const id = form.querySelector('input[name="id"]').value;

    const livro = {
        id: parseInt(id),
        titulo: form.titulo.value,
        autor: form.autor.value,
        anoPublicacao: parseInt(form.anoPublicacao.value),
        editora: form.editora.value,
        isbn: form.isbn.value,
        numeroPaginas: parseInt(form.numeroPaginas.value),
        capaUrl: form.capaUrl.value, // <--- Adicionado aqui
        disponivel: true // Mantém disponível por padrão
    };

    try {
        const response = await livroRequestComToken(`${API_URL}/Livros/${id}`, 'PUT', livro);

        if (!response.ok) {
            throw new Error(`Erro ao atualizar livro: ${response.status}`);
        }

        alert('Livro atualizado com sucesso!');

        // Resetar o formulário e restaurar o comportamento original
        form.reset();
        const submitButton = form.querySelector('button[type="submit"]');
        if (submitButton) {
            submitButton.textContent = 'Cadastrar Livro';
        }

        // Remover o campo de ID
        const idField = form.querySelector('input[name="id"]');
        if (idField) {
            form.removeChild(idField);
        }

        // Restaurar o evento original
        form.addEventListener('submit', cadastrarLivro);

        // Recarregar a lista
        carregarLivros();
    } catch (error) {
        console.error('Erro ao atualizar livro:', error);
        alert(`Erro ao atualizar livro: ${error.message}`);
    }
}