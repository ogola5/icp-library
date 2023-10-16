# library

Welcome to your first Azle project! This example project will help you to deploy your first canister (application) to the Internet Computer (IC) decentralized cloud. It is a simple getter/setter canister. You can always refer to [The Azle Book](https://demergent-labs.github.io/azle/) for more in-depth documentation.

`dfx` is the tool you will use to interact with the IC locally and on mainnet. If you don't already have it installed:

```bash
npm run dfx_install
```

Next you will want to start a replica, which is a local instance of the IC that you can deploy your canisters to:

```bash
npm run replica_start
```

If you ever want to stop the replica:

```bash
npm run replica_stop
```

Now you can deploy your canister locally:

```bash
npm install
npm run canister_deploy_local
```

To call the methods on your canister:
Functions
searchBooks(query: string): Result<Vec<Book>, string>
Search for books in the collection based on a query. The function returns a list of books matching the query.

favoriteBook(id: string): Result<Book, string>
Mark a book as a favorite. This function checks if the book is borrowed and ensures you cannot mark borrowed books as favorites.

borrowBook(id: string): Result<Book, string>
Borrow a book. This function sets the isBorrowed property to true for the specified book.

returnBook(id: string): Result<Book, string>
Return a borrowed book. This function sets the isBorrowed property to false for the specified book.

commentOnBook(id: string, text: string): Result<Comment, string>
Add a comment to a book. This function creates a new comment with a unique ID and stores it with the book.

addBook(book: Book): Result<Book, string>
Add a new book to the collection. This function validates the book object and ensures required fields are provided.

updateBook(id: string, book: Book): Result<Book, string>
Update an existing book with new data. This function validates the book object and merges it with the existing book.

getBooks(): Result<Vec<Book>, string>
Get a list of all books in the collection.

getBook(id: string): Result<Book, string>
Get the details of a specific book by its ID.

deleteBook(id: string): Result<Opt<Book>, string>
Delete a book from the collection based on its ID.

isValidUUID(id: string): boolean
A utility function to check the validity of a UUID.

License
This code is provided under the LICENSE file.


```

Assuming you have [created a cycles wallet](https://internetcomputer.org/docs/current/developer-docs/quickstart/network-quickstart) and funded it with cycles, you can deploy to mainnet like this:

```bash
npm run canister_deploy_mainnet
```
