using LibraryProject.Data;
using LibraryProject.Domain.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace LibraryProject.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class BuscaController : ControllerBase
    {
        private readonly LibraryContext _context;

        public BuscaController(LibraryContext context)
        {
            _context = context;
        }

        // POST: api/Busca
        [HttpPost]
        public async Task<ActionResult<BuscaResultado>> BuscaAvancada(BuscaParametros parametros)
        {
            IEnumerable<ItemBiblioteca> itens;

            // Busca por termo: cada tipo separado, depois une em memória
            if (!string.IsNullOrWhiteSpace(parametros.Termo))
            {
                var livros = await _context.Set<Livro>()
                    .Where(l => l.Titulo.Contains(parametros.Termo) || l.Autor.Contains(parametros.Termo))
                    .ToListAsync();

                var revistas = await _context.Set<Revista>()
                    .Where(r => r.Titulo.Contains(parametros.Termo) || r.Edicao.Contains(parametros.Termo))
                    .ToListAsync();

                var outros = await _context.Set<ItemBiblioteca>()
                    .Where(i => !(i is Livro) && !(i is Revista) && i.Titulo.Contains(parametros.Termo))
                    .ToListAsync();

                itens = livros.Cast<ItemBiblioteca>()
                    .Concat(revistas)
                    .Concat(outros);
            }
            else
            {
                itens = await _context.Set<ItemBiblioteca>().ToListAsync();
            }

            // Filtros adicionais em memória
            if (parametros.AnoPublicacao.HasValue)
                itens = itens.Where(i => i.AnoPublicacao == parametros.AnoPublicacao.Value);

            if (parametros.Disponivel.HasValue)
                itens = itens.Where(i => i.Disponivel == parametros.Disponivel.Value);

            if (parametros.CategoriaId.HasValue)
            {
                var itemIds = _context.Set<ItemCategoria>()
                    .Where(ic => ic.CategoriaId == parametros.CategoriaId.Value)
                    .Select(ic => ic.ItemBibliotecaId)
                    .ToHashSet();
                itens = itens.Where(i => itemIds.Contains(i.Id));
            }

            // Corrige paginação para evitar valores inválidos
            int pagina = parametros.Pagina > 0 ? parametros.Pagina : 1;
            int itensPorPagina = parametros.ItensPorPagina > 0 ? parametros.ItensPorPagina : 10;

            // Ordenação em memória
            switch (parametros.OrdenarPor?.ToLower())
            {
                case "titulo":
                    itens = parametros.OrdemCrescente
                        ? itens.OrderBy(i => i.Titulo)
                        : itens.OrderByDescending(i => i.Titulo);
                    break;
                case "ano":
                    itens = parametros.OrdemCrescente
                        ? itens.OrderBy(i => i.AnoPublicacao)
                        : itens.OrderByDescending(i => i.AnoPublicacao);
                    break;
                case "editora":
                    itens = parametros.OrdemCrescente
                        ? itens.OrderBy(i => i.Editora)
                        : itens.OrderByDescending(i => i.Editora);
                    break;
                default:
                    itens = itens.OrderBy(i => i.Id);
                    break;
            }

            int total = itens.Count();

            var itensPaginados = itens
                .Skip((pagina - 1) * itensPorPagina)
                .Take(itensPorPagina)
                .ToList();

            return new BuscaResultado
            {
                Itens = itensPaginados,
                Total = total,
                Pagina = pagina,
                ItensPorPagina = itensPorPagina,
                TotalPaginas = (int)Math.Ceiling(total / (double)itensPorPagina)
            };
        }
    }

    public class BuscaParametros
    {
        public string Termo { get; set; }
        public int? AnoPublicacao { get; set; }
        public bool? Disponivel { get; set; }
        public int? CategoriaId { get; set; }
        public string OrdenarPor { get; set; } = "titulo";
        public bool OrdemCrescente { get; set; } = true;
        public int Pagina { get; set; } = 1;
        public int ItensPorPagina { get; set; } = 10;
    }

    public class BuscaResultado
    {
        public IEnumerable<ItemBiblioteca> Itens { get; set; }
        public int Total { get; set; }
        public int Pagina { get; set; }
        public int ItensPorPagina { get; set; }
        public int TotalPaginas { get; set; }
    }
}