import DOMPurify from 'isomorphic-dompurify';

/** Strip all HTML tags and attributes from a user-supplied string. */
export function sanitize(input: string | undefined | null): string {
  if (!input) return '';
  return DOMPurify.sanitize(input, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
}
