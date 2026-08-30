"use client";

import React, { useState } from "react";
import { IncidentNote } from "../types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { MessageSquare, Plus, Send, FileText } from "lucide-react";
import { useAddIncidentNote, useIncidentNotes } from "../hooks";
import { NOTE_TYPES } from "../constants";

interface IncidentNotesSectionProps {
  incidentId: string;
}

export function IncidentNotesSection({ incidentId }: IncidentNotesSectionProps) {
  const { data: notes = [], isLoading } = useIncidentNotes(incidentId);
  const [noteType, setNoteType] = useState("FINDING");
  const [content, setContent] = useState("");

  const addNoteMutation = useAddIncidentNote();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    await addNoteMutation.mutateAsync({
      incidentId,
      payload: {
        note_type: noteType as any,
        content: content.trim(),
      },
    });

    setContent("");
  };

  return (
    <Card className="bg-slate-900/60 border-slate-800 shadow-xl backdrop-blur-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-bold text-white flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-indigo-400" />
          Structured Investigation Notes & Findings
        </CardTitle>
        <CardDescription className="text-xs text-slate-400">
          Append-only forensic observations, attacker hypotheses, and remediation notes.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleSubmit} className="p-3 bg-slate-950/70 rounded-lg border border-slate-800 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-slate-400">Note Category:</span>
            <select
              value={noteType}
              onChange={(e) => setNoteType(e.target.value)}
              className="h-8 px-2.5 rounded bg-slate-900 border border-slate-700 text-slate-200 text-xs focus:outline-none"
            >
              {NOTE_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Record evidence string, process hierarchy, or lateral movement indicator..."
            rows={3}
            required
            className="bg-slate-900 border-slate-800 text-xs text-slate-200 resize-none"
          />

          <div className="flex justify-end">
            <Button
              type="submit"
              size="sm"
              disabled={addNoteMutation.isPending}
              className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs gap-1.5 h-8"
            >
              <Send className="w-3.5 h-3.5" />
              {addNoteMutation.isPending ? "Appending..." : "Post Investigation Note"}
            </Button>
          </div>
        </form>

        <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
          {isLoading ? (
            <div className="py-6 text-center text-xs text-slate-500">Loading notes...</div>
          ) : notes.length === 0 ? (
            <div className="py-6 text-center text-xs text-slate-500">No notes recorded yet.</div>
          ) : (
            notes.map((note) => (
              <div key={note.id} className="p-3 bg-slate-950/70 rounded-lg border border-slate-800 text-xs space-y-1.5">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="text-[10px] border-indigo-800 bg-indigo-950/50 text-indigo-300">
                    {note.note_type}
                  </Badge>
                  <span className="font-mono text-slate-500 text-[11px]">
                    {new Date(note.created_at).toLocaleTimeString()}
                  </span>
                </div>
                <p className="text-slate-200 leading-relaxed text-xs">{note.content}</p>
                <div className="pt-1 text-[11px] text-slate-400 font-medium">Author: {note.author}</div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
