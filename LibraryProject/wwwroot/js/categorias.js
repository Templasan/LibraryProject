document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('formCategoria');

    if (form) {
        // Cria campo oculto de ID se não existir
        if (!document.getElementById('categoriaId')) {
            const inputId = document.createElement('input');
            inputId.type = 'hidden';
            inputId.id = 'categoriaId';
            inputId.name = 'categoriaId';
            inputId.value = '0';
            form.prepend(inputId);
        }

        // Ajusta nome do campo "Nome"
        const inputNome = document.getElementById('categoriaNome');
        if (inputNome) {
            inputNome.name = 'Nome'; // apenas name precisa mudar, não o id
        }

        // Ajusta nome do campo "Descrição"
        const inputDescricao = document.getElementById('categoriaDescricao');
        if (inputDescricao) {
            inputDescricao.name = 'Descricao'; // apenas name
        }

        // Preenche a lista de livros
        carregarLivros();

        form.addEventListener('submit', salvarCategoria);
    }

    carregarCategorias();
});

// Função utilitária para requisições com token exceto GET
async function apiRequestComToken(url, method = 'GET', body = null) {
    const token = localStorage.getItem('jwtToken');
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

// Carrega todos os livros disponíveis
async function carregarLivros() {
    try {
        const response = await fetch(`${API_URL}/Livros`);
        const livros = await response.json();

        const livrosSelect = document.getElementById('livrosSelecionados');
        livrosSelect.innerHTML = '';

        livros.forEach(livro => {
            const option = document.createElement('option');
            option.value = livro.id;
            option.textContent = livro.titulo;
            livrosSelect.appendChild(option);
        });
    } catch (error) {
        console.error('Erro ao carregar livros:', error);
        alert('Erro ao carregar livros.');
    }
}

// Cria ou atualiza uma categoria com os livros associados
async function salvarCategoria(event) {
    event.preventDefault();

    const id = parseInt(document.getElementById('categoriaId').value);
    const nome = document.getElementById('categoriaNome').value.trim();
    const descricao = document.getElementById('categoriaDescricao')?.value.trim() || '';

    if (!nome) {
        alert('Nome da categoria é obrigatório.');
        return;
    }

    const livrosSelecionados = Array.from(document.getElementById('livrosSelecionados').selectedOptions)
        .map(option => option.value);

    const itensCategorias = livrosSelecionados.map(livroId => ({
        itemBibliotecaId: livroId,
        categoriaId: id > 0 ? id : 0
    }));

    const metodo = id > 0 ? 'PUT' : 'POST';
    const url = id > 0 ? `${API_URL}/Categorias/${id}` : `${API_URL}/Categorias`;

    const categoriaData = { nome, descricao, itensCategorias };
    if (id > 0) categoriaData.id = id;

    try {
        if (id > 0) {
            for (let livroId of livrosSelecionados) {
                const responseVerificar = await fetch(`${API_URL}/Livros/${livroId}/Categorias`);
                if (!responseVerificar.ok) throw new Error('Erro ao verificar categorias do livro');
                const categoriasDoLivro = await responseVerificar.json();
                const categoriaAnterior = categoriasDoLivro.find(c => c.id !== id);
                if (categoriaAnterior) {
                    await removerLivroDaCategoria(livroId, categoriaAnterior.id);
                }
            }
        }

        // Usa apiRequestComToken para POST/PUT (envia token)
        const response = await apiRequestComToken(url, metodo, categoriaData);

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.message || 'Erro ao salvar categoria');
        }

        alert(`Categoria ${id > 0 ? 'atualizada' : 'criada'} com sucesso!`);
        document.getElementById('formCategoria').reset();
        document.getElementById('categoriaId').value = '0';
        carregarCategorias();
    } catch (error) {
        console.error('Erro ao salvar categoria:', error);
        alert(`Erro: ${error.message}`);
    }
}

// Função para remover um livro de uma categoria
async function removerLivroDaCategoria(livroId, categoriaId) {
    try {
        // DELETE: usa apiRequestComToken (envia token)
        const responseRemover = await apiRequestComToken(`${API_URL}/Categorias/${categoriaId}/Itens/${livroId}`, 'DELETE');
        if (!responseRemover.ok) throw new Error('Erro ao remover livro da categoria');
        console.log(`Livro ${livroId} removido da categoria ${categoriaId}`);
    } catch (error) {
        console.error('Erro ao remover livro:', error);
    }
}

// Carrega todas as categorias
async function carregarCategorias() {
    try {
        const response = await fetch(`${API_URL}/Categorias`);
        const categorias = await response.json();

        const lista = document.getElementById('listaCategorias');
        lista.innerHTML = '';

        if (categorias.length === 0) {
            lista.innerHTML = '<p>Nenhuma categoria encontrada.</p>';
            return;
        }

        categorias.forEach(categoria => {
            const item = document.createElement('div');
            item.className = 'categoria-item';
            item.innerHTML = `
                <strong>${categoria.nome}</strong><br/>
                <em>${categoria.descricao ?? ''}</em><br/>
                <button onclick="editarCategoria(${categoria.id})">Editar</button>
                <button onclick="deletarCategoria(${categoria.id})">Excluir</button>
                <button onclick="carregarItensPorCategoria(${categoria.id})">Ver Itens</button>
                <div id="itensCategoria-${categoria.id}" class="itens-categoria" style="margin-left:20px;"></div>
            `;
            lista.appendChild(item);
        });
    } catch (error) {
        console.error('Erro ao carregar categorias:', error);
        alert('Erro ao carregar categorias.');
    }
}

// Carrega os itens associados à categoria
async function carregarItensPorCategoria(categoriaId) {
    try {
        const response = await fetch(`${API_URL}/Categorias/${categoriaId}/Itens`);
        if (!response.ok) throw new Error('Erro ao buscar itens da categoria');
        const itens = await response.json();

        const container = document.getElementById(`itensCategoria-${categoriaId}`);
        container.innerHTML = '';

        if (itens.length === 0) {
            container.innerHTML = '<p>Nenhum item associado.</p>';
            return;
        }

        itens.forEach(item => {
            const div = document.createElement('div');
            div.textContent = `${item.titulo} `;

            const btnRemover = document.createElement('button');
            btnRemover.textContent = 'Remover';
            btnRemover.onclick = () => removerItemCategoria(categoriaId, item.id);
            div.appendChild(btnRemover);

            container.appendChild(div);
        });

    } catch (error) {
        console.error('Erro ao carregar itens da categoria:', error);
        alert('Erro ao carregar itens da categoria.');
    }
}

// Remove um item da categoria
async function removerItemCategoria(categoriaId, itemId) {
    if (!confirm('Confirma remoção deste item da categoria?')) return;

    try {
        // DELETE: usa apiRequestComToken (envia token)
        const response = await apiRequestComToken(`${API_URL}/Categorias/${categoriaId}/Itens/${itemId}`, 'DELETE');
        if (!response.ok) throw new Error('Erro ao remover item da categoria');
        alert('Item removido da categoria com sucesso!');
        carregarItensPorCategoria(categoriaId);
    } catch (error) {
        console.error('Erro ao remover item da categoria:', error);
        alert('Erro ao remover item da categoria.');
    }
}