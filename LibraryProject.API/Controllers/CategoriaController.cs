using LibraryProject.Data;
using LibraryProject.Domain.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace LibraryProject.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CategoriasController : ControllerBase
    {
        private readonly LibraryContext _context;

        public CategoriasController(LibraryContext context)
        {
            _context = context;
        }

        // GET: api/Categorias
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Categoria>>> GetCategorias()
        {
            return await _context.Categoria.ToListAsync();
        }

        // GET: api/Categorias/5
        [HttpGet("{id}")]
        public async Task<ActionResult<Categoria>> GetCategoria(int id)
        {
            var categoria = await _context.Categoria.FindAsync(id);
            if (categoria == null)
                return NotFound();

            return categoria;
        }

        // GET: api/Categorias/5/Itens
        [HttpGet("{id}/Itens")]
        public async Task<ActionResult<IEnumerable<ItemBiblioteca>>> GetItensPorCategoria(int id)
        {
            var categoria = await _context.Categoria.FindAsync(id);
            if (categoria == null)
                return NotFound();

            var itens = await _context.Set<ItemBiblioteca>()
                .Join(_context.Set<ItemCategoria>(),
                      item => item.Id,
                      ic => ic.ItemBibliotecaId,
                      (item, ic) => new { Item = item, ic.CategoriaId })
                .Where(x => x.CategoriaId == id)
                .Select(x => x.Item)
                .ToListAsync();

            return itens;
        }

        // POST: api/Categorias
        [Authorize(Roles = "Admin")]
        [HttpPost]
        public async Task<ActionResult<Categoria>> PostCategoria(Categoria categoria)
        {
            _context.Categoria.Add(categoria);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetCategoria), new { id = categoria.Id }, categoria);
        }

        // PUT: api/Categorias/5
        [Authorize(Roles = "Admin")]
        [HttpPut("{id}")]
        public async Task<IActionResult> PutCategoria(int id, Categoria categoria)
        {
            if (id != categoria.Id)
                return BadRequest();

            _context.Entry(categoria).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!CategoriaExists(id))
                    return NotFound();
                else
                    throw;
            }

            return NoContent();
        }

        // DELETE: api/Categorias/5
        [Authorize(Roles = "Admin")]
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteCategoria(int id)
        {
            var categoria = await _context.Categoria.FindAsync(id);
            if (categoria == null)
                return NotFound();

            _context.Categoria.Remove(categoria);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        // POST: api/Categorias/5/Itens/3
        [Authorize(Roles = "Admin")]
        [HttpPost("{categoriaId}/Itens/{itemId}")]
        public async Task<IActionResult> AssociarItemCategoria(int categoriaId, int itemId)
        {
            var categoria = await _context.Categoria.FindAsync(categoriaId);
            if (categoria == null)
                return NotFound("Categoria não encontrada");

            var item = await _context.Set<ItemBiblioteca>().FindAsync(itemId);
            if (item == null)
                return NotFound("Item não encontrado");

            var associacaoExistente = await _context.Set<ItemCategoria>()
                .AnyAsync(ic => ic.CategoriaId == categoriaId && ic.ItemBibliotecaId == itemId);

            if (associacaoExistente)
                return BadRequest("Item já associado a esta categoria");

            _context.Set<ItemCategoria>().Add(new ItemCategoria
            {
                CategoriaId = categoriaId,
                ItemBibliotecaId = itemId
            });

            await _context.SaveChangesAsync();
            return NoContent();
        }

        // DELETE: api/Categorias/5/Itens/3
        [Authorize(Roles = "Admin")]
        [HttpDelete("{categoriaId}/Itens/{itemId}")]
        public async Task<IActionResult> RemoverItemCategoria(int categoriaId, int itemId)
        {
            var associacao = await _context.Set<ItemCategoria>()
                .FirstOrDefaultAsync(ic => ic.CategoriaId == categoriaId && ic.ItemBibliotecaId == itemId);

            if (associacao == null)
                return NotFound("Associação não encontrada");

            _context.Set<ItemCategoria>().Remove(associacao);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private bool CategoriaExists(int id)
        {
            return _context.Categoria.Any(e => e.Id == id);
        }
    }
}
