# Syncify

[![Travis][badge-img:travis]][badge-link:travis]
[![Version][badge-img:version]][badge-link:version]
[![Issues][badge-img:issues]][badge-link:issues]
[![License][badge-img:license]][badge-link:license]
[![Deps][badge-img:deps]][badge-link:deps]

Syncify can sync your VSCode settings and extensions across all your devices using multiple methods.

## Installation

### Using the Extensions Panel

1. Open the extensions panel: `Ctrl+Shift+X` (`Cmd` on Mac)
2. Type `syncify`
3. Click `Install`

### Using the Command Palette

1. Open the command palette: `Ctrl+P` (`Cmd` on Mac)
2. Type `ext install arnohovhannisyan.syncify`

## Quick Start

Visit the [Quick Start Guide][link:quickstart] to get started.

## Need Help?

- Join the [Slack Workspace][link:slack]
- Join the [Discord Server][link:discord]
- Email me at arnohovhannisyan0@gmail.com.

## Advantages over [Settings Sync][link:settings-sync]

- No annoying popups
- Merge conflict resolution supported
- Multiple profiles with support for hot-switching (currently only supported on `Git` method)
- Simpler settings with intellisense
- Multiple sync methods
  - `Git` — sync using a git repository
  - `File` — sync to local folder, even when offline (can be used with Dropbox, zipped and emailed, etc...)
- `Sync` command that automatically uploads or downloads if there are changes locally or remotely (only supported on `Git` method)
- More intuitive custom file registration and importing
- Notification for extension installation/uninstallation progress
- Status bar button to cancel auto-upload

## Credits

- [@arnohovhannisyan (me)][link:me] - Extension author
- [@shanalikhan][link:shanalikhan] - This extension was inspired by [Settings Sync][link:settings-sync]

<!-- Link References -->

[link:shanalikhan]: https://github.com/shanalikhan
[link:me]: https://github.com/arnohovhannisyan
[link:quickstart]: https://github.com/arnohovhannisyan/vscode-syncify/wiki/Quick-Start
[link:settings-sync]: https://github.com/shanalikhan/code-settings-sync
[link:slack]: https://join.slack.com/t/vscode-syncify/shared_invite/enQtNzc5MjYyMjYyNzEwLWQ5MGMxNDljZjk5NmYwNWZlYTBmYjk0MjliNjgyYWRkM2NiYjU2YjExY2RmODg2MGIyZTUwY2YzYWM2YThjMmM
[link:discord]: https://discord.gg/DwFKj57

<!-- Badge References -->

[badge-img:travis]: https://img.shields.io/travis/com/arnohovhannisyan/vscode-syncify
[badge-img:version]: https://vsmarketplacebadge.apphb.com/version/arnohovhannisyan.syncify.svg
[badge-img:issues]: https://img.shields.io/github/issues/arnohovhannisyan/vscode-syncify.svg
[badge-img:license]: https://img.shields.io/github/license/arnohovhannisyan/vscode-syncify
[badge-img:deps]: https://img.shields.io/david/arnohovhannisyan/vscode-syncify
[badge-link:travis]: https://travis-ci.com/arnohovhannisyan/vscode-syncify
[badge-link:version]: https://marketplace.visualstudio.com/items?itemName=arnohovhannisyan.syncify
[badge-link:issues]: https://github.com/arnohovhannisyan/vscode-syncify/issues
[badge-link:license]: https://github.com/arnohovhannisyan/vscode-syncify/blob/master/LICENSE
[badge-link:deps]: https://david-dm.org/arnohovhannisyan/vscode-syncify
