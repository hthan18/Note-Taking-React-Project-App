import express from "express";
import cors from "cors";
import sqlite3 from "sqlite3";

const app = express();
app.use(cors());
app.use(express.json());

const db = new sqlite3.Database("notes.db", err => {
  if (err) console.error("DB error:", err.message);
  else console.log("Connected to SQLite database.");
});

// Ensure FKs work
db.serialize(() => {
  db.run("PRAGMA foreign_keys = ON");

  db.run(`
    CREATE TABLE IF NOT EXISTS notes (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      markdown TEXT NOT NULL,
      pinned INTEGER NOT NULL DEFAULT 0
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS tags (
      id TEXT PRIMARY KEY,
      label TEXT NOT NULL
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS note_tags (
      note_id TEXT NOT NULL,
      tag_id TEXT NOT NULL,
      PRIMARY KEY (note_id, tag_id),
      FOREIGN KEY(note_id) REFERENCES notes(id) ON DELETE CASCADE,
      FOREIGN KEY(tag_id) REFERENCES tags(id) ON DELETE CASCADE
    )
  `);
});

// NOTES
app.get("/notes", (req, res) => {
  db.all("SELECT id, title, markdown, pinned FROM notes", [], (err, notes) => {
    if (err) return res.status(500).json({ error: err.message });
    db.all("SELECT note_id, tag_id FROM note_tags", [], (e2, rows) => {
      if (e2) return res.status(500).json({ error: e2.message });
      const byNote = new Map();
      rows.forEach(r => {
        if (!byNote.has(r.note_id)) byNote.set(r.note_id, []);
        byNote.get(r.note_id).push(r.tag_id);
      });
      const out = notes.map(n => ({
        id: n.id,
        title: n.title,
        markdown: n.markdown,
        pinned: !!n.pinned,
        tagIds: byNote.get(n.id) ?? [],
      }));
      res.json(out);
    });
  });
});

app.post("/notes", (req, res) => {
  const { id, title, markdown, pinned, tagIds } = req.body;
  if (!id || !title || !markdown) {
    return res.status(400).json({ error: "id, title, markdown are required" });
  }
  db.serialize(() => {
    db.run(
      "INSERT INTO notes (id, title, markdown, pinned) VALUES (?, ?, ?, ?)",
      [id, title, markdown, pinned ? 1 : 0],
      err => {
        if (err) return res.status(500).json({ error: err.message });

        if (Array.isArray(tagIds) && tagIds.length) {
          const stmt = db.prepare(
            "INSERT OR IGNORE INTO note_tags (note_id, tag_id) VALUES (?, ?)"
          );
          tagIds.forEach(tid => stmt.run(id, tid));
          stmt.finalize();
        }
        res.json({ success: true });
      }
    );
  });
});

app.put("/notes/:id", (req, res) => {
  const noteId = req.params.id;
  const { title, markdown, pinned, tagIds } = req.body;
  db.serialize(() => {
    db.run(
      "UPDATE notes SET title = ?, markdown = ?, pinned = ? WHERE id = ?",
      [title, markdown, pinned ? 1 : 0, noteId],
      err => {
        if (err) return res.status(500).json({ error: err.message });

        // replace tag links
        db.run("DELETE FROM note_tags WHERE note_id = ?", [noteId], e2 => {
          if (e2) return res.status(500).json({ error: e2.message });

          if (Array.isArray(tagIds) && tagIds.length) {
            const stmt = db.prepare(
              "INSERT OR IGNORE INTO note_tags (note_id, tag_id) VALUES (?, ?)"
            );
            tagIds.forEach(tid => stmt.run(noteId, tid));
            stmt.finalize();
          }
          res.json({ success: true });
        });
      }
    );
  });
});

app.delete("/notes/:id", (req, res) => {
  const id = req.params.id;
  db.serialize(() => {
    db.run("DELETE FROM note_tags WHERE note_id = ?", [id], () => {
      db.run("DELETE FROM notes WHERE id = ?", [id], err => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
      });
    });
  });
});

// TAGS
app.get("/tags", (req, res) => {
  db.all("SELECT id, label FROM tags", [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post("/tags", (req, res) => {
  const { id, label } = req.body;
  if (!id || !label)
    return res.status(400).json({ error: "id and label required" });
  db.run("INSERT OR IGNORE INTO tags (id, label) VALUES (?, ?)", [id, label], err => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

app.put("/tags/:id", (req, res) => {
  const id = req.params.id;
  const { label } = req.body;
  db.run("UPDATE tags SET label = ? WHERE id = ?", [label, id], err => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

app.delete("/tags/:id", (req, res) => {
  const id = req.params.id;
  db.run("DELETE FROM tags WHERE id = ?", [id], err => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

const PORT = 4000;
app.listen(PORT, () => {
  console.log(`Backend running at http://localhost:${PORT}`);
});
