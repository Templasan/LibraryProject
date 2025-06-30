document.addEventListener('DOMContentLoaded', () => {
    const formBusca = document.getElementById('formBusca');
    if (formBusca) {
        formBusca.addEventListener('submit', realizarBusca);
    }
});

async function realizarBusca(event) {
    event.preventDefault();

    // Coleta os valores dos campos do formulário
    const termoBusca = document.getElementById('termoBusca').value.trim();
    const anoBusca = document.getElementById('anoBusca').value;
    const disponivelCheckbox = document.getElementById('disponivelBusca');
    const categoriaBusca = document.getElementById('categoriaBusca').value;
    const ordenarPor = document.getElementById('ordenarPor').value || 'titulo';
    const ordemCrescente = document.getElementById('ordemCrescente').checked;
    const pagina = 1;
    const itensPorPagina = 10;

    // Sempre envia todos os campos, preenchidos ou null, EM camelCase!
    const parametros = {
        termo: termoBusca || null,
        anoPublicacao: anoBusca ? parseInt(anoBusca) : null,
        disponivel: disponivelCheckbox && disponivelCheckbox.checked ? true : null,
        categoriaId: categoriaBusca ? parseInt(categoriaBusca) : null,
        ordenarPor: ordenarPor,
        ordemCrescente: ordemCrescente,
        pagina: pagina,
        itensPorPagina: itensPorPagina
    };

    try {
        const resposta = await fetch(`${API_URL}/Busca`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(parametros),
        });

        if (!resposta.ok) {
            throw new Error(`Erro HTTP: ${resposta.status}`);
        }

        const resultado = await resposta.json();
        console.log("Resultado recebido:", resultado); // debug
        exibirResultadosBusca(resultado);
    } catch (error) {
        alert('Erro ao realizar a busca. Tente novamente.');
        console.error('Erro na busca:', error);
    }
}

function exibirResultadosBusca(resultado) {
    const listaResultados = document.getElementById('listaResultados');
    listaResultados.innerHTML = '';

    if (!resultado.itens || resultado.itens.length === 0) {
        listaResultados.innerHTML = '<p>Nenhum item encontrado.</p>';
        return;
    }

    resultado.itens.forEach(item => {
        const itemElement = document.createElement('div');
        itemElement.className = 'item-busca';

        // Adiciona a imagem se existir o campo capaUrl
        const capaImg = item.capaUrl
            ? `<img src="${item.capaUrl}" alt="Capa" class="capa-busca" style="max-width:80px; margin-bottom:8px; display:block;">`
            : '';

        itemElement.innerHTML = `
            ${capaImg}
            <h3>${item.titulo || '(Sem título)'}</h3>
            <p><strong>Ano de Publicação:</strong> ${item.anoPublicacao || '-'}</p>
            <p><strong>Editora:</strong> ${item.editora || '-'}</p>
            <p><strong>Disponível:</strong> ${item.disponivel ? 'Sim' : 'Não'}</p>
        `;

        listaResultados.appendChild(itemElement);
    });

    // Paginação (camelCase também)
    const paginacao = document.getElementById('paginacao');
    paginacao.innerHTML = `
        Página ${resultado.pagina} de ${resultado.totalPaginas} |
        Total de Itens: ${resultado.total}
    `;
}