using System.Text.Json.Serialization;

namespace LibraryProject.Domain.Models
{
    public class ItemCategoria
    {
        public int ItemBibliotecaId { get; set; }

        [JsonIgnore]  // Para evitar loop na serialização JSON
        public ItemBiblioteca? Item { get; set; }

        public int CategoriaId { get; set; }

        [JsonIgnore]  // Para evitar loop na serialização JSON
        public Categoria? Categoria { get; set; }
    }
}
