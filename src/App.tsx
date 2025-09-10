import "bootstrap/dist/css/bootstrap.min.css";
import "./darkmode.css";

import { Container, Button, Stack } from "react-bootstrap";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { NewNote } from "./NewNote";
import { useState, useEffect, useMemo, useCallback } from "react";
import { v4 as uuidV4 } from "uuid";
import { NoteList } from "./NoteList";
import { NoteLayout } from "./NoteLayout";
import { Note } from "./Note";
import { EditNote } from "./EditNote";

export type Note = { id: string } & NoteData;
export type RawNote = { id: string } & RawNoteData;

export type RawNoteData = {
  title: string;
  markdown: string;
  tagIds: string[];
  pinned?: boolean;
};

export type NoteData = {
  title: string;
  markdown: string;
  tags: Tag[];
  pinned?: boolean;
};

export type Tag = {
  id: string;
  label: string;
};

const API_BASE =
  (import.meta as any)?.env?.VITE_API_BASE?.toString() || "http://localhost:4000";

function App() {
  const [notes, setNotes] = useState<RawNote[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem("dm");
    if (saved === "1") return true;
    if (saved === "0") return false;
    return window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? false;
  });
  const location = useLocation();

  // theme
  useEffect(() => {
    const theme = darkMode ? "dark" : "light";
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("dm", darkMode ? "1" : "0");
  }, [darkMode]);

  // fetchers
  const fetchNotes = useCallback(async () => {
    const res = await fetch(`${API_BASE}/notes`);
    const data = await res.json();
    setNotes(
      data.map((n: any) => ({
        id: n.id,
        title: n.title,
        markdown: n.markdown,
        pinned: !!n.pinned,
        tagIds: Array.isArray(n.tagIds) ? n.tagIds : [],
      }))
    );
  }, []);

  const fetchTags = useCallback(async () => {
    const res = await fetch(`${API_BASE}/tags`);
    const data = await res.json();
    setTags(data);
  }, []);

  useEffect(() => {
    fetchNotes();
    fetchTags();
  }, [fetchNotes, fetchTags]);

  useEffect(() => {
    if (location.pathname === "/") fetchNotes();
  }, [location.pathname, fetchNotes]);

  // fallback event (direct POST)
  useEffect(() => {
    function handleCreated(e: any) {
      const newNote = e.detail as RawNote;
      setNotes((prev) => [...prev, newNote]);
    }
    window.addEventListener("notes:created", handleCreated as any);
    return () => window.removeEventListener("notes:created", handleCreated as any);
  }, []);

  const notesWithTags = useMemo(() => {
    return notes.map((note) => ({
      ...note,
      tags: tags.filter((tag) => note.tagIds?.includes(tag.id)),
    }));
  }, [notes, tags]);

  // CREATE
  async function onCreateNote({ tags, ...data }: NoteData) {
    const newNote: RawNote = {
      ...data,
      id: uuidV4(),
      tagIds: tags.map((t) => t.id),
      pinned: data.pinned ?? false,
    };
    const res = await fetch(`${API_BASE}/notes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: newNote.id,
        title: newNote.title,
        markdown: newNote.markdown,
        pinned: newNote.pinned ? 1 : 0,
        tagIds: newNote.tagIds,
      }),
    });
    if (!res.ok) throw new Error(`POST failed ${res.status}`);
    await fetchNotes();
    return { success: true };
  }

  // UPDATE
  async function onUpdateNote(id: string, { tags, ...data }: NoteData) {
    const res = await fetch(`${API_BASE}/notes/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: data.title,
        markdown: data.markdown,
        pinned: data.pinned ? 1 : 0,
        tagIds: tags.map((t) => t.id),
      }),
    });
    if (!res.ok) throw new Error(`PUT failed ${res.status}`);
    await fetchNotes();
    return { success: true };
  }

  // DELETE
  async function onDeleteNote(id: string) {
    await fetch(`${API_BASE}/notes/${id}`, { method: "DELETE" }).catch(() => {});
    setNotes((prev) => prev.filter((n) => n.id !== id));
  }

  // TAGS
  async function addTag(tag: Tag) {
    await fetch(`${API_BASE}/tags`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(tag),
    }).catch(() => {});
    setTags((prev) => [...prev, tag]);
  }

  function updateTag(id: string, label: string) {
    setTags((prev) => prev.map((t) => (t.id === id ? { ...t, label } : t)));
  }

  async function deleteTag(id: string) {
    await fetch(`${API_BASE}/tags/${id}`, { method: "DELETE" }).catch(() => {});
    setTags((prev) => prev.filter((t) => t.id !== id));
    setNotes((prev) =>
      prev.map((n) => ({ ...n, tagIds: n.tagIds.filter((tid) => tid !== id) }))
    );
  }

  async function togglePin(id: string) {
    const note = notes.find((n) => n.id === id);
    if (!note) return;
    const newPinned = !note.pinned;

    await fetch(`${API_BASE}/notes/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: note.title,
        markdown: note.markdown,
        pinned: newPinned ? 1 : 0,
        tagIds: note.tagIds,
      }),
    }).catch(() => {});

    await fetchNotes();
  }

  return (
    <Container className="my-4 app-container" fluid>
      <Stack direction="horizontal" className="mb-4 justify-content-between">
        <h2> Notes App</h2>
        <Button
          variant={darkMode ? "secondary" : "dark"}
          onClick={() => setDarkMode((v) => !v)}
        >
          {darkMode ? "Light Mode" : "Dark Mode"}
        </Button>
      </Stack>

      <Routes>
        <Route
          path="/"
          element={
            <NoteList
              notes={notesWithTags}
              availableTags={tags}
              onUpdateTag={updateTag}
              onDeleteTag={deleteTag}
              onTogglePin={togglePin}
              darkMode={darkMode}
              onQuickDelete={onDeleteNote}
            />
          }
        />
        <Route
          path="/new"
          element={
            <NewNote
              onSubmit={onCreateNote}
              onAddTag={addTag}
              availableTags={tags}
            />
          }
        />
        <Route path="/:id" element={<NoteLayout notes={notesWithTags} />}>
          <Route index element={<Note onDelete={onDeleteNote} />} />
          <Route
            path="edit"
            element={
              <EditNote
                onSubmit={onUpdateNote}
                onAddTag={addTag}
                availableTags={tags}
              />
            }
          />
        </Route>
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Container>
  );
}

export default App;
