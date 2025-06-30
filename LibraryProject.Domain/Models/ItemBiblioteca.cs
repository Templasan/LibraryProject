namespace LibraryProject.Domain.Models
{
    public abstract class ItemBiblioteca
    {
        public int Id { get; set; }
        public string Titulo { get; set; }
        public int AnoPublicacao { get; set; }
        public string Editora { get; set; }
        public bool Disponivel { get; set; }

        // Novo campo para o link da imagem da capa
        public string? CapaUrl { get; set; }

        public abstract string ExibirDetalhes();

        public virtual void Cadastrar()
        {
            Disponivel = true;
        }

        public virtual void Atualizar()
        {
        }

        public virtual void Emprestimo()
        {
        }
    }
}