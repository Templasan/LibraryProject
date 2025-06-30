using LibraryProject.Data;
using LibraryProject.Domain.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace LibraryProject.API.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class EmprestimosController : ControllerBase
    {
        private readonly LibraryContext _context;

        public EmprestimosController(LibraryContext context)
        {
            _context = context;
        }

        private int? GetUsuarioId()
        {
            var idStr = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub");
            return int.TryParse(idStr, out var id) ? id : (int?)null;
        }

        [HttpPost]
        public async Task<IActionResult> RealizarEmprestimo([FromBody] EmprestimoDTO dto)
        {
            if (dto == null || dto.ItemBibliotecaId <= 0)
                return BadRequest(new { message = "Dados inválidos para empréstimo." });

            var usuarioId = GetUsuarioId();
            if (!usuarioId.HasValue)
                return Unauthorized(new { message = "Usuário não autenticado." });

            var item = await _context.ItemBiblioteca.FirstOrDefaultAsync(i => i.Id == dto.ItemBibliotecaId);
            if (item == null)
                return BadRequest(new { message = "Item não encontrado." });

            if (!item.Disponivel)
                return BadRequest(new { message = "Item não está disponível para empréstimo." });

            // Cria o registro do empréstimo, controlando as datas aqui
            var emprestimo = new Emprestimo
            {
                ItemBibliotecaId = dto.ItemBibliotecaId,
                UsuarioId = usuarioId.Value,
                DataEmprestimo = DateTime.UtcNow,
                DataPrevistaDevolucao = DateTime.UtcNow.AddDays(dto.DiasPrazo > 0 ? dto.DiasPrazo : 15)
            };

            // Marca o item como indisponível, mas não mexe em datas/usuário do item
            item.Disponivel = false;

            _context.Emprestimo.Add(emprestimo);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Empréstimo realizado com sucesso!" });
        }

        [HttpPost("Devolver/{id}")]
        public async Task<IActionResult> DevolverEmprestimo(int id)
        {
            var emprestimo = await _context.Emprestimo
                .Include(e => e.Item)
                .FirstOrDefaultAsync(e => e.Id == id && e.DataDevolucao == null);

            if (emprestimo == null)
                return NotFound(new { message = "Empréstimo não encontrado ou já devolvido." });

            emprestimo.DataDevolucao = DateTime.UtcNow;

            // Só marca o item como disponível, sem mexer em datas
            var item = emprestimo.Item;
            item.Disponivel = true;

            await _context.SaveChangesAsync();
            return Ok(new { message = "Item devolvido com sucesso!" });
        }

        public class EmprestimoDTO
        {
            public int ItemBibliotecaId { get; set; }
            public int DiasPrazo { get; set; }
        }

        [HttpGet]
        public async Task<IActionResult> GetMeusEmprestimos()
        {
            var usuarioId = GetUsuarioId();
            if (!usuarioId.HasValue)
                return Unauthorized(new { message = "Usuário não autenticado." });

            var emprestimos = await _context.Emprestimo
                .Include(e => e.Item)
                .Where(e => e.UsuarioId == usuarioId.Value)
                .OrderByDescending(e => e.DataEmprestimo)
                .Select(e => new {
                    id = e.Id,
                    tituloItem = e.Item.Titulo,
                    dataEmprestimo = e.DataEmprestimo,
                    dataPrevistaDevolucao = e.DataPrevistaDevolucao,
                    dataDevolucao = e.DataDevolucao
                })
                .ToListAsync();

            return Ok(emprestimos);
        }
    }
}