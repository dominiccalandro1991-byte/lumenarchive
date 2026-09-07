# Test Plan

1. Type safety: `pnpm exec tsc --noEmit`.
2. Build: `pnpm build`.
3. Domain checks: seed counts, validators, release gates, change-request protection.
4. Navigation: every documented route renders and unknown IDs show a missing state.
5. Accessibility: headings, landmarks, labels, focus-visible controls, keyboard dialog behavior, color contrast, reduced motion.
6. Responsive: 320px, 390px, 430px, tablet, desktop; no horizontal overflow.
7. Manual future checks: external AI, voice, image/video generation, publishing, auth, database, payment, and storage integrations remain unconnected.
