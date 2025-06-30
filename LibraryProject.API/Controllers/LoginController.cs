using LibraryProject.Data;        // Para acessar o contexto do banco
using LibraryProject.Domain;      // Para acessar a entidade UsuarioSistema
using LibraryProject.Domain.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace LibraryProject.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly IConfiguration _configuration;
        private readonly LibraryContext _context;

        public AuthController(IConfiguration configuration, LibraryContext context)
        {
            _configuration = configuration;
            _context = context;
        }

        [HttpPost("login")]
        [AllowAnonymous]
        public async Task<IActionResult> Login([FromBody] LoginModel model)
        {
            // Consulta ao banco para buscar o usuário pelo e-mail e senha
            var usuarioSistema = await _context.UsuarioSistema
                .FirstOrDefaultAsync(u => u.Email == model.Email && u.Senha == model.Senha); // Use hash de senha em produção

            if (usuarioSistema == null)
                return Unauthorized(new { message = "E-mail ou senha inválidos." });

            var token = GerarToken(usuarioSistema);
            return Ok(new { token });
        }

        private string GerarToken(UsuarioSistema usuarioSistema)
        {
            var claims = new[]
            {
                new Claim(JwtRegisteredClaimNames.Sub, usuarioSistema.Id.ToString()),
                new Claim(JwtRegisteredClaimNames.Email, usuarioSistema.Email),
                new Claim(ClaimTypes.Role, usuarioSistema.Role) // <-- ESSENCIAL para Authorize(Roles = ...)
            };

            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_configuration["Jwt:Key"]));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var token = new JwtSecurityToken(
                issuer: _configuration["Jwt:Issuer"],
                audience: _configuration["Jwt:Audience"],
                claims: claims,
                expires: DateTime.UtcNow.AddHours(2),
                signingCredentials: creds
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }
    }

    // Model de login
    public class LoginModel
    {
        public string Email { get; set; }
        public string Senha { get; set; }
    }
}