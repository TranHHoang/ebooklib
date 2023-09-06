import { XMLParser } from "fast-xml-parser";
import { Type } from "@sinclair/typebox";
import { Value } from "@sinclair/typebox/value";
import { Book } from "../common";
import { Opf } from "./opf";

const ContainerType = Type.Object({
  container: Type.Object({
    rootfiles: Type.Array(
      Type.Object({
        rootfile: Type.Object({
          "full-path": Type.String(),
          "media-type": Type.String(),
        }),
      })
    ),
  }),
});

export class Epub extends Book {
  readonly fileType = "epub";
  opf?: Opf;

  async init() {
    this.opf = await this.findOpf();
  }

  get title() {
    return this.opf?.title ?? "";
  }

  get creators() {
    return this.opf?.creators ?? [];
  }

  get description() {
    return this.opf?.description ?? "";
  }

  get cover(): Promise<Uint8Array | null> {
    const path = this.opf?.coverPath;
    if (path) return this.readFile(path, "binary");
    return Promise.resolve(null);
  }

  private async findOpf() {
    const content = await this.readFile("META-INF/container.xml", "text");
    if (!content) throw new Error("EPUB file has no container.xml");
    const obj = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: "",
      parseAttributeValue: false,
      isArray(tagName) {
        return tagName === "rootfiles";
      },
    }).parse(content) as Record<string, unknown>;

    const container = Value.Cast(ContainerType, obj);

    const [path = "", text] = await container.container.rootfiles.reduce(
      async (acc, file) => {
        if (
          (await acc).length > 0 ||
          file.rootfile["media-type"] !== "application/oebps-package+xml"
        )
          return acc;
        const opf = await this.readFile(file.rootfile["full-path"], "text");
        if (opf) return [file.rootfile["full-path"], opf];
        return acc;
      },
      Promise.resolve<string[]>([])
    );

    if (!text) throw new Error("EPUB file has no valid .opf file");

    const parentFolder = path
      .replaceAll("\\", "/")
      .slice(0, path.lastIndexOf("/") + 1);
    return new Opf(text, parentFolder);
  }
}
