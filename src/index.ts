import {
    $query,
    $update,
    Record,
    StableBTreeMap,
    Vec,
    match,
    Result,
    nat64,
    ic,
    Opt,
    Principal,
} from 'azle';
import { v4 as uuidv4 } from 'uuid';

type Book = Record<{
    isBorrowed: boolean;
    id: string;
    title: string;
    author: string;
    genre: string;
    publicationDate: nat64;
    createdAt: nat64;
    updatedAt: Opt<nat64>;
    favorite: Opt<boolean>;
    comments: Vec<Comment>;
}>;

type Comment = Record<{
    id: string;
    text: string;
    createdAt: nat64;
    author: Principal;
}>;

const bookStorage = new StableBTreeMap<string, Book>(0, 44, 1024);

$query
export function searchBooks(query: string): Result<Vec<Book>, string> {
    try {
        const lowerCaseQuery = query.toLowerCase();
        const filteredBooks = bookStorage.values().filter(
            (book) =>
                book.title.toLowerCase().includes(lowerCaseQuery) ||
                book.author.toLowerCase().includes(lowerCaseQuery) ||
                book.genre.toLowerCase().includes(lowerCaseQuery)
        );
        return Result.Ok(filteredBooks);
    } catch (error) {
        return Result.Err(`Error searching for books: ${error}`);
    }
}

$update
export function favoriteBook(id: string): Result<Book, string> {
    return match(bookStorage.get(id), {
        Some: (book) => {
            if (book.isBorrowed) {
                return Result.Err<Book, string>('Cannot mark a borrowed book as a favorite');
            }

            const favoriteBook: Book = { ...book, favorite: Opt.Some(true) };
            bookStorage.insert(book.id, favoriteBook);
            return Result.Ok<Book, string>(favoriteBook);
        },
        None: () =>
            Result.Err<Book, string>(`Couldn't mark book with id=${id} as a favorite. Book not found`),
    });
}

$update
export function borrowBook(id: string): Result<Book, string> {
    return match(bookStorage.get(id), {
        Some: (book) => {
            if (book.isBorrowed) {
                return Result.Err<Book, string>(`Book with id=${id} is already borrowed`);
            }

            const newBook: Book = { ...book, isBorrowed: true };
            bookStorage.insert(id, newBook);

            return Result.Ok(newBook);
        },
        None: () => Result.Err<Book, string>(`Book with id=${id} not found`),
    }) as Result<Book, string>;
}

$update
export function returnBook(id: string): Result<Book, string> {
    return match(bookStorage.get(id), {
        Some: (book) => {
            if (!book.isBorrowed) {
                return Result.Err<Book, string>(`Book with id=${id} is not currently borrowed`);
            }

            const newBook: Book = { ...book, isBorrowed: false };
            bookStorage.insert(id, newBook);

            return Result.Ok(newBook);
        },
        None: () => Result.Err<Book, string>(`Book with id=${id} not found`),
    }) as Result<Book, string>;
}

$update
export function commentOnBook(id: string, text: string): Result<Comment, string> {
    return match(bookStorage.get(id), {
        Some: (book) => {
            const commentId = uuidv4();
            const newComment: Comment = {
                id: commentId,
                text,
                createdAt: ic.time(),
                author: ic.caller(),
            };
            book.comments.push(newComment);
            bookStorage.insert(id, book);

            return Result.Ok(newComment);
        },
        None: () => Result.Err<Comment, string>(`Book with id=${id} not found`),
    }) as Result<Comment, string>;
}

$update
export function addBook(book: Book): Result<Book, string> {
    try {
        // Generate a unique ID for the book
        book.id = uuidv4();
        // Initialize isBorrowed to false when adding a new book
        book.isBorrowed = false;
        // Initialize comments as an empty array
        book.comments = [];

        // Validate the book object
        if (!book.title || !book.author || !book.genre || !book.publicationDate) {
            return Result.Err('Missing required fields in the book object');
        }

        // Update the updatedAt field with the current timestamp
        book.updatedAt = Opt.Some(ic.time());

        // Add the book to bookStorage
        bookStorage.insert(book.id, book);

        return Result.Ok(book);
    } catch (error) {
        return Result.Err(`Error adding book: ${error}`);
    }
}

$update
export function updateBook(id: string, book: Book): Result<Book, string> {
    return match(bookStorage.get(id), {
        Some: (existingBook) => {
            // Validate the updated book object
            if (!book.title || !book.author || !book.genre || !book.publicationDate) {
                return Result.Err('Missing required fields in the book object');
            }

            // Create a new book object with the updated fields
            const updatedBook: Book = {
                ...existingBook,
                ...book,
                updatedAt: Opt.Some(ic.time()),
            };

            // Update the book in bookStorage
            bookStorage.insert(id, updatedBook);

            return Result.Ok(updatedBook);
        },
        None: () => Result.Err<Book, string>(`Book with id=${id} does not exist`),
    }) as Result<Book, string>;
}

$query
export function getBooks(): Result<Vec<Book>, string> {
    try {
        const books = bookStorage.values();
        return Result.Ok(books);
    } catch (error) {
        return Result.Err(`Error getting books: ${error}`);
    }
}

$query
export function getBook(id: string): Result<Book, string> {
    return match(bookStorage.get(id), {
        Some: (book) => Result.Ok<Book, string>(book),
        None: () => Result.Err<Book, string>(`Book with id=${id} not found`),
    }) as Result<Book, string>;
}

$update
export function deleteBook(id: string): Result<Opt<Book>, string> {
    try {
        // Validate the id parameter
        if (!isValidUUID(id)) {
            return Result.Err('Invalid book ID');
        }

        // Delete the book from bookStorage
        const deletedBook = bookStorage.remove(id);
        if (!deletedBook) {
            return Result.Err(`Book with ID ${id} does not exist`);
        }

        return Result.Ok(deletedBook);
    } catch (error) {
        return Result.Err(`Error deleting book: ${error}`);
    }
}

export function isValidUUID(id: string): boolean {
    return /^[\da-f]{8}-([\da-f]{4}-){3}[\da-f]{12}$/i.test(id);
}
// A workaround to make the uuid package work with Azle
globalThis.crypto = {
    // @ts-ignore
    getRandomValues: () => {
        let array = new Uint8Array(32);

        for (let i = 0; i < array.length; i++) {
            array[i] = Math.floor(Math.random() * 256);
        }

        return array;
    },
}