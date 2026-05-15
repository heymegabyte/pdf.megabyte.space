# AI Chat Slash Commands

The chat composer treats text beginning with `/` as a slash command. Typing `/` opens a filtered palette; arrow keys navigate, `Enter` / `Tab` picks, `Esc` dismisses. Each command is one of four kinds (`ui`, `nav`, `widget`, `prompt`) — see [`./ai-chat.md`](./ai-chat.md#slash-commands).

Registry source: [`src/web/components/ai-chat/commands.ts`](../src/web/components/ai-chat/commands.ts). Add a command by appending a record and re-running `npm test -- ai-chat/commands`.

## Help

| Command          | Does                                                                |
| ---------------- | ------------------------------------------------------------------- |
| `/help`          | Shows a feature-grid of what the assistant can do.                  |
| `/shortcommands` | Lists every registered command in a `shortcommands` widget.         |

## Navigation

| Command       | Navigates to        |
| ------------- | ------------------- |
| `/home`       | `/`                 |
| `/dashboard`  | `/dashboard`        |
| `/explore`    | `/explore`          |
| `/templates`  | `/templates`        |
| `/blog`       | `/blog`             |
| `/privacy`    | `/privacy`          |
| `/terms`      | `/terms`            |

## Sales

| Command     | Does                                                               |
| ----------- | ------------------------------------------------------------------ |
| `/pricing`  | Renders the Free / Pro / Unlimited `pricing` widget.               |
| `/compare`  | Renders a 6-row comparison `table` vs PandaDoc / DocuSign / Adobe.  |
| `/book`     | CTA widget linking to the team booking page.                       |

## Account

| Command            | Does                                                |
| ------------------ | --------------------------------------------------- |
| `/signin` / `/login` | Navigates to `/sign-in`.                          |
| `/account`         | Navigates to the dashboard.                         |
| `/upgrade`         | CTA widget linking to `?upgrade=pro`.               |
| `/billing`         | Opens billing portal (CTA widget).                  |
| `/signout`         | Triggers `useAuth().signOut()` and returns home.    |

## Content (prompt commands — feed richer prompts to the model)

| Command         | Generates                                                        |
| --------------- | ---------------------------------------------------------------- |
| `/invoice`      | Invoice prompt scaffold (line items, totals, due date).          |
| `/resume`       | Resume prompt scaffold (sections, keyword guidance, page break). |
| `/proposal`     | Proposal prompt (executive summary, scope, pricing, terms).      |
| `/contract`     | Contract prompt (parties, scope, payment, governing law).        |
| `/cover-letter` | Cover-letter prompt (header, salutation, three-paragraph body).  |
| `/report`       | Report prompt (TOC, sections, charts placeholder).               |
| `/search` / `/find` | Routes the query to a `search-results` widget over /explore, templates, docs, blog. |

## Editor (prompt commands)

| Command       | Generates                                                       |
| ------------- | --------------------------------------------------------------- |
| `/summarize`  | Summary prompt of the current document context.                  |
| `/improve`    | Improvement prompt — clarity / structure / tone.                |
| `/explain`    | Plain-English explanation of the current document.              |
| `/page-break` | Inserts a `page-break-before: always` snippet.                  |

## Tools (ui commands)

| Command                    | Action                                            |
| -------------------------- | ------------------------------------------------- |
| `/new`                     | Start a new thread (clears active conversation).  |
| `/clear`                   | Clear the messages in the current thread.         |
| `/export`                  | Download the current thread as Markdown.          |
| `/copy`                    | Copy the last assistant reply to the clipboard.   |
| `/stop`                    | Abort the in-flight streaming response.           |
| `/regenerate` / `/retry`   | Re-stream the last assistant turn.                |
| `/settings`                | Open chat settings (placeholder).                 |
| `/feedback`                | Open the feedback dialog.                         |
| `/share`                   | Copy the current page URL to the clipboard.       |

## Support

| Command | Does                                            |
| ------- | ----------------------------------------------- |
| `/faq`  | Renders a 6-item `faq` widget.                  |
| `/docs` | Linklist to architecture, deployment, security. |
| `/status` / `/health` | Renders a `status` widget with subsystem health (API, PDF render, /s/<slug>, AI, email). |
| `/changelog` / `/whatsnew` / `/releases` | Renders a `timeline` of recent releases. |
| `/shortcuts` / `/keyboard` / `/keys` | Renders a keyboard-shortcut `table`. |
| `/newsletter` / `/subscribe` | Renders a `form` widget bound to `/api/newsletter/subscribe`. |
| `/podcast` / `/listen` | Renders a podcast `card` + `link-list` (RSS + index). |
| `/accessibility` / `/a11y` | Renders the accessibility `checklist` + a contact callout. |
| `/support` / `/help-me` | Renders a `multi-choice` widget routing to FAQ / docs / contact / status. |

## Sales (additional)

| Command       | Does                                                              |
| ------------- | ----------------------------------------------------------------- |
| `/features`   | Renders a `feature-grid` of the core product capabilities + suggestions. |

> Total: 44 commands across 8 groups. The unit test in `commands.test.ts` enforces unique names, non-empty descriptions, and non-empty widget output on every record.
