using LibraryProject.Domain.Models;
using Microsoft.EntityFrameworkCore;

namespace LibraryProject.Data
{
    public class LibraryContext : DbContext
    {
        public LibraryContext(DbContextOptions<LibraryContext> options)
            : base(options)
        {
        }

        public DbSet<Livro> Livros { get; set; }
        public DbSet<Revista> Revistas { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            // Configuração da herança usando TPH (Table Per Hierarchy)
            modelBuilder.Entity<ItemBiblioteca>()
                .ToTable("ItemBiblioteca")
                .HasDiscriminator<string>("TipoItem")
                .HasValue<Livro>("Livro")
                .HasValue<Revista>("Revista");

            modelBuilder.Entity<Emprestimo>()
                .HasOne(e => e.Item)
                .WithMany()
                .HasForeignKey(e => e.ItemBibliotecaId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<ItemCategoria>()
                .HasKey(ic => new { ic.ItemBibliotecaId, ic.CategoriaId });

            modelBuilder.Entity<ItemCategoria>()
                .HasOne(ic => ic.Item)
                .WithMany()
                .HasForeignKey(ic => ic.ItemBibliotecaId);

            modelBuilder.Entity<ItemCategoria>()
                .HasOne(ic => ic.Categoria)
                .WithMany(c => c.ItensCategorias)
                .HasForeignKey(ic => ic.CategoriaId);


            // Configurações adicionais
            modelBuilder.Entity<Livro>().Property(l => l.ISBN).IsRequired();
            modelBuilder.Entity<Revista>().Property(r => r.ISSN).IsRequired();
        }

        public DbSet<ItemBiblioteca> ItemBiblioteca { get; set; }

        public DbSet<Emprestimo> Emprestimo { get; set; }

        public DbSet<Categoria> Categoria { get; set; }

        public DbSet<UsuarioSistema> UsuarioSistema { get; set; }

        public DbSet<Reserva> Reservas { get; set; }
    }
}
