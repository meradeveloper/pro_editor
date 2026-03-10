export type BlockType =
  | "paragraph"
  | "heading"
  | "image"
  | "graph"
  | "divider"
  | "code";

export type ChartType = "bar" | "line" | "pie";

export interface BaseBlock {
  id: string;
  type: BlockType;
  /** When set, blocks sharing the same rowId render side-by-side in a flex row. */
  rowId?: string;
}

export interface ParagraphBlock extends BaseBlock {
  type: "paragraph";
  content: string; // Tiptap HTML
}

export interface HeadingBlock extends BaseBlock {
  type: "heading";
  level: 1 | 2 | 3;
  content: string; // Tiptap HTML
}

export type ImageAlignment = "left" | "center" | "right";

export interface ImageBlock extends BaseBlock {
  type: "image";
  src: string;
  alt?: string;
  width?: number;
  height?: number;
  alignment?: ImageAlignment;
  caption?: string;
}

export interface GraphData {
  labels: string[];
  values: number[];
}

export interface GraphBlock extends BaseBlock {
  type: "graph";
  chartType: ChartType;
  title?: string;
  data: GraphData;
}

export interface DividerBlock extends BaseBlock {
  type: "divider";
}

export interface CodeBlock extends BaseBlock {
  type: "code";
  content: string;
  language?: string;
}

export type Block =
  | ParagraphBlock
  | HeadingBlock
  | ImageBlock
  | GraphBlock
  | DividerBlock
  | CodeBlock;

export interface DocumentState {
  id: string;
  title: string;
  blocks: Block[];
  publishedAt?: string;
  slug?: string;
}
