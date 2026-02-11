export interface Shortcut {
  keys: string;
  label: string;
  section: string;
}

export const SHORTCUTS: Shortcut[] = [
  // Navigation
  { keys: "↑/k", label: "Move up", section: "Navigation" },
  { keys: "↓/j", label: "Move down", section: "Navigation" },
  { keys: "/", label: "Focus filter", section: "Navigation" },
  { keys: "Esc", label: "Close filter", section: "Navigation" },

  // Detail Pane
  { keys: "r", label: "Toggle request/response", section: "Detail Pane" },
  { keys: "h", label: "Toggle headers", section: "Detail Pane" },
  { keys: "u", label: "Scroll up", section: "Detail Pane" },
  { keys: "d", label: "Scroll down", section: "Detail Pane" },

  // Actions
  { keys: "b", label: "Bookmark request", section: "Actions" },
  { keys: "B", label: "Toggle bookmarks filter", section: "Actions" },
  { keys: "x", label: "Copy as cURL", section: "Actions" },
  { keys: "e", label: "Export requests", section: "Actions" },
  { keys: "c", label: "Clear requests", section: "Actions" },

  // General
  { keys: "p", label: "Pause capture", section: "General" },
  { keys: "?", label: "Show help", section: "General" },
  { keys: "q", label: "Quit", section: "General" },
];

export const SECTIONS = ["Navigation", "Detail Pane", "Actions", "General"] as const;
