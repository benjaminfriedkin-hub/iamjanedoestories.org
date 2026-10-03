# How stories get into the library

1. A woman submits her story on the website. It arrives in **iamjanedoestories@gmail.com**.
   - The email subject tells you her choice:
     - **"New story: OK to share in the library"**: she said yes to publishing.
     - **"New story: keep private"**: never publish it.
     - **"New story: OK to share (send her the edit to approve first)"**: she left her email and wants
       to see the edited version first. Email it to her and wait for her OK before publishing.
   - The site promises women that stories are read **within a week**.
2. A person reads it and removes anything that could identify her or anyone else
   (full names, towns, schools, workplaces, dates, and so on).
3. The story is added to `stories.json` (the easiest way: forward the email to Claude and ask
   for it to be added). Within a minute or two it appears on the Story Library page.

## What one story looks like in `stories.json`

Each story goes inside the `"stories": [ ... ]` list, separated by commas:

```json
{
  "id": "2026-10-the-day-i-said-it",
  "title": "The day I said it out loud",
  "name": "Jane Doe",
  "date": "2026-10-03",
  "categories": ["Speaking up", "Healing & hope"],
  "tags": ["college", "family"],
  "contentNote": "Mentions sexual assault.",
  "story": "First paragraph.\n\nSecond paragraph."
}
```

- `id`: short, unique, no spaces. It's used for the story's own link.
- `name`: her alias, or "Jane Doe" if she left it blank.
- `categories`: pick from the list at the top of `stories.json` (that list also feeds the form).
- `tags`: extra search words (optional).
- `contentNote`: a short warning shown above the story (optional).
- `story`: the text. `\n\n` starts a new paragraph.
- To take a story down, delete it, or add `"published": false`.
