import { religiousHorrorRecords } from "./religiousHorror";
import { archiveMetadata } from "./archiveMetadata";

export type SpecimenCatalogItem = {
  slug: string;
  id: string;
  title: string;
  category: string;
  excerpt: string;
  story: string;
};

const slugify = (value: string) => value.toLowerCase().replaceAll(" ", "-");

export const specimenCatalog: SpecimenCatalogItem[] = [
  ...religiousHorrorRecords.map((record) => ({ slug: slugify(record.title), id: record.id, title: record.title, category: "Religious Horror", excerpt: `${record.description.split(".")[0]}.`, story: record.description })),
  ...Object.entries(archiveMetadata).flatMap(([slug, records]) => records.map((record) => ({ slug: slugify(record.title), id: record.id, title: record.title, category: slug.replaceAll("-", " ").replace(/\b\w/g, (letter) => letter.toUpperCase()), excerpt: `${record.description.split(".")[0]}.`, story: record.description }))),
];
