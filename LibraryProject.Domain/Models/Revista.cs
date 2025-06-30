using System;

namespace LibraryProject.Domain.Models
{
    public class Revista : ItemBiblioteca
    {
        public string Edicao { get; set; }
        public string ISSN { get; set; }
        public string Periodicidade { get; set; }
        
        // Sobrescrita do método abstrato
        public override string ExibirDetalhes()
        {
            return $"Revista: {Titulo} | Edição: {Edicao} | Ano: {AnoPublicacao} | Editora: {Editora} | ISSN: {ISSN} | Periodicidade: {Periodicidade} | Disponível: {(Disponivel ? "Sim" : "Não")}";
        }
    }
}
