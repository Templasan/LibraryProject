// Utilitário para obter o token JWT
function getToken() {
    return localStorage.getItem('token') || sessionStorage.getItem('token') || '';
}

// Centraliza o tratamento de sessão expirada
function verificarSessao() {
    const token = getToken();
    if (!token) {
        alert('Sessão expirada. Faça login novamente.');
        // window.location.href = '/login.html'; // descomente para redirecionar
        return false;
    }
    return true;
}

document.addEventListener('DOMContentLoaded', () => {
    if (verificarSessao()) {
        carregarItensDisponiveis();
        carregarEmprestimos('todos');
    }

    // Evento de envio do formulário
    const form = document.getElementById('formEmprestimo');
    if (form) {
        form.addEventListener('submit', realizarEmprestimo);
    }

    // Tabs
    const tabButtons = document.querySelectorAll('.tab-button');
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            tabButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            if (verificarSessao()) carregarEmprestimos(button.dataset.tab);
        });
    });
});

// Carregar itens disponíveis para empréstimo
async function carregarItensDisponiveis() {
    if (!verificarSessao()) return;
    try {
        const token = getToken();
        const headers = { Authorization: `Bearer ${token}` };

        const response = await fetch(`${API_URL}/Livros`, { headers });
        if (response.status === 401) { verificarSessao(); return; }
        const livros = await response.json();

        const responseRevistas = await fetch(`${API_URL}/Revistas`, { headers });
        if (responseRevistas.status === 401) { verificarSessao(); return; }
        const revistas = await responseRevistas.json();

        const select = document.getElementById('itemId');
        select.innerHTML = '<option value="">Selecione um item...</option>';

        const optgroupLivros = document.createElement('optgroup');
        optgroupLivros.label = 'Livros';
        livros.filter(l => l.disponivel).forEach(livro => {
            const option = document.createElement('option');
            option.value = livro.id;
            option.textContent = `${livro.titulo} (${livro.autor})`;
            optgroupLivros.appendChild(option);
        });
        select.appendChild(optgroupLivros);

        const optgroupRevistas = document.createElement('optgroup');
        optgroupRevistas.label = 'Revistas';
        revistas.filter(r => r.disponivel).forEach(revista => {
            const option = document.createElement('option');
            option.value = revista.id;
            option.textContent = `${revista.titulo} (${revista.edicao})`;
            optgroupRevistas.appendChild(option);
        });
        select.appendChild(optgroupRevistas);

    } catch (error) {
        console.error('Erro ao carregar itens disponíveis:', error);
        alert('Erro ao carregar itens disponíveis.');
    }
}

// Carregar lista de empréstimos
async function carregarEmprestimos(tipo) {
    if (!verificarSessao()) return;
    try {
        let url = `${API_URL}/Emprestimos`;
        if (tipo === 'ativos') url = `${API_URL}/Emprestimos/Ativos`;
        else if (tipo === 'atrasados') url = `${API_URL}/Emprestimos/Atrasados`;

        const token = getToken();
        const headers = { Authorization: `Bearer ${token}` };

        const response = await fetch(url, { headers });
        if (response.status === 401) { verificarSessao(); return; }
        const emprestimos = await response.json();

        const listaEmprestimos = document.getElementById('listaEmprestimos');
        listaEmprestimos.innerHTML = '';

        if (!emprestimos.length) {
            listaEmprestimos.innerHTML = '<p>Nenhum empréstimo encontrado.</p>';
            return;
        }

        emprestimos.forEach(emprestimo => {
            const item = document.createElement('div');
            item.className = 'emprestimo-item';

            const dataEmprestimo = new Date(emprestimo.dataEmprestimo).toLocaleDateString('pt-BR');
            const dataPrevista = new Date(emprestimo.dataPrevistaDevolucao).toLocaleDateString('pt-BR');
            const dataDevolucao = emprestimo.dataDevolucao
                ? new Date(emprestimo.dataDevolucao).toLocaleDateString('pt-BR')
                : 'Não devolvido';

            const hoje = new Date();
            const dataPrevistaObj = new Date(emprestimo.dataPrevistaDevolucao);
            const atrasado = !emprestimo.dataDevolucao && hoje > dataPrevistaObj;

            item.innerHTML = `
                <h3>${emprestimo.tituloItem}</h3>
                <p><strong>Usuário:</strong> ${emprestimo.usuarioEmail ?? '-'}</p>
                <p><strong>Data do Empréstimo:</strong> ${dataEmprestimo}</p>
                <p><strong>Data Prevista de Devolução:</strong> ${dataPrevista}</p>
                <p><strong>Data de Devolução:</strong> ${dataDevolucao}</p>
                <p class="status ${atrasado ? 'atrasado' : emprestimo.dataDevolucao ? 'devolvido' : 'ativo'}">
                    ${atrasado ? 'Atrasado' : emprestimo.dataDevolucao ? 'Devolvido' : 'Ativo'}
                </p>
                ${!emprestimo.dataDevolucao ? `
                    <div class="acoes">
                        <button onclick="devolverEmprestimo(${emprestimo.id})">Devolver</button>
                    </div>
                ` : ''}
            `;
            listaEmprestimos.appendChild(item);
        });
    } catch (error) {
        console.error('Erro ao carregar empréstimos:', error);
        document.getElementById('listaEmprestimos').innerHTML =
            '<p>Erro ao carregar empréstimos. Verifique se a API está em execução.</p>';
    }
}

