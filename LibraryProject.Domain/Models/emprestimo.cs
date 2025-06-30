using System;

namespace LibraryProject.Domain.Models
{
    public class Emprestimo
    {
        public int Id { get; set; }

        // FK para o item emprestado
        public int ItemBibliotecaId { get; set; }
        public ItemBiblioteca Item { get; set; }

        // FK para o usuário autenticado (INT, conforme banco)
        public int UsuarioId { get; set; }
        public UsuarioSistema Usuario { get; set; }

        public DateTime DataEmprestimo { get; set; }
        public DateTime DataPrevistaDevolucao { get; set; }
        public DateTime? DataDevolucao { get; set; }

        // Propriedades auxiliares (não mapeadas no banco)
        public bool Ativo => DataDevolucao == null;
        public bool Atrasado => Ativo && DateTime.Now > DataPrevistaDevolucao;
    }
}