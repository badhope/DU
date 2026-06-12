/** 笔记 store */
import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Note } from './types'

export const useNotesStore = defineStore('notes', () => {
  const notes = ref<Note[]>([])

  function addNote(n: Omit<Note, 'id' | 'time' | 'updateTime'>, onNoteCount?: (count: number) => void): Note {
    const it: Note = {
      ...n,
      id: `note-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      time: Date.now(),
      updateTime: Date.now(),
    }
    notes.value.unshift(it)
    if (onNoteCount) onNoteCount(notes.value.length)
    return it
  }

  function updateNote(id: string, patch: Partial<Note>) {
    const n = notes.value.find((x) => x.id === id)
    if (n) {
      Object.assign(n, patch, { updateTime: Date.now() })
    }
  }

  function removeNote(id: string) {
    notes.value = notes.value.filter((n) => n.id !== id)
  }

  function reset() {
    notes.value = []
  }

  return {
    notes,
    addNote,
    updateNote,
    removeNote,
    reset,
  }
})
