# Microwebsite Builder (Notion-Style Editor)

Build a Notion-style microwebsite builder using:

- Next.js
- React
- TypeScript
- TailwindCSS
- Tiptap (open-source editor framework)

The application should allow users to create a small webpage by composing blocks such as text, images, and graphs.

---

# 1. Editor Engine

Use Tiptap as the editor framework.

Requirements:

- Use the Tiptap React integration.
- Configure the editor with appropriate extensions.
- Support creation of custom node extensions.
- Use the Tiptap JSON document model for storing editor content.
- Ensure compatibility with server-side rendering environments.
- Disable immediate rendering to prevent hydration issues.

---

# 2. Block-Based Content Model

The editor must operate as a block-based system.

Requirements:

- Each piece of content is represented as a block node.
- Blocks should be stored as structured JSON.
- The system should allow extension with new block types.
- Blocks must support editing, insertion, deletion, and reordering.

Supported block types:

- paragraph
- heading
- list
- image
- graph
- code
- divider

---

# 3. Text Formatting

The editor must support common text formatting.

Required formatting features:

- headings
- paragraphs
- bold
- italic
- bullet lists
- ordered lists
- code blocks
- block quotes

Requirements:

- Provide toolbar controls for formatting.
- Provide keyboard shortcuts for common formatting actions.
- Allow inline editing within blocks.

---

# 4. Slash Command Menu

The editor must support a slash command menu.

Requirements:

- Triggered when the user types `/`.
- The menu should appear near the cursor.
- The menu should list available block types.
- Selecting an item should insert the corresponding block.
- The menu should be keyboard navigable.

Supported commands should include block creation options such as text, headings, images, graphs, dividers, and code blocks.

---

# 5. Image Block

Users must be able to insert images.

Requirements:

- Support local file upload.
- Support drag and drop image insertion.
- Display images directly within the editor.
- Allow resizing and alignment adjustments.

Implementation requirements:

- The image block must be implemented as a custom Tiptap node extension.
- Image metadata should be stored as node attributes.

---

# 6. Graph Block

Users must be able to insert graphs into the document.

Requirements:

- Support multiple chart types.
- Allow editing of graph datasets.
- Render graphs directly inside the editor.
- Update graph rendering when data changes.

Implementation requirements:

- Implement the graph block as a custom Tiptap node extension.
- Integrate a chart rendering library for visualization.

---

# 7. Floating Block Controls

Each block should display controls when hovered.

Requirements:

- Display controls to add a block.
- Display controls to drag and reorder blocks.
- Display controls to delete blocks.

Controls should appear along the left side of the block.

---

# 8. Instant Block Add Menu

When a user clicks on an empty space between blocks, display a quick add menu.

Requirements:

- Allow inserting new blocks quickly.
- Provide block options such as text, heading, image, and graph.
- The menu should appear close to the click location.

---

# 9. Live Microsite Preview

Provide a preview panel showing how the microwebsite will render.

Requirements:

- Render formatted text.
- Render images.
- Render graphs.
- Update the preview automatically when editor content changes.

---

# 10. Publish Microsite

Allow users to publish the document as a public webpage.

Requirements:

- Save editor content as JSON.
- Convert block content into rendered HTML components.
- Serve the published page via a route.

---

# 11. UI Layout

The interface should contain the following sections:

- Toolbar
- Editor area
- Preview panel

Requirements:

- The editor and preview should be displayed side by side.
- The layout should remain responsive across screen sizes.

---

# 12. Technology Stack

Frontend:

- Next.js
- React
- TypeScript
- TailwindCSS

Editor:

- Tiptap

Charts:

- Chart rendering library compatible with React

Image Handling:

- Local upload or API-based storage

---

# 13. Optional Enhancements

Potential advanced features may include:

- drag and drop block reordering
- reusable templates
- markdown import
- embedded media support
- theme customization
- tables

---

# Goal

Create a lightweight Notion-style microwebsite builder that allows users to visually compose and publish a webpage using blocks powered by Tiptap.