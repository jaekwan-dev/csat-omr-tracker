# Project Rules

- **Documentation Storage**: All implementation plans, analysis reports, walkthroughs, and system architectures created during conversations MUST be written to or copied into the docs/ directory within the project workspace to maintain a permanent historical record.
- **README Maintenance**: Whenever a new feature is implemented, the README.md file MUST be updated to reflect the new capabilities, architecture changes, or setup instructions.

## UI/UX Design Guidelines (Standardized via Exam Management Screen)

When creating or modifying screens, strictly adhere to the following design points:

1. **Framework & Styling**: Use **Tailwind CSS (v4)** and **Shadcn-like components** built on top of `@base-ui/react`.
2. **Theme Colors (`globals.css`)**:
   - **Background**: Neutral warm off-white (Light) / Dark navy (Dark).
   - **Sidebar**: Deep Navy theme with sky-blue primary accents.
   - **Subject Point Colors**: Use defined CSS variables (`--color-subject-korean` [Purple], `--color-subject-math` [Amber], `--color-subject-english` [Blue]).
3. **Dynamic Styling (`color-mix`)**: Use CSS `color-mix` to create soft backgrounds that match the text/border color.
   - Example: `style={{ background: \`color-mix(in oklch, ${cfg.colorVar} 14%, transparent)\`, color: cfg.colorVar }}`
4. **Layout & Grouping**:
   - Use `Card` components for logically grouping form sections and data.
   - Use Sticky Headers/Cards (`sticky top-* z-40`) for critical action buttons (Save/Submit) or live summary data (e.g., Score Progress).
5. **Forms**: Use the custom `Field`, `FieldGroup`, and `FieldLabel` components (`src/components/ui/field.tsx`) to maintain consistent form input layouts.
6. **Responsive Design**: Ensure mobile support by hiding secondary table columns on smaller screens (e.g., `hidden md:table-cell`) and utilizing flexible grid layouts (`grid-cols-1 md:grid-cols-12`).
7. **User Feedback**:
   - **Toasts**: Always use `sonner` (`toast.success`, `toast.error`) for API mutation feedback.
   - **Alerts**: Use `Alert` component for form validation errors.
   - **Destructive Actions**: Always wrap deletes in an `AlertDialog` for explicit user confirmation.
8. **Empty States**: Use the `Empty` component (`src/components/ui/empty.tsx`) to display a friendly message and a call-to-action when lists/tables have no data.
9. **Interactive Elements**:
   - Provide micro-interactions (e.g., hover states, scale on active, transition animations).
   - When using `Button` with a `Link` via the `render` prop, always pass `nativeButton={false}` to satisfy `@base-ui/react` semantic constraints.