// Realizar empréstimo
async function realizarEmprestimo(event) {
    event.preventDefault();
    if (!verificarSessao()) return;

    const itemId = parseInt(document.getElementById('itemId').value);
    const diasPrazo = parseInt(document.getElementById('diasPrazo').value);

    // CORRIGIDO: enviar itemBibliotecaId para o backend!
    const emprestimo = { itemBibliotecaId: itemId, diasPrazo };

    try {
        const token = getToken();
        const response = await fetch(`${API_URL}/Emprestimos`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify(emprestimo)
        });

        if (response.status === 401) {
            verificarSessao();
            return;
        }

        // NOVA REGRA: Se for 409, item indisponível, perguntar sobre reserva
        if (response.status === 409) {
            const errorData = await response.json();
            if (confirm(`${errorData.message}\nDeseja reservar este item?`)) {
                await reservarItem(itemId);
            }
            return;
        }

        if (!response.ok) {
            let errorMessage = 'Erro ao realizar empréstimo';
            try {
                const text = await response.text();
                if (text) {
                    const errorData = JSON.parse(text);
                    errorMessage = errorData.message || errorMessage;
                }
            } catch (e) {
                // fallback para a mensagem padrão
            }
            throw new Error(errorMessage);
        }

        alert('Empréstimo realizado com sucesso!');
        document.getElementById('formEmprestimo').reset();
        carregarItensDisponiveis();
        carregarEmprestimos('todos');
    } catch (error) {
        console.error('Erro ao realizar empréstimo:', error);
        alert(`Erro ao realizar empréstimo: ${error.message}`);
    }
}

// Nova função: Reservar item
async function reservarItem(itemId) {
    try {
        const token = getToken();
        // CORRIGIDO: enviar itemBibliotecaId para o backend!
        const response = await fetch(`${API_URL}/Reservas`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({ itemBibliotecaId: itemId })
        });

        if (!response.ok) {
            let errorMessage = 'Erro ao reservar item';
            try {
                const text = await response.text();
                if (text) {
                    const errorData = JSON.parse(text);
                    errorMessage = errorData.message || errorMessage;
                }
            } catch (e) {
                // fallback para a mensagem padrão
            }
            throw new Error(errorMessage);
        }

        alert('Reserva realizada com sucesso! Você está na fila de espera.');
    } catch (error) {
        alert(`Erro ao reservar item: ${error.message}`);
    }
}

// Devolver empréstimo
async function devolverEmprestimo(id) {
    if (!verificarSessao()) return;
    if (confirm('Confirmar a devolução deste item?')) {
        try {
            const token = getToken();
            const response = await fetch(`${API_URL}/Emprestimos/${id}/Devolver`, {
                method: 'PUT',
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.status === 401) {
                verificarSessao();
                return;
            }

            if (!response.ok) {
                throw new Error('Erro ao devolver item');
            }

            alert('Item devolvido com sucesso!');
            carregarEmprestimos('todos');
            carregarItensDisponiveis();
        } catch (error) {
            console.error('Erro ao devolver item:', error);
            alert('Erro ao devolver item.');
        }
    }
}