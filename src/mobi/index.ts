import { Book } from "../common";

export class Mobi extends Book {
  readonly fileType = "mobi";

  get title(): string {
    throw new Error("Method not implemented.");
  }
  get creators(): string[] {
    throw new Error("Method not implemented.");
  }
  get description(): string {
    throw new Error("Method not implemented.");
  }
  get cover(): Promise<Uint8Array | null> {
    throw new Error("Method not implemented.");
  }
}
