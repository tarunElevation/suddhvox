# ShuddhVox

An Android app that removes background noise from audio and video. Created by Tarun.

## Build the APK (from a phone)

1. Open this repository on GitHub and go to the **Actions** tab.
2. Choose **Build APK**, then tap **Run workflow**.
3. After 5 to 10 minutes open the finished run. Under **Artifacts** you will find **ShuddhVox-apk**.
4. Download it and unzip it. Inside is `ShuddhVox.apk`. Install it on your phone.

The first time, Android asks to allow installs from unknown sources. Allow it.

This is a debug APK for testing. Play Store needs a signed release build, which is the next step.

## Sending updates to people who installed the app

Every time the app opens it asks GitHub for the newest release. If the release is newer than the installed app, it downloads the APK on its own and shows a popup with the percentage. When the download ends the person taps **Install update** and confirms in Android. Android does not allow an app to install itself silently, so that one tap cannot be removed. The first time, Android also asks to allow installs from this app.

To publish an update:
1. Actions, **Build APK**, **Run workflow**.
2. Turn on **Send this build to everyone as an update**.
3. Write a short note in **What is new**. People see it in the popup.
4. Run it. When it finishes, a release named `build-<number>` appears under **Releases**, and installed apps pick it up the next time they open.

A normal run with the switch off only builds the APK for testing and sends nothing to anyone.

The release file is public because this repository is public.

The update check is on only if `www/update.json` has `"enabled": true`. For a Play Store version set it to `false`. Play Store apps must update through the Play Store.

Updates only install over the installed app when both were signed with the same key. The fixed test key in `ci/debug.keystore` is used for that.

## Noise removal engine

The app uses RNNoise, an AI noise suppressor, through the `@shiguredo/rnnoise-wasm` package. The build downloads it and puts it inside the app (`scripts/vendor-rnnoise.mjs`). The cleaning level is how much of the AI result is mixed with the original.

After cleaning, the result strip shows which engine ran: **AI model** or **Basic**. Basic is a simpler built-in filter that the app uses if the AI model cannot start. If you see Basic, the status line under the waveform gives the reason. Send that line to the developer.

Licences are in `THIRD_PARTY_NOTICES.md`.

## Ads (AdMob)

All ad settings are in `www/admob.json`:

| Key | Meaning |
|---|---|
| `testing` | `true` shows Google test ads. Set `false` for real ads |
| `appId` | Your AdMob App ID, like `ca-app-pub-xxxxxxxx~yyyyyyyy` |
| `bannerAdUnitId` | Your AdMob ad unit ID, like `ca-app-pub-xxxxxxxx/yyyyyyyy` |
| `idleBanner` | `true` keeps a small banner at the bottom when nothing is processing |

The file currently holds Google's official **test** IDs. They earn nothing.

To turn on real ads:
1. Create an account at admob.google.com and add your app. You get an App ID.
2. Create a **Banner** ad unit in that app. You get an ad unit ID.
3. Paste both IDs into `www/admob.json` and set `testing` to `false`.
4. Run **Build APK** again.

Never tap your own real ads. AdMob can ban the account. Keep test ads on while testing.

## Where ads appear

While a file is being processed, the top half shows the waveform and progress, and a 300x250 ad runs in the bottom half. The ad goes away when processing finishes.

## Making changes

- App look and behaviour: `www/index.html`
- Ad settings: `www/admob.json`
- App name and ID: `capacitor.config.json`

After a change, run **Build APK** again.

## App icon

The icons are made by `resources/make_icons.py` (needs Pillow) and saved in `resources/android`. The build copies them into the app. To change the look, edit that script, run `python3 resources/make_icons.py`, and commit the new images. `resources/play-store-icon-512.png` is the 512x512 icon for the Play Store listing.

## Before Play Store

- A Play Console developer account
- A signed release build (keystore)
- A Privacy Policy page, because the app shows ads
- Real AdMob IDs
- App icon and screenshots
