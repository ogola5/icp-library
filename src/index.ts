import { $query, $update, Record, StableBTreeMap, Vec, match, Result, nat64, ic, Opt } from 'azle';
import {v4 as uuidv4} from 'uuid';

type Book = Record<{
    id: string;
    title: string;
    author: string;
    genre: string;
    publicationDate: nat64;
    createdAt: nat64;
    updatedAt: Opt<nat64>;
}>;

const bookStorage = new StableBTreeMap<string, Book>(0, 44, 1024);

$query;
export function getBooks(): Result<Vec<Book>, string> {
    try {
        const books = bookStorage.values();
        return Result.Ok(books);
    } catch (error) {
        return Result.Err(`Error getting books: ${error}`);
    }
}

$query;
export function getBook(id: string): Result<Book, string> {
    try {
        const book = bookStorage.get(id);
        return match(book, {
            Some: (book) => Result.Ok<Book, string>(book),
            None: () => Result.Err<Book, string>(`a book with id=${id} not found`)
        });
    } catch (error) {
        return Result.Err(`Error getting book: ${error}`);
    }
}

$update;
export function addBook(book: Book): Result<Book, string> {
    try {
        // Generate a unique ID for the book
        book.id = uuidv4();

        // Validate the book object
        if (!book.title || !book.author || !book.genre || !book.publicationDate) {
            return Result.Err('Missing required fields in book object');
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

$update;
export function updateBook(id: string, book: Book): Result<Book, string> {
    try {
        // Validate the updated book object
        if (!book.title || !book.author || !book.genre || !book.publicationDate) {
            return Result.Err('Missing required fields in book object');
        }

        // Get the existing book
        const existingBook = bookStorage.get(id);
        if (!existingBook) {
            return Result.Err(`Book with ID ${id} does not exist`);
        }

        // Create a new book object with the updated fields
        const updatedBook: Book = {
            ...existingBook,
            ...book,
            updatedAt: Opt.Some(ic.time())
        };

        // Update the book in bookStorage
        bookStorage.insert(id, updatedBook);

        return Result.Ok(updatedBook);
    } catch (error) {
        return Result.Err(`Error updating book: ${error}`);
    }
}

$update;
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
function isValidUUID(id: string):boolean {
    throw new Error('Function not implemented.');
}

