import { useRef, useState } from "react";
import { Button, Col, Form, Row, Stack } from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import CreatableSelect from "react-select/creatable";
import type { NoteData, Tag } from "./App";
import { v4 as uuidV4 } from "uuid";

type NoteFormProps = {
  onSubmit: (data: NoteData) => Promise<any>;
  onAddTag: (tag: Tag) => void;
  availableTags: Tag[];
  noteId?: string;
} & Partial<NoteData>;

const API_BASE =
  (import.meta as any)?.env?.VITE_API_BASE?.toString() || "http://localhost:4000";

export function NoteForm({
  onSubmit,
  onAddTag,
  availableTags,
  noteId,
  title = "",
  markdown = "",
  tags = [],
}: NoteFormProps) {
  const titleRef = useRef<HTMLInputElement>(null);
  const markdownRef = useRef<HTMLTextAreaElement>(null);
  const [selectedTags, setSelectedTags] = useState<Tag[]>(tags);
  const navigate = useNavigate();

  async function submitNow() {
    const t = titleRef.current?.value?.trim() ?? "";
    const m = markdownRef.current?.value?.trim() ?? "";
    if (!t || !m) return;

    try {
      const result = await onSubmit({ title: t, markdown: m, tags: selectedTags });
      if (!result || result.success !== true) throw new Error("save failed");
    } catch {
      if (noteId) {
        try {
          await fetch(`${API_BASE}/notes/${noteId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              title: t,
              markdown: m,
              pinned: 0,
              tagIds: selectedTags.map(s => s.id),
            }),
          });
        } catch {}
      } else {
        const id = uuidV4();
        try {
          await fetch(`${API_BASE}/notes`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              id,
              title: t,
              markdown: m,
              pinned: 0,
              tagIds: selectedTags.map(s => s.id),
            }),
          });
        } catch {}
        window.dispatchEvent(
          new CustomEvent("notes:created", {
            detail: {
              id,
              title: t,
              markdown: m,
              pinned: false,
              tagIds: selectedTags.map(s => s.id),
            },
          })
        );
      }
    }

    navigate("/");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await submitNow();
  }

  return (
    <Form onSubmit={handleSubmit} noValidate>
      <Stack gap={4}>
        <Row>
          <Col>
            <Form.Group controlId="title">
              <Form.Label>Title</Form.Label>
              <Form.Control ref={titleRef} required defaultValue={title} />
            </Form.Group>
          </Col>
          <Col>
            <Form.Group controlId="tags">
              <Form.Label>Tags</Form.Label>
              <CreatableSelect
                onCreateOption={(label) => {
                  const newTag = { id: uuidV4(), label };
                  onAddTag(newTag);
                  setSelectedTags((prev) => [...prev, newTag]);
                }}
                value={selectedTags.map((tag) => ({
                  label: tag.label,
                  value: tag.id,
                }))}
                options={availableTags.map((tag) => ({
                  label: tag.label,
                  value: tag.id,
                }))}
                onChange={(items: any) =>
                  setSelectedTags(
                    (items ?? []).map((tag: any) => ({
                      id: tag.value,
                      label: tag.label,
                    }))
                  )
                }
                isMulti
                classNamePrefix="react-select"
              />
            </Form.Group>
          </Col>
        </Row>

        <Form.Group controlId="markdown">
          <Form.Label>Body</Form.Label>
        <Form.Control
            defaultValue={markdown}
            required
            as="textarea"
            ref={markdownRef}
            rows={15}
          />
        </Form.Group>

        <Stack direction="horizontal" gap={2} className="justify-content-end">
          <Button type="button" variant="primary" onClick={submitNow}>
            Save
          </Button>
          <Link to="/">
            <Button type="button" variant="outline-secondary">
              Cancel
            </Button>
          </Link>
        </Stack>
      </Stack>
    </Form>
  );
}
