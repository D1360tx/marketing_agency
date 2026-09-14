# Website-first V2: see the direction before committing

Status: proposed, local review artifact. This does not activate or replace the authoritative offer.

## Strategic decision

The first decision is whether to request a tailored homepage concept, not whether to hire an agency. The hero states the mechanism directly: “See the website we’d build for your business. Before you hire us.” The consistent CTA is **Request My Homepage Concept**.

Qualified/accepted businesses receive a homepage visual direction, a recommended page map and a fixed scope/price. Business fit is confirmed by email before concept preparation. This is not a complete free website or an automatic entitlement for every submission. Approval and a 50% deposit start the full build; the balance is due before launch. Optional expansions are independent decisions.

The sequence is concept → actual deliverables → homeowner/referral/search context → agreed build scope → payment milestones → optional support → fit/objections → short request. It takes the shared-brain memo’s tangible deliverable and connected customer-path argument without importing its older recurring offer or promises.

## Art direction

- Bone paper, ink/charcoal, muted cabinet-green artwork and warm amber reserved primarily for action and payment milestones.
- An oversized editorial sans headline with a contrasting Georgia italic commitment line. Existing Geist and system Georgia only; no font/package downloads.
- A deliberately typeset Booked Out wordmark and square arrow mark.
- One large presentation board rather than a generic hero card. A fictional Fieldwork Heating & Air homepage shows service-specific copy, an original SVG condenser illustration, desktop/mobile layers and contact annotations. It is visibly labeled illustrative and not a client project.
- Numbered section rails connect the story. The concept is an editorial list; the homeowner path is a dark visual explanation; the page map is a compact scope artifact; amber payment milestones mark the commitment boundary. No testimonial or invented-results blocks.
- Brief-to-concept note fills the otherwise detached left side of the deliverable section with relevant information rather than decoration.
- Motion is limited to the mobile-layer entrance and CTA feedback. Reduced-motion preferences remove animation and transitions. Screenshot capture finishes animations to avoid translucent in-progress device captures.

## Copy panel

This is a role-based editorial assessment performed during implementation, not interviews with external experts, customer research or measured conversion performance. Scores reflect editorial judgment, not evidence of uplift.

| Review lens | First-pass concern | Revision | Final score |
|---|---|---|---|
| Conversion copywriter | A generic site plan does not justify a cold request. The draft needs a tangible pre-deposit deliverable. | Concept, page map and quote are named immediately; the CTA names the concept; payment comes after approval. | 9/10 |
| Skeptical HVAC owner | “Free website” expectations and an unspoken retainer would undermine trust. The page must acknowledge local-service buying behavior. | Fit gate and design-proposal limits are explicit. Referrals, Google, warm houses, service areas, calls and inquiry ownership appear in the argument. Hosting costs and optional expansions are disclosed. | 8.5/10 |
| UX writer | The first deck wrapped into a weak “too.” line on mobile. The final request asked for a name ambiguously. Several headings orphaned on tablet. | Shorter deck, business-specific request language, unchanged visible field labels, semantic keep-phrases and an independently stacked tablet FAQ. Success confirms receipt and fit review, not acceptance. | 9/10 |
| Brand strategist | The V1 house illustration and equal-card rhythm looked interchangeable. The new page needs to demonstrate the very service it sells. | Editorial typography, a detailed fictional HVAC concept, mobile contact layer and a drawing-board motif make the pre-commitment direction visible. No borrowed proof. | 8.5/10 |

## Strict copy/claim audit

Removed the old generic hero, “useful foundation,” “clear way forward,” and “room to grow.” No body em dashes, invented project prices, schedules, outcomes, client counts, testimonials, guarantees or scarcity. Short labels and diagram lists describe information architecture rather than pretending to be evidence. Payment descriptions remain literal and bounded. The full build includes up to seven agreed pages, copy/design, contact routing, tracking, technical foundations, two revision rounds, QA and handover.

## Implementation boundaries

The route, `#website-plan` anchor, `/api/leads/inbound` action, existing schema, Turnstile and `website-first/v1` source remain unchanged. V2 is a creative revision, not a new backend routing contract. `smsConsent` remains false. No other landing routes, middleware or authoritative offer were modified.

Publication still requires owner approval of commercial terms and alignment of the existing default inbound email sequence, notifications, agreement, payment and onboarding flow. Noindex/nofollow is preserved but is not access control. QA intercepts mutations before navigation and does not exercise live submissions.
