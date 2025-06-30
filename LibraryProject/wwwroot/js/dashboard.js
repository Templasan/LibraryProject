// dashboard.js
// Versão para uso em browser tradicional SEM import/export
// Espera-se que a constante API_URL (base da API) já esteja definida em outro script, assim como o axios já foi importado

function getAuthHeaders() {
    const token = localStorage.getItem('jwtToken');
    return { Authorization: `Bearer ${token}` };
}

// 1. Contadores gerais (livros, revistas, itens, empréstimos, atrasos etc)
async function fetchResumo() {
    const { data } = await axios.get(`${API_URL}/Dashboard/Resumo`, { headers: getAuthHeaders() });
    return data;
}

// 2. Itens por categoria
async function fetchItensPorCategoria() {
    const { data } = await axios.get(`${API_URL}/Dashboard/ItensPorCategoria`, { headers: getAuthHeaders() });
    return data;
}

// 3. Empréstimos por período (pode receber filtros de data)
async function fetchEmprestimosPorPeriodo(inicio = null, fim = null) {
    const params = {};
    if (inicio) params.inicio = inicio;
    if (fim) params.fim = fim;
    const { data } = await axios.get(`${API_URL}/Dashboard/EmprestimosPorPeriodo`, { params, headers: getAuthHeaders() });
    return data;
}

// 4. Itens mais emprestados (com limite, default 10)
async function fetchItensMaisEmprestados(limite = 10) {
    const { data } = await axios.get(`${API_URL}/Dashboard/ItensMaisEmprestados`, {
        params: { limite },
        headers: getAuthHeaders()
    });
    return data;
}

// 5. Empréstimos atrasados (relatório detalhado)
async function fetchEmprestimosAtrasados() {
    const { data } = await axios.get(`${API_URL}/Dashboard/EmprestimosAtrasados`, { headers: getAuthHeaders() });
    return data;
}

// Exemplo de função agregadora para carregar todos os dados do painel (opcional)
async function fetchDashboardData({ inicio = null, fim = null, limiteMaisEmprestados = 10 } = {}) {
    const [resumo, categorias, porPeriodo, maisEmprestados, atrasados] = await Promise.all([
        fetchResumo(),
        fetchItensPorCategoria(),
        fetchEmprestimosPorPeriodo(inicio, fim),
        fetchItensMaisEmprestados(limiteMaisEmprestados),
        fetchEmprestimosAtrasados()
    ]);
    return {
        resumo,
        categorias,
        porPeriodo,
        maisEmprestados,
        atrasados
    };
}

// ----------- EXEMPLO DE USO INTEGRADO COM O DASHBOARD HTML -----------

// Carregar Resumo
async function carregarResumo() {
    const resumo = await fetchResumo();
    document.getElementById('totalLivros').textContent = resumo.totalLivros;
    document.getElementById('totalRevistas').textContent = resumo.totalRevistas;
    document.getElementById('totalItens').textContent = resumo.totalItens;
    document.getElementById('emprestimosAtivos').textContent = resumo.emprestimosAtivos;
    document.getElementById('emprestimosAtrasados').textContent = resumo.emprestimosAtrasados;
}

// Carregar Itens por Categoria (gráfico)
async function carregarCategorias() {
    const categorias = await fetchItensPorCategoria();
    const labels = categorias.map(c => c.categoriaNome);
    const dados = categorias.map(c => c.totalItens);

    const ctx = document.getElementById('graficoCategorias').getContext('2d');
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels,
            datasets: [{
                label: 'Total de Itens',
                data: dados,
                backgroundColor: '#4e73df',
            }],
        },
        options: {
            responsive: true,
            plugins: { legend: { display: false } }
        }
    });
}

// Carregar Empréstimos por Período (gráfico)
let chartPeriodo = null;
async function carregarEmprestimosPorPeriodo(inicio = '', fim = '') {
    const periodos = await fetchEmprestimosPorPeriodo(inicio, fim);

    const labels = periodos.map(p => p.periodo);
    const dados = periodos.map(p => p.total);

    const ctx = document.getElementById('graficoEmprestimosPeriodo').getContext('2d');
    if (chartPeriodo) chartPeriodo.destroy();
    chartPeriodo = new Chart(ctx, {
        type: 'line',
        data: {
            labels,
            datasets: [{
                label: 'Empréstimos',
                data: dados,
                borderColor: '#1cc88a',
                fill: false
            }]
        },
        options: {
            responsive: true,
            plugins: { legend: { display: false } }
        }
    });
}

// Carregar Itens Mais Emprestados (tabela)
async function carregarMaisEmprestados() {
    const itens = await fetchItensMaisEmprestados(10);
    const tbody = document.querySelector('#tabelaMaisEmprestados tbody');
    tbody.innerHTML = '';
    itens.forEach((item, idx) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${idx + 1}</td>
            <td>${item.titulo}</td>
            <td>${item.totalEmprestimos}</td>
        `;
        tbody.appendChild(tr);
    });
}

// Carregar Empréstimos Atrasados (tabela)
async function carregarEmprestimosAtrasados() {
    const atrasados = await fetchEmprestimosAtrasados();
    const tbody = document.querySelector('#tabelaAtrasados tbody');
    tbody.innerHTML = '';
    atrasados.forEach((e, idx) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${idx + 1}</td>
            <td>${e.titulo}</td>
            <td>${e.usuario}</td>
            <td>${(new Date(e.dataEmprestimo)).toLocaleDateString()}</td>
            <td>${(new Date(e.dataPrevistaDevolucao)).toLocaleDateString()}</td>
        `;
        tbody.appendChild(tr);
    });
}

// Filtro de período
document.addEventListener('DOMContentLoaded', () => {
    carregarResumo();
    carregarCategorias();
    carregarEmprestimosPorPeriodo();
    carregarMaisEmprestados();
    carregarEmprestimosAtrasados();

    const formPeriodo = document.getElementById('formPeriodo');
    if (formPeriodo) {
        formPeriodo.addEventListener('submit', e => {
            e.preventDefault();
            const inicio = document.getElementById('inicioPeriodo').value;
            const fim = document.getElementById('fimPeriodo').value;
            carregarEmprestimosPorPeriodo(inicio, fim);
        });
    }
});