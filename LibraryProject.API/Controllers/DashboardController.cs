using LibraryProject.Data;
using LibraryProject.Domain.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace LibraryProject.API.Controllers
{
    [Authorize(Roles = "Admin")]
    [ApiController]
    [Route("api/[controller]")]
    public class DashboardController : ControllerBase
    {
        private readonly LibraryContext _context;

        public DashboardController(LibraryContext context)
        {
            _context = context;
        }

        // GET: api/Dashboard/Resumo
        [HttpGet("Resumo")]
        public async Task<ActionResult<DashboardResumo>> GetResumo()
        {
            var totalLivros = await _context.Set<Livro>().CountAsync();
            var totalRevistas = await _context.Set<Revista>().CountAsync();
            var totalEmprestimos = await _context.Emprestimo.CountAsync();
            var emprestimosAtivos = await _context.Emprestimo
                .CountAsync(e => e.DataDevolucao == null);
            var emprestimosAtrasados = await _context.Emprestimo
                .CountAsync(e => e.DataDevolucao == null &&
                                 e.DataPrevistaDevolucao < DateTime.Now);

            return new DashboardResumo
            {
                TotalLivros = totalLivros,
                TotalRevistas = totalRevistas,
                TotalItens = totalLivros + totalRevistas,
                TotalEmprestimos = totalEmprestimos,
                EmprestimosAtivos = emprestimosAtivos,
                EmprestimosAtrasados = emprestimosAtrasados
            };
        }

        // GET: api/Dashboard/ItensPorCategoria
        [HttpGet("ItensPorCategoria")]
        public async Task<ActionResult<IEnumerable<CategoriaTotalDTO>>> GetItensPorCategoria()
        {
            var categorias = await _context.Categoria
                .Select(c => new CategoriaTotalDTO
                {
                    CategoriaId = c.Id,
                    CategoriaNome = c.Nome,
                    TotalItens = _context.Set<ItemCategoria>()
                        .Count(ic => ic.CategoriaId == c.Id)
                })
                .ToListAsync();

            return categorias;
        }

        // GET: api/Dashboard/EmprestimosPorPeriodo
        [HttpGet("EmprestimosPorPeriodo")]
        public async Task<ActionResult<IEnumerable<EmprestimosPorPeriodoDTO>>> GetEmprestimosPorPeriodo(
            [FromQuery] DateTime? inicio, [FromQuery] DateTime? fim)
        {
            var dataInicio = inicio ?? DateTime.Now.AddMonths(-6);
            var dataFim = fim ?? DateTime.Now;

            var emprestimos = await _context.Emprestimo
                .Where(e => e.DataEmprestimo >= dataInicio &&
                            e.DataEmprestimo <= dataFim)
                .GroupBy(e => new
                {
                    Ano = e.DataEmprestimo.Year,
                    Mes = e.DataEmprestimo.Month
                })
                .Select(g => new EmprestimosPorPeriodoDTO
                {
                    Ano = g.Key.Ano,
                    Mes = g.Key.Mes,
                    Total = g.Count()
                })
                .OrderBy(e => e.Ano)
                .ThenBy(e => e.Mes)
                .ToListAsync();

            return emprestimos;
        }

        // GET: api/Dashboard/ItensMaisEmprestados
        [HttpGet("ItensMaisEmprestados")]
        public async Task<ActionResult<IEnumerable<ItemMaisEmprestadoDTO>>> GetItensMaisEmprestados(
            [FromQuery] int limite = 10)
        {
            var itensMaisEmprestados = await _context.Emprestimo
                .GroupBy(e => e.ItemBibliotecaId)
                .Select(g => new ItemMaisEmprestadoDTO
                {
                    ItemId = g.Key,
                    Titulo = g.First().Item.Titulo,
                    TotalEmprestimos = g.Count()
                })
                .OrderByDescending(i => i.TotalEmprestimos)
                .Take(limite)
                .ToListAsync();

            return itensMaisEmprestados;
        }

        // GET: api/Dashboard/EmprestimosAtrasados
        [HttpGet("EmprestimosAtrasados")]
        public async Task<ActionResult<IEnumerable<EmprestimoAtrasadoDTO>>> GetEmprestimosAtrasados()
        {
            var atrasados = await _context.Emprestimo
                .Where(e => e.DataDevolucao == null && e.DataPrevistaDevolucao < DateTime.Now)
                .Select(e => new EmprestimoAtrasadoDTO
                {
                    EmprestimoId = e.Id,
                    ItemId = e.ItemBibliotecaId,
                    Titulo = e.Item.Titulo,
                    Usuario = e.UsuarioId, // Aqui é string, conforme sua entidade Emprestimo
                    DataEmprestimo = e.DataEmprestimo,
                    DataPrevistaDevolucao = e.DataPrevistaDevolucao
                })
                .ToListAsync();

            return atrasados;
        }
    }

    // DTOs e modelos auxiliares

    public class DashboardResumo
    {
        public int TotalLivros { get; set; }
        public int TotalRevistas { get; set; }
        public int TotalItens { get; set; }
        public int TotalEmprestimos { get; set; }
        public int EmprestimosAtivos { get; set; }
        public int EmprestimosAtrasados { get; set; }
    }

    public class CategoriaTotalDTO
    {
        public int CategoriaId { get; set; }
        public string CategoriaNome { get; set; }
        public int TotalItens { get; set; }
    }

    public class EmprestimosPorPeriodoDTO
    {
        public int Ano { get; set; }
        public int Mes { get; set; }
        public int Total { get; set; }
        public string Periodo => $"{Ano}/{Mes:D2}";
    }

    public class ItemMaisEmprestadoDTO
    {
        public int ItemId { get; set; }
        public string Titulo { get; set; }
        public int TotalEmprestimos { get; set; }
    }

    public class EmprestimoAtrasadoDTO
    {
        public int EmprestimoId { get; set; }
        public int ItemId { get; set; }
        public string Titulo { get; set; }
        public int Usuario { get; set; } // <-- CORRETO, igual ao model Emprestimo
        public DateTime DataEmprestimo { get; set; }
        public DateTime DataPrevistaDevolucao { get; set; }
    }
}