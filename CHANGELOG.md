# Changelog

## v3.7.0

- Fix `File` syncer
- Always show sync progress

## v3.6.0

- Add Support for Custom Extensions

## v3.5.3

- Improve profile switching

## v3.5.2

- Fix text input padding in the repo configuration page
- Fix github repository creation

## v3.5.1

- Fix issue with Windows where only `extensions.json` would be uploaded

## v3.5.0

- Allow for Modifying Profiles using the Settings UI

## v3.4.1

- Detect local changes properly

## v3.4.0

- Add Debug Mode for solving issues quicker (#21)

## v3.3.2

- Improve auto upload

## v3.3.1

- Check JSON before processing Pragmas
- Remove `.gitignore` file
- Fix download issues

## v3.3.0

- Add documentation to the settings file

## v3.2.2

- Update `Sync` command to support conflict resolution

## v3.2.1

- Add localizations to newly added setting
- Disallow nonexistant properties in settings file

## v3.2.0

- Allow changing the current profile through the Settings UI

## v3.1.4

- Fix potential issue on Windows relating to obtaining the user folder

## v3.1.3

- Fix issues with newly-created repositories

## v3.1.2

- Prevent upload if remote has changes

## v3.1.1

- Make sure all errors are presented with the Webview

## v3.1.0

- Present errors in a more user-friendly way using Webviews

## v3.0.2

- Decreased overall size of the extension

## v3.0.1

- Fix issues introduced in v3.0.0 related to the new GitLab and BitBucket support

## v3.0.0

- Add support for GitLab
- Add support for BitBucket

## v2.2.0

- Fix glob matching on Windows
- Automatically download after switching profile

## v2.1.3

- Minor improvements to the changelog

## v2.1.2

- Update CI configuration

## v2.1.1

- Slight improvements to Settings

## v2.1.0

- List existing repositories after logging in

## v2.0.1

- Fix potential issue with reinitialization

## v2.0.0

- Added ability to resolve merge conflicts between local and remote settings when downloading

## v1.18.0

- Minor improvements to webviews

## v1.17.0

- Update webviews for better UX

## v1.16.2

- Use a more uncommon port to prevent Syncify from interfering with other applications

## v1.16.1

- Fix issue with auto-upload

## v1.16.0

- Use Redux to store `globalStoragePath`, `extensionPath`, and `subscriptions`
- Use `woff2` format for webview fonts

## v1.15.0

- Allow for registering custom files using a file picker

## v1.14.0

- Updated UI system

## v1.13.0

- Ask user if they are sure they want to reset

## v1.12.1

- Minor bugfixes

## v1.12.0

- Minor improvements

## v1.11.0

- Fix profiles
- Refactor `Switch Profile` and `Reinitialize` items in `Other Options` to separate commands to allow keyboard shortcut binding

## v1.10.0

- Let the user import custom files to a specific folder

## 1.9.2

- Minor bugfixes

## 1.9.1

- Add Content Security Policy to Webviews for security
- Minor bugfixes

## v1.9.0

- Add Turkish localizations
- Minor improvements

## v1.8.0

- Read custom files as `Buffer` to work with binaries

## v1.0.0

- Add `forceUpload` and `forceDownload` options

## v0.6.0

- Add `Other Options`

## v0.5.0

- Implement `File Syncer`

## v0.4.0

- Improve UX for Repo Creation page
- Fix Repo Creation process
