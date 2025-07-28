// Funcionalidades específicas para gerenciamento de revistas

document.addEventListener('DOMContentLoaded', () => {
    // Carregar lista de revistas ao iniciar a página
    carregarRevistas();

    // Configurar evento de envio do formulário
    const form = document.getElementById('formRevista');
    if (form) {
        form.addEventListener('submit', cadastrarRevista);
    }
});

// Função utilitária para requisições autenticadas exceto GET
async function revistaRequestComToken(url, method = 'GET', body = null) {
    const token = localStorage.getItem('token');
    const headers = { 'Content-Type': 'application/json' };
    if (method !== 'GET' && token) {
        headers['Authorization'] = 'Bearer ' + token;
    }
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

// Função para carregar revistas da API (GET - sem token)
async function carregarRevistas() {
    try {
        const response = await fetch(`${API_URL}/Revistas`);
        if (!response.ok) {
            throw new Error(`Erro ao carregar revistas: ${response.status}`);
        }

        const revistas = await response.json();

        const listaRevistas = document.getElementById('listaRevistas');
        if (!listaRevistas) return;

        if (revistas.length === 0) {
            listaRevistas.innerHTML = '<p>Nenhuma revista cadastrada.</p>';
            return;
        }

        listaRevistas.innerHTML = '';

        revistas.forEach(revista => {
            const item = document.createElement('div');
            item.className = 'item';
            item.innerHTML = `
                <h3>${revista.titulo}</h3>
                ${revista.capaUrl ? `<img src="${revista.capaUrl}" alt="Capa da revista" class="capa-revista" style="max-width:100px; display:block; margin-bottom:8px;">` : ''}
                <p><strong>Edição:</strong> ${revista.edicao}</p>
                <p><strong>Ano:</strong> ${revista.anoPublicacao}</p>
                <p><strong>Editora:</strong> ${revista.editora}</p>
                <p><strong>ISSN:</strong> ${revista.issn}</p>
                <p><strong>Periodicidade:</strong> ${revista.periodicidade}</p>
                <p class="status ${revista.disponivel ? 'disponivel' : 'indisponivel'}">
                    ${revista.disponivel ? 'Disponível' : 'Indisponível'}
                </p>
                <div class="acoes">
                    <button onclick="editarRevista(${revista.id})">Editar</button>
                    <button class="delete" onclick="excluirRevista(${revista.id})">Excluir</button>
                </div>
            `;
            listaRevistas.appendChild(item);
        });
    } catch (error) {
        console.error('Erro ao carregar revistas:', error);
        const listaRevistas = document.getElementById('listaRevistas');
        if (listaRevistas) {
            listaRevistas.innerHTML = '<p class="error">Erro ao carregar revistas. Verifique se a API está em execução.</p>';
        }
    }
}

// Função para cadastrar uma nova revista (POST - usa token)
async function cadastrarRevista(event) {
    event.preventDefault();

    const form = event.target;

    const revista = {
        titulo: form.titulo.value,
        edicao: form.edicao.value,
        anoPublicacao: parseInt(form.anoPublicacao.value),
        editora: form.editora.value,
        issn: form.issn.value,
        periodicidade: form.periodicidade.value,
        capaUrl: form.capaUrl.value, // <--- Adicionado aqui
        disponivel: true
    };

    try {
        const response = await revistaRequestComToken(`${API_URL}/Revistas`, 'POST', revista);

        if (!response.ok) {
            throw new Error(`Erro ao cadastrar revista: ${response.status}`);
        }

        alert('Revista cadastrada com sucesso!');
        form.reset();
        carregarRevistas();
    } catch (error) {
        console.error('Erro ao cadastrar revista:', error);
        alert(`Erro ao cadastrar revista: ${error.message}`);
    }
}

// Função para excluir uma revista (DELETE - usa token)
async function excluirRevista(id) {
    if (!confirm('Tem certeza que deseja excluir esta revista?')) {
        return;
    }

    try {
        const response = await revistaRequestComToken(`${API_URL}/Revistas/${id}`, 'DELETE');

        if (!response.ok) {
            throw new Error(`Erro ao excluir revista: ${response.status}`);
        }

        alert('Revista excluída com sucesso!');
        carregarRevistas();
    } catch (error) {
        console.error('Erro ao excluir revista:', error);
        alert(`Erro ao excluir revista: ${error.message}`);
    }
}

// Função para editar uma revista (GET - sem token)
async function editarRevista(id) {
    try {
        const response = await fetch(`${API_URL}/Revistas/${id}`);

        if (!response.ok) {
            throw new Error(`Erro ao carregar revista: ${response.status}`);
        }

        const revista = await response.json();

        // Preencher o formulário com os dados da revista
        const form = document.getElementById('formRevista');
        if (form) {
            form.titulo.value = revista.titulo;
            form.edicao.value = revista.edicao;
            form.anoPublicacao.value = revista.anoPublicacao;
            form.editora.value = revista.editora;
            form.issn.value = revista.issn;
            form.periodicidade.value = revista.periodicidade;
            if (form.capaUrl) form.capaUrl.value = revista.capaUrl || ""; // <--- Adicionado aqui

            // Adicionar um campo oculto para o ID e mudar o texto do botão
            let idField = form.querySelector('input[name="id"]');
            if (!idField) {
                idField = document.createElement('input');
                idField.type = 'hidden';
                idField.name = 'id';
                form.appendChild(idField);
            }
            idField.value = revista.id;

            const submitButton = form.querySelector('button[type="submit"]');
            if (submitButton) {
                submitButton.textContent = 'Atualizar Revista';
            }

            // Mudar o comportamento do formulário para atualizar em vez de cadastrar
            form.removeEventListener('submit', cadastrarRevista);
            form.addEventListener('submit', function (e) {
                e.preventDefault();
                atualizarRevista(form);
            }, { once: true });
        }
    } catch (error) {
        console.error('Erro ao carregar revista para edição:', error);
        alert(`Erro ao carregar revista para edição: ${error.message}`);
    }
}

// Função para atualizar uma revista (PUT - usa token)
async function atualizarRevista(form) {
    const id = form.querySelector('input[name="id"]').value;

    const revista = {
        id: parseInt(id),
        titulo: form.titulo.value,
        edicao: form.edicao.value,
        anoPublicacao: parseInt(form.anoPublicacao.value),
        editora: form.editora.value,
        issn: form.issn.value,
        periodicidade: form.periodicidade.value,
        capaUrl: form.capaUrl.value, // <--- Adicionado aqui
        disponivel: true // Mantém disponível por padrão
    };

    try {
        const response = await revistaRequestComToken(`${API_URL}/Revistas/${id}`, 'PUT', revista);

        if (!response.ok) {
            throw new Error(`Erro ao atualizar revista: ${response.status}`);
        }

        alert('Revista atualizada com sucesso!');

        // Resetar o formulário e restaurar o comportamento original
        form.reset();
        const submitButton = form.querySelector('button[type="submit"]');
        if (submitButton) {
            submitButton.textContent = 'Cadastrar Revista';
        }

        // Remover o campo de ID
        const idField = form.querySelector('input[name="id"]');
        if (idField) {
            form.removeChild(idField);
        }

        // Restaurar o evento original
        form.addEventListener('submit', cadastrarRevista);

        // Recarregar a lista
        carregarRevistas();
    } catch (error) {
        console.error('Erro ao atualizar revista:', error);
        alert(`Erro ao atualizar revista: ${error.message}`);
    }
}
