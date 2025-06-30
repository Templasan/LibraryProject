using LibraryProject.Data;
using LibraryProject.Domain.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace LibraryProject.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class RevistasController : ControllerBase
    {
        private readonly LibraryContext _context;

        public RevistasController(LibraryContext context)
        {
            _context = context;
        }

        // GET: api/Revistas
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Revista>>> GetRevistas()
        {
            return await _context.Revistas.ToListAsync();
        }

        // GET: api/Revistas/5
        [HttpGet("{id}")]
        public async Task<ActionResult<Revista>> GetRevista(int id)
        {
            var revista = await _context.Revistas.FindAsync(id);

            if (revista == null)
            {
                return NotFound();
            }

            return revista;
        }

        // POST: api/Revistas
        [Authorize(Roles = "Admin")]
        [HttpPost]
        public async Task<ActionResult<Revista>> PostRevista([FromBody] Revista revista)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            _context.Revistas.Add(revista);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetRevista), new { id = revista.Id }, revista);
        }

        // PUT: api/Revistas/5
        [Authorize(Roles = "Admin")]
        [HttpPut("{id}")]
        public async Task<IActionResult> PutRevista(int id, [FromBody] Revista revista)
        {
            if (id != revista.Id)
            {
                return BadRequest();
            }

            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            _context.Entry(revista).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!await RevistaExists(id))
                {
                    return NotFound();
                }
                else
                {
                    throw;
                }
            }

            return NoContent();
        }

        // DELETE: api/Revistas/5
        [Authorize(Roles = "Admin")]
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteRevista(int id)
        {
            var revista = await _context.Revistas.FindAsync(id);
            if (revista == null)
            {
                return NotFound();
            }

            _context.Revistas.Remove(revista);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private async Task<bool> RevistaExists(int id)
        {
            return await _context.Revistas.AnyAsync(e => e.Id == id);
        }
    }
}