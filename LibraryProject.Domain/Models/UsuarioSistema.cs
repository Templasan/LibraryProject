namespace LibraryProject.Domain.Models
{
    public class UsuarioSistema
    {
        public int Id { get; set; }
        public string Email { get; set; }
        public string Senha { get; set; }
        public string Role { get; set; } = "leitor";
    }
}