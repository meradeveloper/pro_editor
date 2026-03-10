import { readFile } from "fs/promises";
import path from "path";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import { DocumentState, Block } from "@/types/blocks";
import SiteViewer from "./SiteViewer";

interface Props {
  params: Promise<{ slug: string }>;
}

async function loadDocument(slug: string): Promise<DocumentState | null> {
  try {
    const filePath = path.join(process.cwd(), "public", "sites", `${slug}.json`);
    const raw = await readFile(filePath, "utf-8");
    return JSON.parse(raw) as DocumentState;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const doc = await loadDocument(slug);
  return {
    title: doc?.title ?? slug,
  };
}

export default async function SitePage({ params }: Props) {
  const { slug } = await params;
  const doc = await loadDocument(slug);
  if (!doc) notFound();
  return <SiteViewer document={doc} />;
}
