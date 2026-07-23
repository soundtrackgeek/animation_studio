## Development Workflow

**IMPORTANT**: After any code change, bug fix, or feature addition/removal, you MUST complete all of these steps:

1. **Update README.md** if the change affects:
   - Usage examples or commands
   - Installation instructions
   - Configuration options
   - Available features

2. **Update CHANGELOG.md**:
   - Add new version number following semantic versioning (MAJOR.MINOR.PATCH)
   - Add entry under appropriate category (Added, Changed, Fixed, Removed)
   - Include date in format YYYY-MM-DD

3. **Clean Rust build artifacts**:
   - Before committing, run `cargo clean` from the `src-tauri` directory
   - This keeps Tauri/Rust build artifacts from growing too large between work sessions

4. **Commit and push changes**:
   - Use `git add` to stage all modified files (README.md, CHANGELOG.md, and code files)
   - Create descriptive commit message following existing style
   - Push to remote repository with `git push`

5. **Stop after a successful push**:
   - Once `git push` succeeds, the task is done
   - Do not wait for GitHub Actions, create or push a release tag, inspect workflow artifacts, or follow the release pipeline unless the user explicitly asks
