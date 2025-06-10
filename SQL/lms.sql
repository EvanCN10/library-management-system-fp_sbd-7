-- 1. Publisher
CREATE TABLE Publisher (
    publisher_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    address VARCHAR(255),
    phone VARCHAR(20),
    email VARCHAR(100),
    UNIQUE (name)
);

-- 2. Author
CREATE TABLE Author (
    author_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    bio TEXT
);

-- 3. Category
CREATE TABLE Category (
    category_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description VARCHAR(255)
);

-- 4. Book
CREATE TABLE Book (
    book_id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    isbn VARCHAR(20) UNIQUE,
    publisher_id INT,
    publication_year YEAR,
    total_copies INT NOT NULL DEFAULT 1,
    available_copies INT NOT NULL DEFAULT 1,
    description TEXT,
    CONSTRAINT fk_book_publisher FOREIGN KEY (publisher_id)
        REFERENCES Publisher(publisher_id)
        ON DELETE SET NULL
        ON UPDATE CASCADE
);

-- 5. BookAuthor
CREATE TABLE BookAuthor (
    book_id INT NOT NULL,
    author_id INT NOT NULL,
    PRIMARY KEY (book_id, author_id),
    CONSTRAINT fk_ba_book FOREIGN KEY (book_id)
        REFERENCES Book(book_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    CONSTRAINT fk_ba_author FOREIGN KEY (author_id)
        REFERENCES Author(author_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

-- 6. BookCategory
CREATE TABLE BookCategory (
    book_id INT NOT NULL,
    category_id INT NOT NULL,
    PRIMARY KEY (book_id, category_id),
    CONSTRAINT fk_bc_book FOREIGN KEY (book_id)
        REFERENCES Book(book_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    CONSTRAINT fk_bc_category FOREIGN KEY (category_id)
        REFERENCES Category(category_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

-- 7. Member
CREATE TABLE Member (
    member_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    address VARCHAR(255),
    phone VARCHAR(20),
    email VARCHAR(100) UNIQUE,
    join_date DATE NOT NULL DEFAULT CURRENT_DATE,
    status ENUM('Active','Inactive') NOT NULL DEFAULT 'Active'
);

-- 8. Loan
CREATE TABLE Loan (
    loan_id INT AUTO_INCREMENT PRIMARY KEY,
    member_id INT NOT NULL,
    book_id INT NOT NULL,
    loan_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    due_date DATE NOT NULL,
    return_date DATETIME,
    status ENUM('Borrowed','Returned','Overdue') NOT NULL DEFAULT 'Borrowed',
    CONSTRAINT fk_loan_member FOREIGN KEY (member_id)
        REFERENCES Member(member_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    CONSTRAINT fk_loan_book FOREIGN KEY (book_id)
        REFERENCES Book(book_id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
);

-- 9. Reservation
CREATE TABLE Reservation (
    reservation_id INT AUTO_INCREMENT PRIMARY KEY,
    member_id INT NOT NULL,
    book_id INT NOT NULL,
    reservation_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status ENUM('Pending','Fulfilled','Cancelled') NOT NULL DEFAULT 'Pending',
    CONSTRAINT fk_res_member FOREIGN KEY (member_id)
        REFERENCES Member(member_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    CONSTRAINT fk_res_book FOREIGN KEY (book_id)
        REFERENCES Book(book_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

-- 10. Librarian 
CREATE TABLE Librarian (
    librarian_id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(150),
    role ENUM('Admin','Staff') NOT NULL DEFAULT 'Staff',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
