import { AtSign, Car, Database, FileText, Film, FolderSync, Inbox, MessageCircle, Radio, Server, ShieldCheck, Ticket, Video, Zap, type LucideIcon } from "lucide-react";

export const CHAPTER_ICONS: Record<number, LucideIcon> = { 1: Server, 2: Zap, 3: Database, 4: Inbox, 5: ShieldCheck, 6: Radio };

export const CASE_ICONS: Record<string, LucideIcon> = {
  uber: Car,
  whatsapp: MessageCircle,
  netflix: Film,
  twitter: AtSign,
  youtube: Video,
  dropbox: FolderSync,
  ticketmaster: Ticket,
  "google-docs": FileText,
};
