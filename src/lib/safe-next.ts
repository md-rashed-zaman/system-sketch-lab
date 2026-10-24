/** Only same-site relative paths are allowed as post-login destinations (prevents open redirects). */
export function safeNext(next: string | undefined): string {
  return next && next.startsWith("/") && !next.startsWith("//") && !next.startsWith("/\\") ? next : "/learn";
}
