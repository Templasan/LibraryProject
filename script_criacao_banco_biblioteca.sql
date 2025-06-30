-- Script de criação do banco de dados para o Sistema de Gerenciamento de Biblioteca
-- Inclui autenticação de usuários (login/email, senha, role) para integração com JWT

-- Criação do banco de dados
CREATE DATABASE LibraryDB;
GO

USE LibraryDB;
GO

-- Tabela de usuários para autenticação do sistema (agora usando email como login)
CREATE TABLE UsuarioSistema (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    Email NVARCHAR(150) NOT NULL UNIQUE,
    Senha NVARCHAR(50) NOT NULL,
    Role NVARCHAR(50) NOT NULL DEFAULT 'leitor'
);
GO

-- (Adicione um usuário admin para testar. Em produção, use hash de senha!)
INSERT INTO UsuarioSistema (Email, Senha, Role)
VALUES ('admin@biblioteca.com', '123', 'Admin');
GO

INSERT INTO UsuarioSistema (Email, Senha, Role)
VALUES ('teste@teste.com', '123', 'User');
GO

-- Tabela principal para armazenar todos os itens da biblioteca (usando TPH - Table Per Hierarchy)
CREATE TABLE ItemBiblioteca (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    TipoItem NVARCHAR(50) NOT NULL, -- Discriminador para identificar o tipo (Livro ou Revista)
    Titulo NVARCHAR(200) NOT NULL,
    AnoPublicacao INT NOT NULL,
    Editora NVARCHAR(100) NOT NULL,
    Disponivel BIT NOT NULL DEFAULT 1,
    CapaUrl NVARCHAR(300) NULL,
    
    -- Campos específicos para Livros
    Autor NVARCHAR(100) NULL,
    ISBN NVARCHAR(20) NULL,
    NumeroPaginas INT NULL,
    
    -- Campos específicos para Revistas
    Edicao NVARCHAR(50) NULL,
    ISSN NVARCHAR(20) NULL,
    Periodicidade NVARCHAR(50) NULL,
    
    -- Campos para controle de empréstimo (implementação da interface IEmprestavel)
    DataEmprestimo DATETIME NULL,
    DataDevolucaoPrevista DATETIME NULL,
    UsuarioAtual NVARCHAR(150) NULL -- Agora armazena o email do UsuarioSistema (JWT)
);
GO

-- Índices para melhorar a performance das consultas
CREATE INDEX IX_ItemBiblioteca_TipoItem ON ItemBiblioteca(TipoItem);
CREATE INDEX IX_ItemBiblioteca_Titulo ON ItemBiblioteca(Titulo);
CREATE INDEX IX_ItemBiblioteca_Autor ON ItemBiblioteca(Autor) WHERE Autor IS NOT NULL;
CREATE INDEX IX_ItemBiblioteca_ISBN ON ItemBiblioteca(ISBN) WHERE ISBN IS NOT NULL;
CREATE INDEX IX_ItemBiblioteca_ISSN ON ItemBiblioteca(ISSN) WHERE ISSN IS NOT NULL;
GO

-- Tabela para registrar empréstimos
CREATE TABLE Emprestimo (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    ItemBibliotecaId INT NOT NULL,
    UsuarioId INT NOT NULL, -- Id do usuário autenticado (INT, pois UsuarioSistema.Id é INT)
    DataEmprestimo DATETIME NOT NULL,
    DataPrevistaDevolucao DATETIME NOT NULL,
    DataDevolucao DATETIME NULL,
    CONSTRAINT FK_Emprestimo_ItemBiblioteca FOREIGN KEY (ItemBibliotecaId) 
        REFERENCES ItemBiblioteca(Id) ON DELETE NO ACTION,
    CONSTRAINT FK_Emprestimo_UsuarioSistema FOREIGN KEY (UsuarioId)
        REFERENCES UsuarioSistema(Id) ON DELETE NO ACTION
);
GO

CREATE INDEX IX_Emprestimo_ItemBibliotecaId ON Emprestimo(ItemBibliotecaId);
CREATE INDEX IX_Emprestimo_UsuarioId ON Emprestimo(UsuarioId);
CREATE INDEX IX_Emprestimo_DataDevolucao ON Emprestimo(DataDevolucao) WHERE DataDevolucao IS NULL;
GO

-- Tabela de categorias
CREATE TABLE Categoria (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    Nome NVARCHAR(100) NOT NULL,
    Descricao NVARCHAR(500) NULL
);
GO

