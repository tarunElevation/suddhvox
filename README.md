# ShuddhVox

An Android app that removes background noise from audio and video. Created by Tarun.

## Build the APK (from a phone)

1. Open this repository on GitHub and go to the **Actions** tab.
2. Choose **Build APK**, then tap **Run workflow**.
3. After 5 to 10 minutes open the finished run. Under **Artifacts** you will find **ShuddhVox-apk**.
4. Download it and unzip it. Inside is `app-debug.apk`. Install it on your phone.

The first time, Android asks to allow installs from unknown sources. Allow it.

This is a debug APK for testing. Play Store needs a signed release build, which is the next step.

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

## Before Play Store

- A Play Console developer account
- A signed release build (keystore)
- A Privacy Policy page, because the app shows ads
- Real AdMob IDs
- App icon and screenshots
