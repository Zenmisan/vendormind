# Specification — Conversation Filters & Stand-down Classifier

## Problem
1. **Missed WhatsApp Messages**: If customers send messages that are formatted differently by WhatsApp (e.g. ephemeral messages, view-once media, document captions, or extended text), the bot fails to extract the text and ignores the message.
2. **Personal Chit-Chat Intrusion**: The sales bot responds to all incoming messages indiscriminately, which annoys vendors when friends or family reach out for casual, non-business conversations on the same linked WhatsApp number.

## Proposed Changes
1. **WhatsApp Message Extraction**: Add a recursive `extractMessageText` helper in [worker.ts](file:///home/zenmi/Projects/vendormind/src/fleet/worker.ts) to parse conversation texts from all standard, ephemeral, view-once, and captioned document formats.
2. **LLM Classification**: Implement a classifier prompt in `AgentService.isBusinessConversation` to classify messages as either `BUSINESS` (greetings, product/catalog queries, payments) or `PERSONAL` (casual chit-chat).
3. **Session Check & Stand-down**:
   - If the user has no active business session (no recent messages in context and no items in cart) and the message is classified as `PERSONAL`, the agent returns `__STAND_DOWN__`.
   - The inbound processor worker stops execution early upon receiving `__STAND_DOWN__` without queueing outbound replies or deducting billing credits.
