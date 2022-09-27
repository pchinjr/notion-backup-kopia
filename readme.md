# Notion Backup with Kopia on macOS

Node, Kopia, and launchd

Pre-requisites: Nodejs

In a browser, initiate an export and inspect the network tab in your developer console. You should see a network request called `enqueueTask`. Locate `token_v2` in the headers and `space_id` in the payload of `enqueueTask`. Save those strings as environment variables in this repo.

`notion-backup.js` is a script that will handle requesting and downloading your assets from Notion. When you log out of notion, your token will refresh, and you will have to update this script. From a fresh `git clone`, run `npm i` and create folders for `html` and `markdown`

`launchd` is a utility to schedule processes on macOS. Use `com.schedule-notion-backup.daemon.plist` and place it in `~/Library/LaunchAgents/`. Run the command `$ launchctl load ~/Library/LaunchAgents/com.schedule-notion-backup.daemon.plist` to begin scheduling the `notion-backup.js` script.

`kopia` is a cross-platform open sourced back up tool. You can install it with homebrew on macOS.
`$ brew install kopia`

Create an AWS S3 Bucket, and make note of the bucket name, secret key, and secret access key. Kopia will need these to create and connect a repository. A repository is how Kopia organizes your remote back ups. Reference the handy commands in `kopia-cli.md` for the following steps:
1. Create a Repository
2. Connect to the Repository
3. Create your first snapshot
4. Set a policy to create snapshots on an interval.
5. Sit back and watch your automations run like a good robot.

references:

https://github.com/darobin/notion-backup

https://betterprogramming.pub/schedule-node-js-scripts-on-your-mac-with-launchd-a7fca82fbf02

https://artur-en.medium.com/automated-notion-backups-f6af4edc298d

https://notionbackups.com/blog/automated-notion-backup-api

https://kopia.io/docs/reference/command-line/
