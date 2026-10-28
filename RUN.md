# Running Ultron AI on your own computer

## 1. Install Bun (once)

Bun is the tool that downloads the app's parts and starts it.

- **Windows** — open PowerShell and run:
  ```powershell
  powershell -c "irm https://bun.sh/install.ps1 | iex"
  ```
- **macOS or Linux** — open Terminal and run:
  ```sh
  curl -fsSL https://bun.sh/install | bash
  ```

Close and reopen the terminal afterwards so it is found.

## 2. Start the app

Unzip the folder, open a terminal **inside** that folder, then:

```sh
bun install
bun run dev
```

`bun install` only needs to be run the first time (or after the folder moves).

The terminal prints an address such as `http://localhost:5173/` — open that in a
browser and the sign-in screen appears.

### Double-click shortcut

- **Windows:** double-click `start.bat`
- **macOS / Linux:** run `./start.sh` (first time: `chmod +x start.sh`)

Both do the same two steps above and open the app for you.

## 3. What works straight away

- Register / sign in with email and password, or with Google
- Saved sessions and message history
- The five spoken voices, plus mute, pause and resume
- Dark and bright modes

## 4. Getting the AI replies working

Answers come from an AI model, and the key for that is **not** in this folder
(it belongs to the online workspace the app was built in). To use it on your own
computer, open the `.env` file in the same folder and add your own key at the
bottom:

```
OPENAI_API_KEY=your-key-here
```

Then stop the app (Ctrl+C in the terminal) and run `bun run dev` again.

Optional extras you can put in the same `.env` file:

| Line                      | What it does                                                                                          |
| ------------------------- | ----------------------------------------------------------------------------------------------------- |
| `AI_MODEL=gpt-5.2`        | Which model to ask. Change it if your key gives you different models.                                 |
| `AI_BASE_URL=https://...` | Point at another service that speaks the same language (OpenRouter, Groq, a local model server, ...). |

Without a key the app still opens and remembers your sessions — it just says
`AI is not configured` when you send a message.

## 5. Building a stand-alone copy

```sh
bun run build
bun run preview
```
