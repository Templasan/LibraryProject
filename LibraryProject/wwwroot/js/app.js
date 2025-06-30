// Arquivo: js/app.js
// Configurações globais e utilitários

console.log('app.js carregado!');

// URL base da API
const API_URL = 'https://localhost:50603/api';

// Função para exibir mensagens de erro
function showError(message) {
    alert(`Erro: ${message}`);
    console.error(message);
}

// Função para formatar datas
function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
}

// Função para verificar se a API está acessível
async function checkApiStatus() {
    try {
        const response = await fetch(`${API_URL}/Livros`);
        if (!response.ok) {
            throw new Error(`Status: ${response.status}`);
        }
        console.log('API está acessível');
        return true;
    } catch (error) {
        console.error('API não está acessível:', error);
        document.querySelectorAll('.item-list').forEach(el => {
            el.innerHTML = '<p class="error">Não foi possível conectar à API. Verifique se o servidor está em execução.</p>';
        });
        return false;
    }
}

// Verificar API ao carregar a página
document.addEventListener('DOMContentLoaded', checkApiStatus);
