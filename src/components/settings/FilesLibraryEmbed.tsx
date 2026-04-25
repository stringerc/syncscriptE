/**
 * Embeds the existing FilesLibraryPage inside Settings → Files. Lets us "move"
 * the library into Settings (per the redesign brief) without rewriting the
 * full library UI. The /library top-level URL still works (we keep it for
 * deep links and backwards compat), but the sidebar now points users at Settings.
 */
import { lazy, Suspense } from 'react';

const FilesLibraryPage = lazy(() =>
  import('../pages/FilesLibraryPage').then((m) => ({ default: m.FilesLibraryPage })),
);

export function FilesLibraryEmbed() {
  return (
    <div className="-mt-2">
      <Suspense fallback={<div className="text-xs text-gray-500 p-6 text-center">Loading library…</div>}>
        <FilesLibraryPage />
      </Suspense>
    </div>
  );
}
