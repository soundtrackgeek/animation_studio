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

5. **Always push the matching version tag after a version bump**:
   - Whenever the application version changes, create an annotated `vMAJOR.MINOR.PATCH` tag on the pushed version commit and push that tag
   - This is mandatory without exception; a version bump is not complete until both the commit and its matching version tag are on the remote
   - Never move or replace an existing version tag. Stop and report the conflict if the required tag already points to a different commit

6. **Stop after all required pushes succeed**:
   - For changes without a version bump, the task is done after the branch push succeeds
   - For a version bump, the task is done only after both the branch and matching version tag pushes succeed
   - Do not wait for GitHub Actions, inspect workflow artifacts, or otherwise follow the release pipeline unless the user explicitly asks
