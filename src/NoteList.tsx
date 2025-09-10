import { useMemo, useState } from "react";
import {
  Badge,
  Button,
  Card,
  Col,
  Form,
  Modal,
  Row,
  Stack,
} from "react-bootstrap";
import { Link } from "react-router-dom";
import ReactSelect from "react-select";
import type { Note, Tag } from "./App";

type SimplifiedNote = {
  id: string;
  title: string;
  tags: Tag[];
  pinned?: boolean;
};

type NoteListProps = {
  availableTags: Tag[];
  notes: Note[];
  onDeleteTag: (id: string) => void;
  onUpdateTag: (id: string, label: string) => void;
  onTogglePin?: (id: string) => void;
  darkMode?: boolean;
  onQuickDelete: (id: string) => void;
};

type EditTagsModalProps = {
  show: boolean;
  availableTags: Tag[];
  handleClose: () => void;
  onDeleteTag: (id: string) => void;
  onUpdateTag: (id: string, label: string) => void;
};

export function NoteList({
  availableTags,
  notes,
  onUpdateTag,
  onDeleteTag,
  onTogglePin,
  onQuickDelete,
}: NoteListProps) {
  const [selectedTags, setSelectedTags] = useState<Tag[]>([]);
  const [title, setTitle] = useState("");
  const [editTagsModalOpen, setEditTagsModalOpen] = useState(false);

  const filteredNotes = useMemo(() => {
    const base = notes.filter((note) => {
      return (
        (title === "" ||
          note.title.toLowerCase().includes(title.toLowerCase())) &&
        (selectedTags.length === 0 ||
          selectedTags.every((tag) =>
            note.tags.some((noteTag) => noteTag.id === tag.id)
          ))
      );
    });
    // Pinned first
    return [...base].sort((a, b) => Number(!!b.pinned) - Number(!!a.pinned));
  }, [title, selectedTags, notes]);

  return (
    <>
      <Row className="align-items-center mb-4">
        <Col>
          <h1>Notes</h1>
        </Col>
        <Col xs="auto">
          <Stack gap={2} direction="horizontal">
            <Link to="/new">
              <Button variant="primary">Create</Button>
            </Link>
            <Button
              onClick={() => setEditTagsModalOpen(true)}
              variant="outline-secondary"
            >
              Edit Tags
            </Button>
          </Stack>
        </Col>
      </Row>

      <Form>
        <Row className="mb-4">
          <Col>
            <Form.Group controlId="title">
              <Form.Label>Title</Form.Label>
              <Form.Control
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </Form.Group>
          </Col>
          <Col>
            <Form.Group controlId="tags">
              <Form.Label>Tags</Form.Label>
              <ReactSelect
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
                    (items ?? []).map((t: any) => ({
                      id: t.value,
                      label: t.label,
                    }))
                  )
                }
                isMulti
                classNamePrefix="react-select"
              />
            </Form.Group>
          </Col>
        </Row>
      </Form>

      <Row xs={1} sm={2} lg={3} xl={4} className="g-3">
        {filteredNotes.map((note) => (
          <Col key={note.id}>
            <NoteCard
              id={note.id}
              title={note.title}
              tags={note.tags}
              pinned={!!note.pinned}
              onQuickDelete={onQuickDelete}
              onTogglePin={onTogglePin}
            />
          </Col>
        ))}
      </Row>

      <EditTagsModal
        show={editTagsModalOpen}
        handleClose={() => setEditTagsModalOpen(false)}
        availableTags={availableTags}
        onUpdateTag={onUpdateTag}
        onDeleteTag={onDeleteTag}
      />
    </>
  );
}

function NoteCard({
  id,
  title,
  tags,
  pinned,
  onQuickDelete,
  onTogglePin,
}: SimplifiedNote & {
  onQuickDelete: (id: string) => void;
  onTogglePin?: (id: string) => void;
}) {
  const [hovered, setHovered] = useState(false);

  function handleDeleteClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const ok = window.confirm("Delete this note?");
    if (ok) onQuickDelete(id);
  }

  function handlePinClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    onTogglePin?.(id);
  }

  const cardStyle: React.CSSProperties = { position: "relative" };
  const deleteWrapStyle: React.CSSProperties = {
    position: "absolute",
    top: 6,
    right: 8,
    zIndex: 5,
  };
  const deleteBtnStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: 28,
    height: 28,
    borderRadius: "999px",
    backgroundColor: "#dc3545",
    color: "#fff",
    border: "none",
    fontSize: 18,
    fontWeight: 700,
    lineHeight: 1,
    cursor: "pointer",
    boxShadow: "0 1px 3px rgba(0,0,0,.25)",
    opacity: hovered ? 1 : 0,
    transform: hovered ? "scale(1)" : "scale(0.95)",
    pointerEvents: hovered ? "auto" : "none",
    transition: "opacity .15s ease, transform .15s ease, background .15s ease",
  };

  return (
    <Card
      as={Link}
      to={`/${id}`}
      className="h-100 text-reset text-decoration-none"
      style={cardStyle}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Hover-only delete button */}
      <div style={deleteWrapStyle}>
        <button
          type="button"
          aria-label="Delete note"
          title="Delete note"
          style={deleteBtnStyle}
          onClick={handleDeleteClick}
        >
          &times;
        </button>
      </div>

      <Card.Body>
        <Stack gap={2} className="align-items-center justify-content-center h-100">
          <span className="fs-5">
            {pinned ? "📌 " : ""}
            {title}
          </span>

          {tags.length > 0 && (
            <Stack gap={1} direction="horizontal" className="flex-wrap">
              {tags.map((tag) => (
                <Badge className="text-truncate" key={tag.id}>
                  {tag.label}
                </Badge>
              ))}
            </Stack>
          )}

          {onTogglePin && (
            <div className="w-100 mt-2">
              <Button
                size="sm"
                variant={pinned ? "warning" : "outline-secondary"}
                onClick={handlePinClick}
              >
                {pinned ? "Unpin" : "Pin"}
              </Button>
            </div>
          )}
        </Stack>
      </Card.Body>
    </Card>
  );
}

function EditTagsModal({
  availableTags,
  show,
  handleClose,
  onDeleteTag,
  onUpdateTag,
}: EditTagsModalProps) {
  return (
    <Modal show={show} onHide={handleClose}>
      <Modal.Header closeButton>
        <Modal.Title>Edit Tags</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form>
          <Stack gap={2}>
            {availableTags.map((tag) => (
              <Row key={tag.id}>
                <Col>
                  <Form.Control
                    type="text"
                    value={tag.label}
                    onChange={(e) => onUpdateTag(tag.id, e.target.value)}
                  />
                </Col>
                <Col xs="auto">
                  <Button
                    onClick={() => onDeleteTag(tag.id)}
                    variant="outline-danger"
                  >
                    &times;
                  </Button>
                </Col>
              </Row>
            ))}
          </Stack>
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={handleClose}>
          Close
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
