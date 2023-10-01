import { $query, $update, Record, StableBTreeMap, Vec, match, Result, nat64, ic, Opt } from 'azle';

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
    return Result.Ok(bookStorage.values());
}

$query;
export function getBook(id: string): Result<Book, string> {
    return match(bookStorage.get(id), {
        Some: (book) => Result.Ok<Book, string>(book),
        None: () => Result.Err<Book, string>(`a book with id=${id} not found`)
    });
}

$update;
export function addBook(book: Book): Result<Book, string> {
    bookStorage.insert(book.id, book);
    return Result.Ok(book);
}

$update;
export function updateBook(id: string, book: Book): Result<Book, string> {
    return match(bookStorage.get(id), {
        Some: (existingBook) => {
            const updatedBook: Book = {...existingBook, ...book, updatedAt: Opt.Some(ic.time())};
            bookStorage.insert(id, updatedBook);
            return Result.Ok<Book, string>(updatedBook);
        },
        None: () => Result.Err<Book, string>(`couldn't update a book with id=${id}. book not found`)
    });
}

$update;
export function deleteBook(id: string): Result<Book, string> {
    return match(bookStorage.remove(id), {
        Some: (deletedBook) => Result.Ok<Book, string>(deletedBook),
        None: () => Result.Err<Book, string>(`couldn't delete a book with id=${id}. book not found.`)
    });
}