# Part 1: Setup & Context Engineering

---

In this part you'll set up your development environment **and** teach Copilot about the codebase — so every future prompt starts with the right context.

## Section 1: Initial Setup

### Step 1: Create Your Repository

1. Open [github.com/copilot-dev-days/mona-mayhem](https://github.com/copilot-dev-days/mona-mayhem)
2. Create your own repository by either:
   - clicking **Use this template** → **Create a new repository**, or
   - forking the repository.
3. Name it `my-mona-mayhem` and set visibility to **Public** (if you created from template)

### Step 2: Enable GitHub Pages

1. Go to your new repository's **Settings** → **Pages**
2. Under **Source**, select **GitHub Actions**

<!-- track:vscode:start -->
### Step 3: Choose Your Development Environment

#### Option A: Local VS Code

1. Open VS Code and run **Git: Clone** → **Clone from GitHub**
2. Select your `my-mona-mayhem` repository
3. When prompted, install the **recommended extensions**

#### Option B: GitHub Codespaces

1. Open your repository on GitHub
2. Click **Code** → **Codespaces** → **Create codespace on main**
3. Wait for the environment to boot and dependencies to install

### Step 4: Run the Setup Agent

1. Open the **Chat** panel and type:

   ```
   /setup
   ```

2. The agent will detect your environment, install dependencies, and start the dev server automatically.

> ✅ **App is running in your browser!**
<!-- track:vscode:end -->

<!-- track:cli:start -->
### Step 3: Install GitHub Copilot CLI

Use the installation path that matches your machine:

- **npm (cross-platform, requires Node.js 22+)**

  ```bash
  npm install -g @github/copilot
  ```

- **Homebrew (macOS/Linux)**

  ```bash
  brew install copilot-cli
  ```

- **WinGet (Windows)**

  ```bash
  winget install GitHub.Copilot
  ```

### Step 4: Start the App and Authenticate the CLI

1. Clone your repo locally and open a terminal in the project root.
2. Install dependencies and start the app:

   ```bash
   npm install
   npm run dev
   ```

3. Open a **second terminal** in the same repo and start Copilot CLI:

   ```bash
   copilot
   ```

4. In the interactive session, enter:

   ```
   /login
   ```

5. Follow the device flow prompts, then confirm that you trust the repository when the CLI asks for approval.

> ✅ **You now have the app preview in one terminal and Copilot CLI ready in another.**
<!-- track:cli:end -->

## Section 2: Context Engineering

Context engineering is how you teach AI about your codebase. The better the context, the better every future response will be.

<!-- track:vscode:start -->
### Task 1: Generate Workspace Instructions

1. Open the Command Palette and run:

   ```
   Chat: Generate Workspace Instructions File
   ```

2. Review the generated file — it's probably too detailed.
3. In Copilot Chat, follow up with:

   > "Compress down by half and add a mandatory development checklist (lint, build, test) to the top"

4. **Commit** the instructions file.

> **Result:** All future Copilot requests now have a basic map of your workspace baked in.

### Task 2: Background Agents

**Local background agent:**

1. In the Chat panel, click **+** → **New background agent**
2. Enter the prompt:

   > "Add linting rules for unused vars and improve code style; fix any errors"

3. When it finishes, **Review and Apply** the changes, then delete the session.

**Cloud agent:**

1. Start another background agent with:

   > "Make the README more engaging as a landing page"

> **Result:** Linting rules added, errors fixed, README improved — all without leaving your editor.

### Task 3: Explore the Project

Open **Copilot Chat** in **Ask mode** and try these prompts:

- `"Explain the architecture of this project"`
- `"What does the API route do?"`
- `"How does the contribution graph rendering work?"`

> 💡 Use **@workspace** to give Copilot project-wide context for more accurate answers.
<!-- track:vscode:end -->

<!-- track:cli:start -->
### Task 1: Initialize Repository Instructions

1. In your Copilot CLI session, initialize Copilot's repo-aware files:

   ```
   /init
   ```

   You can also run `copilot init` from a regular shell if you prefer a one-shot command.

2. Ask Copilot to keep the instructions concise and workshop-friendly:

   ```
   Create a short repository instructions file for this Astro project. Put the mandatory development checklist at the top, include build and dev commands, and keep the guidance specific to this repo's retro arcade theme.
   ```

3. Review the proposed file changes before approving them.
4. Commit the resulting instructions file.

> **Result:** Future CLI sessions automatically inherit repository-specific instructions from files like `.github/copilot-instructions.md` or `AGENTS.md`.

### Task 2: Tune Your CLI Environment

Practice the CLI controls that make later steps smoother:

1. Run `/help` to scan the available slash commands.
2. Use `/model` to inspect the models available to you.
3. If Copilot has learned too many approvals during experimentation, reset them with:

   ```
   /reset-allowed-tools
   ```

4. If your repository lives inside a larger parent directory, use `/add-dir PATH` to explicitly widen the allowed workspace.

> 💡 The CLI docs recommend concise custom instructions plus explicit tool permissions so Copilot stays fast and predictable.

### Task 3: Explore the Project from the Terminal

Try these prompts inside Copilot CLI:

- `Give me an overview of this project.`
- `@src/pages/api/contributions/[username].ts Explain what this route does and how it handles caching.`
- `@src/pages/index.astro Explain how the contribution graph is rendered.`

If you want a quick one-shot answer outside the interactive session, try:

```bash
copilot -sp "Summarize the architecture of this repo in 5 bullet points"
```

> **Result:** You now have instructions, command awareness, and a feel for how to feed files into Copilot CLI context.
<!-- track:cli:end -->

## ✅ Part 1 Complete

You've learned how to:

- **Set up** the repo and local development environment
- **Create instructions** so Copilot understands your project
- **Establish a review habit** before applying generated changes
- **Explore the codebase** with context-rich prompts
