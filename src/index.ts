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
} from "azle";
import { v4 as uuidv4 } from "uuid";

// Define the Book record type.
type Book = Record<{
  id: string;
  title: string;
  author: string;
  genre: string;
  publicationDate: string;
  createdAt: nat64;
  updatedAt: Opt<nat64>;
}>;

// Define a payload type for creating and updating books.
type BookPayload = Record<{
  title: string;
  author: string;
  genre: string;
  publicationDate: string;
}>;

// Create a storage map for storing books.
const bookStorage = new StableBTreeMap<string, Book>(0, 44, 1024);

// Query function to get all books.
$query;
export function getBooks(): Result<Vec<Book>, string> {
  try {
    return Result.Ok(bookStorage.values());
  } catch (error) {
    return Result.Err("Failed to retrieve books from storage.");
  }
}

// Query function to get a book by ID.
$query;
export function getBook(id: string): Result<Book, string> {
  // Validate if id is provided and not empty.
  if (!id) {
    return Result.Err<Book, string>("Invalid or empty id parameter");
  }
  try {
    return match(bookStorage.get(id), {
      Some: (book) => Result.Ok<Book, string>(book),
      None: () => Result.Err<Book, string>(`A book with id=${id} not found`),
    });
  } catch (error) {
    return Result.Err<Book, string>(
      `An error occurred while retrieving the book with id=${id}`
    );
  }
}

// Update function to add a new book.
$update;
export function addBook(payload: BookPayload): Result<Book, string> {
  if (
    !payload.title ||
    !payload.author ||
    !payload.genre ||
    !payload.publicationDate
  ) {
    return Result.Err("Missing required fields in the book object");
  }

  // Generate a new unique ID for the book.
  const id = uuidv4();

  // Create a new book object with the provided payload.
  const newBook: Book = {
    id,
    createdAt: ic.time(),
    updatedAt: Opt.None,
    title: payload.title,
    author: payload.author,
    genre: payload.genre,
    publicationDate: payload.publicationDate,
  };

  try {
    // Insert the new book into the book storage map.
    bookStorage.insert(newBook.id, newBook);
    return Result.Ok(newBook);
  } catch (error) {
    // Handle the error here, such as logging or returning an error result.
    return Result.Err("Failed to add book: " + error);
  }
}

// Update function to update an existing book.
$update;
export function updateBook(
  id: string,
  payload: BookPayload
): Result<Book, string> {
  // Validate if id is provided and not empty.
  if (!id) {
    return Result.Err<Book, string>("Invalid or empty id parameter");
  }

  if (
    !payload.title ||
    !payload.author ||
    !payload.genre ||
    !payload.publicationDate
  ) {
    return Result.Err("Missing required fields in the book object");
  }

  return match(bookStorage.get(id), {
    Some: (existingBook) => {
      // Create an updated book object with the provided payload.
      const updatedBook: Book = {
        ...existingBook,
        title: payload.title,
        author: payload.author,
        genre: payload.genre,
        publicationDate: payload.publicationDate,
        updatedAt: Opt.Some(ic.time()),
      };
      try {
        // Insert the updated book back into the book storage map.
        bookStorage.insert(id, updatedBook);
        return Result.Ok<Book, string>(updatedBook);
      } catch (error) {
        // Handle the error here, such as logging or returning an error result.
        return Result.Err<Book, string>(
          "Failed to insert updatedBook into bookStorage"
        );
      }
    },
    None: () =>
      Result.Err<Book, string>(
        `couldn't update a book with id=${id}. book not found`
      ),
  });
}

// Update function to delete a book by ID.
$update;
export function deleteBook(id: string): Result<Book, string> {
  if (!id) {
    return Result.Err<Book, string>(`invalid id=${id}.`);
  }
  try {
    return match(bookStorage.remove(id), {
      Some: (deletedBook) => Result.Ok<Book, string>(deletedBook),
      None: () =>
        Result.Err<Book, string>(
          `couldn't delete a book with id=${id}. book not found.`
        ),
    });
  } catch (error) {
    return Result.Err<Book, string>(
      `An error occurred while deleting the book: ${error}`
    );
  }
}

globalThis.crypto = {
  //@ts-ignore
  getRandomValues: () => {
    let array = new Uint8Array(32);

    for (let i = 0; i < array.length; i++) {
      array[i] = Math.floor(Math.random() * 256);
    }

    return array;
  },
};