-- Tabela de relacionamento muitos-para-muitos entre itens e categorias
CREATE TABLE ItemCategoria (
    ItemBibliotecaId INT NOT NULL,
    CategoriaId INT NOT NULL,
    PRIMARY KEY (ItemBibliotecaId, CategoriaId),
    CONSTRAINT FK_ItemCategoria_ItemBiblioteca FOREIGN KEY (ItemBibliotecaId) 
        REFERENCES ItemBiblioteca(Id) ON DELETE CASCADE,
    CONSTRAINT FK_ItemCategoria_Categoria FOREIGN KEY (CategoriaId) 
        REFERENCES Categoria(Id) ON DELETE CASCADE
);
GO

-- Tabela para registrar reservas
CREATE TABLE Reserva (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    ItemBibliotecaId INT NOT NULL, -- FK para o item a ser reservado
    UsuarioId INT NOT NULL,
    DataReserva DATETIME NOT NULL DEFAULT GETDATE(),
    Ativa BIT NOT NULL DEFAULT 1,
    CONSTRAINT FK_Reserva_ItemBiblioteca FOREIGN KEY (ItemBibliotecaId) REFERENCES ItemBiblioteca(Id) ON DELETE CASCADE,
    CONSTRAINT FK_Reserva_UsuarioSistema FOREIGN KEY (UsuarioId) REFERENCES UsuarioSistema(Id) ON DELETE CASCADE
);

CREATE INDEX IX_Reserva_ItemBibliotecaId ON Reserva(ItemBibliotecaId);
CREATE INDEX IX_Reserva_UsuarioId ON Reserva(UsuarioId);

-- Inserção de dados de exemplo para Livros
INSERT INTO ItemBiblioteca (TipoItem, Titulo, Autor, AnoPublicacao, Editora, ISBN, NumeroPaginas, Disponivel)
VALUES 
('Livro', 'C# Avançado', 'John Sharp', 2022, 'Microsoft Press', '978-1234567890', 450, 1),
('Livro', 'ASP.NET Core na Prática', 'Maria Silva', 2023, 'Novatec', '978-0987654321', 380, 1),
('Livro', 'Entity Framework Core', 'Pedro Santos', 2021, 'Casa do Código', '978-5678901234', 320, 1),
('Livro', 'Padrões de Projeto em C#', 'Ana Oliveira', 2020, 'Alta Books', '978-6789012345', 400, 1),
('Livro', 'Desenvolvimento Web com .NET', 'Carlos Mendes', 2023, 'Bookman', '978-7890123456', 500, 1);
GO

-- Inserção de dados de exemplo para Revistas
INSERT INTO ItemBiblioteca (TipoItem, Titulo, Edicao, AnoPublicacao, Editora, ISSN, Periodicidade, Disponivel)
VALUES 
('Revista', 'MSDN Magazine', 'Edição 150', 2023, 'Microsoft', '1234-5678', 'Mensal', 1),
('Revista', '.NET Magazine', 'Edição 45', 2023, 'DevMedia', '2345-6789', 'Bimestral', 1),
('Revista', 'Programação C#', 'Edição 22', 2022, 'Europa', '3456-7890', 'Trimestral', 1),
('Revista', 'Mundo .NET', 'Edição 10', 2023, 'Globo', '4567-8901', 'Mensal', 1),
('Revista', 'Developers', 'Edição 78', 2022, 'Abril', '5678-9012', 'Mensal', 1);
GO

-- Inserção de dados de exemplo para Categorias
INSERT INTO Categoria (Nome, Descricao)
VALUES 
('Programação', 'Livros e revistas sobre linguagens de programação'),
('Web', 'Materiais sobre desenvolvimento web'),
('Banco de Dados', 'Conteúdo sobre gerenciamento de dados'),
('Arquitetura', 'Materiais sobre arquitetura de software'),
('DevOps', 'Conteúdo sobre integração e entrega contínua');
GO

-- Associação de itens a categorias
INSERT INTO ItemCategoria (ItemBibliotecaId, CategoriaId)
VALUES 
(1, 1), -- C# Avançado -> Programação
(2, 1), -- ASP.NET Core na Prática -> Programação
(2, 2), -- ASP.NET Core na Prática -> Web
(3, 1), -- Entity Framework Core -> Programação
(3, 3), -- Entity Framework Core -> Banco de Dados
(4, 1), -- Padrões de Projeto em C# -> Programação
(4, 4), -- Padrões de Projeto em C# -> Arquitetura
(5, 1), -- Desenvolvimento Web com .NET -> Programação
(5, 2), -- Desenvolvimento Web com .NET -> Web
(6, 1), -- MSDN Magazine -> Programação
(7, 1), -- .NET Magazine -> Programação
(7, 2), -- .NET Magazine -> Web
(8, 1), -- Programação C# -> Programação
(9, 1), -- Mundo .NET -> Programação
(9, 2), -- Mundo .NET -> Web
(10, 1); -- Developers -> Programação
GO

