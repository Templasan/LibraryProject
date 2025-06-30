namespace LibraryProject.Domain.Models
{
    public class Categoria
    {
        public int Id { get; set; }
        public string Nome { get; set; }
        public string Descricao { get; set; }

        public ICollection<ItemCategoria> ItensCategorias { get; set; }
    }
}
