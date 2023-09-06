type FileType<T> = T extends "text" ? string : Uint8Array;

export type ReadFileFn = <T extends "text" | "binary">(
  name: string,
  readAs: T
) => Promise<FileType<T> | null>;

export abstract class Book {
  abstract readonly fileType: string;

  constructor(protected readFile: ReadFileFn) {}

  abstract get title(): string;
  abstract get creators(): string[];
  abstract get description(): string;
  abstract get cover(): Promise<Uint8Array | null>;
}
