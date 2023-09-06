import { XMLParser } from "fast-xml-parser";
import { Type } from "@sinclair/typebox";
import * as Types from "@sinclair/typebox";
import { Value } from "@sinclair/typebox/value";

const Text = Type.Object({
  "#text": Type.Optional(Type.String()),
});

const Attrs = <T extends Types.TObject>(schema: T) =>
  Type.Object({
    "#attrs": Type.Partial(schema),
  });

const AttrsObjId = <T extends Types.TProperties>(props: T) =>
  Attrs(Type.Object({ id: Type.String(), ...props }));

const ArrayAttrsObjId = <T extends Types.TProperties>(props: T) =>
  Type.Array(AttrsObjId(props));

const ArrayTextAttrs = <T extends Types.TObject>(schema: T) =>
  Type.Array(Type.Composite([Text, Attrs(schema)]));

const Id = Type.Object({ id: Type.String() });

const Dir = Type.Union([Type.Literal("ltr"), Type.Literal("rtl")]);

const LangDir = Type.Object({
  id: Type.String(),
  "xml:lang": Type.String(),
  dir: Dir,
});

const Creator = ArrayTextAttrs(
  Type.Composite([
    Type.Object({
      "opf:role": Type.Union([Type.Literal("aut"), Type.Literal("bkp")]),
      "opf:file-as": Type.String(),
    }),
    LangDir,
  ])
);

const OpfType = Type.Object({
  package: Type.Composite([
    Attrs(
      Type.Composite([
        Type.Object({
          version: Type.Union([Type.Literal("2.0"), Type.Literal("3.0")]),
          "unique-identifier": Type.String(),
          prefix: Type.String(),
        }),
        LangDir,
      ])
    ),
    Type.Object({
      metadata: Type.Object({
        "dc:title": ArrayTextAttrs(LangDir),
        "dc:language": ArrayTextAttrs(Id),
        "dc:identifier": ArrayTextAttrs(
          Type.Object({
            id: Type.String(),
            "opf:scheme": Type.String(),
          })
        ),
        "dc:creator": Creator,
        "dc:contributor": Creator,
        "dc:subject": ArrayTextAttrs(LangDir),
        "dc:publisher": ArrayTextAttrs(LangDir),
        "dc:description": ArrayTextAttrs(LangDir),
        "dc:date": ArrayTextAttrs(Id),
        "dc:type": ArrayTextAttrs(Id),
        "dc:rights": ArrayTextAttrs(LangDir),
        meta: ArrayTextAttrs(
          Type.Object({
            id: Type.String(),
            name: Type.String(),
            content: Type.String(),
            property: Type.String(),
            refines: Type.String(),
            scheme: Type.String(),
          })
        ),
        link: ArrayAttrsObjId({
          href: Type.String(),
          rel: Type.String(),
          refines: Type.String(),
          "media-type": Type.String(),
        }),
      }),
      manifest: Type.Composite([
        Attrs(Id),
        Type.Object({
          item: ArrayAttrsObjId({
            href: Type.String(),
            "media-type": Type.String(),
            fallback: Type.String(),
            properties: Type.String(),
            "media-overlay": Type.String(),
          }),
        }),
      ]),
      spine: Type.Composite([
        AttrsObjId({
          toc: Type.String(),
          "page-progression-direction": Type.Union([
            Dir,
            Type.Literal("default"),
          ]),
        }),
        Type.Object({
          itemref: ArrayAttrsObjId({
            idref: Type.String(),
            linear: Type.Union([Type.Literal("yes"), Type.Literal("no")], {
              default: "yes",
            }),
            properties: Type.String(),
          }),
        }),
      ]),
      guide: Type.Object({
        reference: ArrayAttrsObjId({
          type: Type.String(),
          href: Type.String(),
          title: Type.String(),
        }),
      }),
    }),
  ]),
});

type OpfTypeT = Types.Static<typeof OpfType>;

type MetadataType = OpfTypeT["package"]["metadata"];
type MetadataText = Exclude<
  keyof MetadataType,
  | "dc:identifier"
  | "dc:creator"
  | "dc:contributor"
  | "meta"
  | "link"
  | "dc:publisher"
>;

export class Opf {
  private opfType: OpfTypeT;

  constructor(
    opfText: string,
    private parentFolder: string
  ) {
    const obj = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: "",
      parseTagValue: false,
      parseAttributeValue: false,
      attributesGroupName: "#attrs",
      trimValues: true,
      alwaysCreateTextNode: true,
      isArray(tagName) {
        return ![
          "package",
          "metadata",
          "manifest",
          "spine",
          "guide",
          "#attrs",
        ].includes(tagName);
      },
    }).parse(opfText) as Record<string, unknown>;
    this.opfType = Value.Cast(OpfType, obj);
  }

  get title() {
    return this.getText("dc:title").at(0);
  }

  get creators() {
    return this.getCreators("dc:creator");
  }

  get description() {
    return this.getText("dc:description").at(0);
  }

  get coverPath() {
    const coverId = this.opfType.package.metadata.meta.find(
      (m) => m["#attrs"].name === "cover"
    )?.["#attrs"].content;
    return this.href(
      this.opfType.package.manifest.item.find(
        (item) => coverId != null && item["#attrs"].id === coverId
      )?.["#attrs"]
    );
  }

  private href(obj?: { href?: string }): string | undefined {
    if (obj?.href) return `${this.parentFolder}${obj.href}`;
  }

  private getText(key: MetadataText) {
    return this.opfType.package.metadata[key]
      .map((s) => s["#text"]?.trim())
      .filter((s): s is string => s != null);
  }

  private getCreators(key: "dc:creator" | "dc:contributor") {
    const creators = this.opfType.package.metadata[key];
    return creators
      .map((c) => c["#text"])
      .filter((n): n is string => n != null);
  }
}
