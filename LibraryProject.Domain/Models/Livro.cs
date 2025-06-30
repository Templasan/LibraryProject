using LibraryProject.Domain.Interfaces;
using System;

namespace LibraryProject.Domain.Models
{
    public class Livro : ItemBiblioteca, IEmprestavel
    {
        public string? Autor { get; set; }          // Nullable string
        public string? ISBN { get; set; }           // Nullable string
        public int NumeroPaginas { get; set; }

        // Propriedades da interface IEmprestavel
        public DateTime? DataEmprestimo { get; set; }
        public DateTime? DataDevolucaoPrevista { get; set; }
        public string? UsuarioAtual { get; set; }   // Agora nullable

        // Sobrescrita do método abstrato
        public override string ExibirDetalhes()
        {
            return $"Livro: {Titulo} | Autor: {Autor} | Ano: {AnoPublicacao} | Editora: {Editora} | ISBN: {ISBN} | Páginas: {NumeroPaginas} | Disponível: {(Disponivel ? "Sim" : "Não")}";
        }

        // Implementação dos métodos da interface
        public bool Emprestar(string usuario)
        {
            if (!Disponivel)
                return false;

            Disponivel = false;
            UsuarioAtual = usuario;
            DataEmprestimo = DateTime.Now;
            DataDevolucaoPrevista = DateTime.Now.AddDays(15); // 15 dias de prazo

            return true;
        }

        public bool Devolver()
        {
            if (Disponivel)
                return false;

            Disponivel = true;
            UsuarioAtual = null;
            DataEmprestimo = null;
            DataDevolucaoPrevista = null;

            return true;
        }
    }
}