-- Stored procedure para emprestar um item
CREATE PROCEDURE sp_EmprestarItem
    @ItemId INT,
    @UsuarioId INT,
    @DiasPrazo INT = 15
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Verificar se o item existe e está disponível
    IF NOT EXISTS (SELECT 1 FROM ItemBiblioteca WHERE Id = @ItemId AND Disponivel = 1)
    BEGIN
        RAISERROR('Item não encontrado ou não disponível para empréstimo', 16, 1);
        RETURN;
    END
    
    BEGIN TRANSACTION;
    
    -- Atualizar o item para indisponível
    UPDATE ItemBiblioteca
    SET Disponivel = 0,
        DataEmprestimo = GETDATE(),
        DataDevolucaoPrevista = DATEADD(DAY, @DiasPrazo, GETDATE())
    WHERE Id = @ItemId;
    
    -- Registrar o empréstimo
    INSERT INTO Emprestimo (ItemBibliotecaId, UsuarioId, DataEmprestimo, DataPrevistaDevolucao)
    VALUES (@ItemId, @UsuarioId, GETDATE(), DATEADD(DAY, @DiasPrazo, GETDATE()));
    
    COMMIT TRANSACTION;
END
GO

-- Stored procedure para devolver um item
CREATE PROCEDURE sp_DevolverItem
    @EmprestimoId INT
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Verificar se o empréstimo existe e não foi devolvido
    IF NOT EXISTS (SELECT 1 FROM Emprestimo WHERE Id = @EmprestimoId AND DataDevolucao IS NULL)
    BEGIN
        RAISERROR('Empréstimo não encontrado ou já devolvido', 16, 1);
        RETURN;
    END
    
    DECLARE @ItemId INT;
    
    -- Obter o ID do item
    SELECT @ItemId = ItemBibliotecaId
    FROM Emprestimo
    WHERE Id = @EmprestimoId;
    
    BEGIN TRANSACTION;
    
    -- Atualizar o empréstimo
    UPDATE Emprestimo
    SET DataDevolucao = GETDATE()
    WHERE Id = @EmprestimoId;
    
    -- Atualizar o item para disponível
    UPDATE ItemBiblioteca
    SET Disponivel = 1,
        DataEmprestimo = NULL,
        DataDevolucaoPrevista = NULL
    WHERE Id = @ItemId;
    
    COMMIT TRANSACTION;
END
GO

-- View para listar empréstimos ativos
CREATE VIEW vw_EmprestimosAtivos
AS
SELECT 
    e.Id AS EmprestimoId,
    i.Id AS ItemId,
    i.Titulo,
    CASE i.TipoItem
        WHEN 'Livro' THEN i.Autor
        WHEN 'Revista' THEN i.Edicao
        ELSE ''
    END AS AutorOuEdicao,
    i.TipoItem,
    e.UsuarioId,
    e.DataEmprestimo,
    e.DataPrevistaDevolucao,
    CASE 
        WHEN GETDATE() > e.DataPrevistaDevolucao THEN 'Atrasado'
        ELSE 'Em dia'
    END AS Status,
    DATEDIFF(DAY, GETDATE(), e.DataPrevistaDevolucao) AS DiasRestantes
FROM 
    Emprestimo e
    INNER JOIN ItemBiblioteca i ON e.ItemBibliotecaId = i.Id
WHERE 
    e.DataDevolucao IS NULL;
GO

-- View para listar itens por categoria
CREATE VIEW vw_ItensPorCategoria
AS
SELECT 
    c.Id AS CategoriaId,
    c.Nome AS CategoriaNome,
    i.Id AS ItemId,
    i.Titulo,
    i.TipoItem,
    CASE i.TipoItem
        WHEN 'Livro' THEN i.Autor
        WHEN 'Revista' THEN i.Edicao
        ELSE ''
    END AS AutorOuEdicao,
    i.AnoPublicacao,
    i.Disponivel
FROM 
    ItemBiblioteca i
    INNER JOIN ItemCategoria ic ON i.Id = ic.ItemBibliotecaId
    INNER JOIN Categoria c ON ic.CategoriaId = c.Id;
GO

PRINT 'Banco de dados LibraryDB criado com sucesso!';
GO