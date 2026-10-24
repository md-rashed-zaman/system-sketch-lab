import { LinkButton } from "@/components/ui";

export default function NotFound() {
  return (
    <div className="paper-grid flex flex-1 items-center justify-center px-4 py-24">
      <div className="text-center">
        <p className="font-mono text-sm text-signal">HTTP 404 · no route to host</p>
        <h1 className="mt-3 text-5xl">This page is <em>down.</em></h1>
        <p className="mt-3 text-ink-soft">And unlike your designs, it has no replica.</p>
        <LinkButton href="/" variant="primary" className="mt-8">
          Back to the homepage
        </LinkButton>
      </div>
    </div>
  );
}
