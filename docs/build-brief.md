# Global Baptism Event: Prototype Workflow and Build Brief

## Purpose

Help churches participate in a global baptism event through a simple WhatsApp journey, supported by a dashboard that shows whether churches and participants are prepared, supported, and connected to ongoing local care.

The system should coordinate three connected journeys:

| Journey | Steps |
|---|---|
| **Church** | Register → Confirm participation → Prepare → Deliver the event → Report and follow up |
| **Participant** | Express interest → Connect with a church → Receive pastoral preparation → Confirm participation → Be baptized → Receive ongoing care |
| **Organizer** | Review churches → Coordinate events → Resolve needs → Monitor readiness → Verify reporting |

## Working assumptions

WhatsApp is the primary communication channel. Short forms collect structured information. Churches retain responsibility for pastoral preparation and discipleship. Regional organizers support churches, while the global team coordinates resources and aggregate reporting.

These assumptions need confirmation before live implementation.

**Build stack:** Vercel AI SDK and Vercel Chat SDK (WhatsApp and SMS adapters). See [tech approach](tech-approach.md).

## Workflow

### 1. Establish participation requirements

Before opening registration, define:

- The purpose of the event and any shared statement participating churches must accept.
- Who can host and whether hosts require approval.
- What the central organization provides.
- What local churches remain responsible for.
- How differences in baptism practice and preparation will be handled.
- Who owns regional support, event reporting, and ongoing care.

Provide a concise explanation during onboarding. Record acceptance of the relevant version and any required approval.

**Completion:** A church understands its responsibilities and meets the requirements for its chosen participation pathway.

### 2. Start the WhatsApp conversation

A leader scans a QR code, follows a link, or messages the event number.

The conversation:

- Welcomes the leader.
- Offers a language choice.
- Explains the registration and preparation process.
- Requests permission for ongoing event messages.
- Offers "Register my church" or "Talk to an organizer."

Provide text alternatives to video and an assisted-registration option.

**Dashboard:** Create an initial contact with language, contact number, registration source, permission status, and assigned region where known.

### 3. Register the church

Collect:

- Church name.
- Coordinator's name and role.
- Best contact number.
- Email, optional unless operationally necessary.
- Country, region, city or locality, and postal code where applicable.
- Preferred language and local time zone.
- Participation choice: host, join another event, or request help.

Allow flexible location descriptions where formal addresses are unavailable. Support coordinators responsible for multiple churches and churches with multiple contacts.

Show a confirmation summary and allow corrections.

**Dashboard:** Create linked church and contact records. Flag possible duplicates for review without automatically merging them.

**Completion:** Required details are confirmed. Status becomes Registered, not yet Ready.

### 4. Review and confirm participation

Apply the agreed review process. Confirm the church's participation requirements, coordinator, and preferred pathway.

If approval is needed, explain what happens next and assign a reviewer. If the church needs help, create an owned support task.

**Dashboard:** Track review status, reviewer, outstanding questions, and participation approval.

**Completion:** The church is approved or confirmed for its pathway, with a clear next step.

### 5. Welcome the church and invite its team

Send the welcome video with a short written summary covering:

- The event's purpose.
- Participation options.
- What to expect.
- Preparation responsibilities.
- The discipleship pathway.

Provide a church-specific invitation link or QR code for organizers and volunteers. Each person joins the correct church and selects a role.

**Dashboard:** Record materials sent, coordinator acknowledgment, team members, and responsibilities. Distinguish delivery from acknowledgment.

### 6. Connect the church to a local event

Suggested timing: day two after registration, or immediately for late registrants.

| Pathway | Action |
|---|---|
| **Hosting** | Create an event and begin confirming its details. |
| **Joining** | Show suitable events that have agreed to be listed. Request host confirmation before finalizing participation. |
| **Undecided** | Route to a regional organizer. |
| **No suitable event** | Create an explicit support task. |

Do not automatically publish church locations or contact details.

**Dashboard:** Link participating churches to the event, host, regional organizer, and reporting owner.

**Completion:** The church has a confirmed event assignment or an owned task to resolve it.

### 7. Deliver the appropriate starter pack

For hosts, include:

