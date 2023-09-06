import { ReadFileFn } from "./common";
import { Epub } from "./epub";
import { Mobi } from "./mobi";

export type Book = Epub | Mobi;

interface FileHandler {
  read: ReadFileFn;
}

export async function loadBook(
  path: string,
  handler: FileHandler
): Promise<Book | null> {
  const ext = path.slice(path.lastIndexOf("."));
  let book: Book | null = null;

  switch (ext) {
    case ".epub": {
      book = new Epub(handler.read);
      await book.init();
    }
  }
  return book;
}
