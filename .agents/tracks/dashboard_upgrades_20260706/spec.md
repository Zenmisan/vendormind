# Spec: Dashboard Upgrades

## Goal
Enhance the front-end user experience and add a crucial missing feature: the ability for human agents to manually chat with customers from the dashboard during handoff. Visuals will draw directly from the Pinterest design inspiration files inside the `inspo/` directory.

## Scope

1. **Interactive Manual Handoff Chat**:
   - Create a backend `POST /vendors/:id/conversations/:customerId/messages` endpoint to enqueue messages to the WhatsApp BullMQ queue and write message history to the database.
   - Refactor the front-end conversation details view to include an input chat box and a send button, enabling instant message delivery.
2. **Onboarding Wizard Enhancements**:
   - Re-layout the onboarding steppers to use a left-hand vertical progression pane styled like `inspo/01.jpeg`.
3. **Overview Dashboard Styling Polish**:
   - Implement border enhancements and visual spacing metrics inspired by the dark theme cards in `inspo/2.jpeg`.