- Planning checklist and role descriptions.
- Baptism preparation resources.
- Participant registration link and QR code.
- Congregational communication materials.
- Event-day guidance.
- Reporting instructions.
- Discipleship follow-up resources.

For joining churches, include host details, responsibilities, schedule, registration instructions, and preparation resources.

**Dashboard:** Record resource version, delivery, acknowledgment, and requests for help.

### 8. Confirm readiness and ongoing-care ownership

Guide the coordinator through a checklist covering:

- Date, time, time zone, and venue.
- Event lead and day-of contact.
- Volunteer roles and responsibilities.
- Participant preparation process.
- Accessibility and arrival arrangements.
- Suitable baptism arrangements and responsible supervision.
- Emergency contact and disruption plan.
- Reporting owner.
- Discipleship follow-up owner and next-step invitation.

Each item supports **Complete**, **Not yet**, **Need help**, or **Not applicable**, with an explanation where needed.

**Dashboard:** Show unresolved essentials, assigned owners, deadlines, and intervention flags.

**Readiness gate:** A church is ready only when it has a named coordinator, confirmed event assignment, essential arrangements completed, and an owner for participant preparation and follow-up. Message delivery alone never establishes readiness.

### 9. Equip the congregation and open participant registration

Send approved announcement copy, graphics, invitation language, and the event-specific registration link or QR code.

Explain that registration expresses interest and begins a conversation with the local church.

Participants provide only the information needed for coordination:

- Name.
- Preferred contact method and language.
- Selected church or event.
- Permission for relevant messages.
- A way to request assistance privately.

A person without a church connection is assigned to a local church contact for acceptance and follow-up. Do not treat an automatic assignment as a completed relationship.

Provide a separate guardian-supported pathway for children, with its requirements defined before launch.

**Dashboard:** Track participant registration, church connection, assigned contact, and preparation status. Restrict individual details to authorized people.

### 10. Support pastoral preparation

The local church contacts the participant, explains preparation, answers questions, and determines readiness according to its responsibilities and agreed event requirements.

Suggested participant statuses:

Interested → Connection pending → Connected → Preparing → Confirmed → Baptized / Did not participate → Follow-up underway

Allow withdrawal, postponement, and transfer to another event.

**Dashboard:** Record preparation status, responsible person, and next action. Keep confidential pastoral conversations outside the central coordination record.

### 11. Confirm participation one week before

Seven days before the local event, ask the coordinator to:

- Update the expected baptism count.
- Review participant registrations.
- Confirm preparation progress.
- Resolve outstanding operational needs.
- Confirm the event's reporting and follow-up owners.

Maintain separate counts for expected baptisms, registered participants, and confirmed participants.

Allow participants to confirm attendance, request help, or report a change.

**Dashboard:** Flag unresolved essentials and participants awaiting contact. Escalate issues according to the support process.

### 12. Send final details the day before

Send role-specific information.

| Audience | Information |
|---|---|
| **Coordinators** | Final schedule, responsibilities, outstanding tasks, reporting instructions, and support contact. |
| **Participants** | Location, arrival time, what to bring, what to expect, and a contact for questions or changes. |

Late registration remains available where the host permits it, with pastoral preparation and essential readiness still required.

**Dashboard:** Record delivery, responses, changes, failed messages, and unresolved questions.

### 13. Support event day and report outcomes

Give coordinators simple actions:

- Get help.
- Update event details.
- Record attendance.
- Report completed baptisms.
- Share a story or photo.

Keep attendance and completed baptisms separate. Allow aggregate reporting without requiring every participant's personal information centrally.

Assign one reporting owner per event to prevent host and participating churches from counting the same baptisms twice.

**Dashboard:** Show event status, support needs, reported baptisms, reporting source, and review status. Preserve a history of corrections.

Uploading a photo or story does not grant permission to publish it. Record publication permission separately.

### 14. Continue local discipleship and close reporting

Proposed timing: a thank-you and reporting check within 24–48 hours, followed by locally agreed care milestones.

Ask the coordinator to:

- Confirm final results.
- Resolve incomplete reports.
- Confirm that participants have a named local follow-up contact.
- Offer the next discipleship step.
- Report whether meaningful contact occurred.
- Share feedback on the process.

**Dashboard:** Track follow-up owner, next action, connection status, and reporting completion. A sent message does not count as a confirmed connection.

