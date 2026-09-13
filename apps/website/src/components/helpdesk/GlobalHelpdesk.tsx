import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { HelpdeskTrigger } from './HelpdeskTrigger';
import { useHelpdeskChat } from './useHelpdeskChat';

// The trigger button must load instantly on every route; the full chat
// surface (markdown rendering, message list, composer) is only needed once
// a user actually opens it.
const HelpdeskPanel = lazy(() => import('./HelpdeskPanel').then((m) => ({ default: m.HelpdeskPanel })));

/**
 * Mounted once at the application root (see App.tsx), outside <Routes> —
 * this is what keeps the floating "+" and any in-progress conversation
 * available across every route without per-page duplication.
 */
export function GlobalHelpdesk() {
  const [isOpen, setIsOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const chat = useHelpdeskChat();

  useEffect(() => {
    if (!isOpen) return;

    function handleOutsideClick(e: MouseEvent) {
      const target = e.target as Node;
      if (panelRef.current?.contains(target)) return;
      if (triggerRef.current?.contains(target)) return;
      setIsOpen(false);
    }
    function handleEscape(e: globalThis.KeyboardEvent) {
      if (e.key === 'Escape') setIsOpen(false);
    }

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  return (
    <>
      <div ref={triggerRef}>
        <HelpdeskTrigger isOpen={isOpen} onClick={() => setIsOpen((v) => !v)} />
      </div>

      {isOpen && (
        <Suspense fallback={null}>
          <HelpdeskPanel
            panelRef={panelRef}
            messages={chat.messages}
            isSubmitting={chat.isSubmitting}
            onSubmit={chat.submit}
            onRetry={chat.retry}
            onClose={() => setIsOpen(false)}
          />
        </Suspense>
      )}
    </>
  );
}
