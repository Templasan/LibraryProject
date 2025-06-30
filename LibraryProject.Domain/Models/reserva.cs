using System;

namespace LibraryProject.Domain.Models
{
    public class Reserva
    {
        public int Id { get; set; }

        // FK para o item reservado
        public int ItemBibliotecaId { get; set; }
        public ItemBiblioteca Item { get; set; }

        // FK para o usuário que reservou
        public int UsuarioId { get; set; }
        public UsuarioSistema Usuario { get; set; }

        public DateTime DataReserva { get; set; }
        public bool Ativa { get; set; } // Indica se a reserva está ativa (na fila)
    }
}