using System;

namespace LibraryProject.Domain.Interfaces
{
    public interface IEmprestavel
    {
        bool Emprestar(string usuario);
        bool Devolver();
        DateTime? DataEmprestimo { get; set; }
        DateTime? DataDevolucaoPrevista { get; set; }
        string UsuarioAtual { get; set; }
    }
}
