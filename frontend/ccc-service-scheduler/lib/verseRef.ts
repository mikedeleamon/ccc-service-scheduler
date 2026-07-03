export type VerseRef = {
    book: string;
    chapter: string;
    startVerse: string;
    endVerse: string;
};

export const emptyVerseRef: VerseRef = { book: '', chapter: '', startVerse: '', endVerse: '' };

const VERSE_REF_PATTERN = /^(\d?\s*[A-Za-z][A-Za-z .]*?)\s+(\d+)\s*:\s*(\d+)(?:\s*-\s*(\d+))?$/;

/** Parses "Exodus 1:2-5" (or "Exodus 1:2") into its parts. Falls back to an
 * empty ref (with the raw text as the book) if the string doesn't match. */
export function parseVerseRef(text: string): VerseRef {
    const trimmed = text.trim();
    if (!trimmed) return { ...emptyVerseRef };
    const match = trimmed.match(VERSE_REF_PATTERN);
    if (!match) return { ...emptyVerseRef, book: trimmed };
    const [, book, chapter, startVerse, endVerse] = match;
    return { book: book.trim(), chapter, startVerse, endVerse: endVerse ?? '' };
}

export function composeVerseRef(ref: VerseRef): string {
    if (!ref.book.trim() || !ref.chapter || !ref.startVerse) return '';
    const range = ref.endVerse && ref.endVerse !== ref.startVerse ? `${ref.startVerse}-${ref.endVerse}` : ref.startVerse;
    return `${ref.book.trim()} ${ref.chapter}:${range}`;
}

export function isCompleteVerseRef(ref: VerseRef): boolean {
    return !!(ref.book.trim() && ref.chapter && ref.startVerse);
}
