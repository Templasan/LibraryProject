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
    public class ReservasController : ControllerBase
    {
        private readonly LibraryContext _context;

        public ReservasController(LibraryContext context)
        {
            _context = context;
        }

        // Utilitário para pegar o id do usuário autenticado
        private int? GetUsuarioId()
        {
            var idStr = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub");
            if (int.TryParse(idStr, out var id))
                return id;
            return null;
        }

        // POST: api/Reservas
        [HttpPost]
        public async Task<IActionResult> Reservar([FromBody] RealizarReservaDTO dto)
        {
            if (dto == null || dto.ItemId <= 0)
                return BadRequest(new { message = "Dados inválidos para reserva." });

            var usuarioId = GetUsuarioId();
            if (!usuarioId.HasValue)
                return Unauthorized(new { message = "Usuário não autenticado." });

            var item = await _context.ItemBiblioteca.FirstOrDefaultAsync(i => i.Id == dto.ItemId);
            if (item == null)
                return BadRequest(new { message = "Item não encontrado." });

            if (item.Disponivel)
                return BadRequest(new { message = "O item está disponível, não é necessário reservar." });

            // Checa se usuário já tem reserva ativa para o mesmo item
            bool jaReservou = await _context.Reservas
                .AnyAsync(r => r.ItemBibliotecaId == dto.ItemId && r.UsuarioId == usuarioId.Value && r.Ativa);
            if (jaReservou)
                return BadRequest(new { message = "Você já possui uma reserva ativa para este item." });

            // Cria a reserva (entra na fila)
            var reserva = new Reserva
            {
                ItemBibliotecaId = dto.ItemId,
                UsuarioId = usuarioId.Value,
                DataReserva = DateTime.UtcNow,
                Ativa = true
            };
            _context.Reservas.Add(reserva);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Reserva realizada com sucesso! Você está na fila de espera." });
        }

        // (Opcional) GET: api/Reservas/Minhas
        [HttpGet("Minhas")]
        public async Task<ActionResult<IEnumerable<ReservaDTO>>> MinhasReservas()
        {
            var usuarioId = GetUsuarioId();
            if (!usuarioId.HasValue)
                return Unauthorized(new { message = "Usuário não autenticado." });

            var reservas = await _context.Reservas
                .Include(r => r.Item)
                .Where(r => r.UsuarioId == usuarioId.Value && r.Ativa)
                .OrderBy(r => r.DataReserva)
                .Select(r => new ReservaDTO
                {
                    Id = r.Id,
                    ItemId = r.ItemBibliotecaId,
                    Titulo = r.Item.Titulo,
                    DataReserva = r.DataReserva
                })
                .ToListAsync();

            return reservas;
        }

        // DTOs
        public class RealizarReservaDTO
        {
            public int ItemId { get; set; }
        }

        public class ReservaDTO
        {
            public int Id { get; set; }
            public int ItemId { get; set; }
            public string Titulo { get; set; }
            public DateTime DataReserva { get; set; }
        }
    }
}