## Human support and exception handling

Every request for help needs an owner, priority, next action, and resolution status.

Define routing for:

- Pastoral questions.
- Registration and technical problems.
- Churches without an event.
- Unresponsive coordinators.
- Venue changes and cancellations.
- Urgent concerns.
- Language or accessibility needs.

Publish realistic support availability. Do not imply continuous global coverage unless it exists.

Allow authorized staff to pause automation while resolving an issue.

## Global access and information handling

Build for short text messages, limited connectivity, flexible addresses, shared phones, and assisted registration. Confirm language and time zone rather than assuming them.

Collect the minimum information needed for each role. Prefer aggregate participant reporting for the global team. Decide before launch:

- Which participant information stays with the church.
- Who can access individual records.
- Whether local conditions make religious identification or public event listings unsafe.
- How people correct or remove their information.
- How long records are retained.
- How guardian involvement and publication permissions are handled.

## Dashboard requirements

| View | What it must show |
|---|---|
| **Global overview** | Registered churches, confirmed events, readiness, support needs, reported baptisms, reporting coverage, and follow-up progress |
| **Regional workspace** | Assigned churches and events, unresolved needs, review tasks, and local support workload |
| **Church profile** | Contacts, team, participation requirements, event assignment, preparation, and next action |
| **Event profile** | Host, participating churches, date, venue, readiness, reporting owner, and outcomes |
| **Participant coordination** | Authorized local view of connection, preparation, attendance, and follow-up |
| **Support queue** | Owner, priority, due date, current status, and resolution |
| **Communication history** | Permissions, messages, delivery where available, responses, and scheduled actions |
| **Stories and media** | Submission, review, publication permission, and permitted use |

## Measurement definitions

Report these separately:

- Churches registered.
- Churches approved or confirmed.
- Churches ready.
- Participants expressing interest.
- Participants confirmed.
- Baptisms reported.
- Event reports reviewed.
- Follow-up connections confirmed.

Show reporting coverage alongside totals so missing reports are visible. Record how follow-up connection was confirmed, usually through local church reporting.

## Core records and automation rules

Maintain linked records for churches, people, events, church participation, participant registrations, tasks, messages, permissions, resources, and media.

The system must:

- Save and resume progress.
- Support multiple churches at one event and repeat participation in future years.
- Prevent duplicate records and repeated messages.
- Keep QR codes specific to registration, team invitation, or participant registration.
- Recalculate reminders when dates change.
- Stop relevant reminders after cancellation or withdrawal.
- Respect opt-outs.
- Combine essential steps for late registrants and skip expired reminders.
- Route uncertainty to a person.
- Preserve ownership and a history of important changes.

## Prototype scope and acceptance tests

Start with fictional churches and participants, simulated WhatsApp messages, forms, a dashboard, readiness checklists, support routing, reminder previews, and reporting.

Test these scenarios:

| Scenario | Evidence the prototype works |
|---|---|
| One church hosts | Registration leads to preparation, outcomes, and assigned follow-up |
| Multiple churches share an event | Each church remains distinct, with one event report and no duplicate baptism count |
| A church registers two days before | Essential steps remain; outdated reminders are skipped |
| Registration is abandoned and resumed | Saved information is restored without creating a duplicate |
| Event location changes or event is canceled | Future instructions update, affected people are identified, and obsolete reminders stop |
| A participant has no church connection | A local owner accepts responsibility and records contact |
| A message fails or someone requests help | An owned task appears and can be resolved |
| Someone withdraws or opts out | Relevant participation and messaging behavior update correctly |

## Decisions required before live implementation

- Event identity, initial countries, languages, and dates.
- Participation commitments, theological boundaries, and host approval process.
- Central, regional, and local responsibilities.
- Participant preparation and guardian-supported registration requirements.
- Whether participant messages come from the central organization or local church.
- Support staffing, escalation, and service hours.
- Information access, retention, and publication permissions.
- Required resources and their content owners.
- WhatsApp integration approach, approved reminder templates, and messaging permissions.
- Definitions of readiness, verified reporting, and completed follow-up.

## Success criterion

The prototype should demonstrate that a church can move from first contact to a prepared event, report its outcomes accurately, and connect participants to ongoing local care, with human support available wherever the process breaks down.
