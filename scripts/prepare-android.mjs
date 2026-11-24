// Runs after `npx cap add android`. Puts the AdMob App ID from www/admob.json into the Android project.
import fs from 'node:fs';

const cfg = JSON.parse(fs.readFileSync('www/admob.json', 'utf8'));
const appId = cfg.appId;
if (!/^ca-app-pub-\d+~\d+$/.test(appId || '')) {
  throw new Error('www/admob.json: appId sahi nahi hai (ca-app-pub-XXXXXXXXXXXXXXXX~YYYYYYYYYY chahiye): ' + appId);
}

const stringsPath = 'android/app/src/main/res/values/strings.xml';
let strings = fs.readFileSync(stringsPath, 'utf8');
if (strings.includes('admob_app_id')) {
  strings = strings.replace(/(<string name="admob_app_id">)[^<]*(<\/string>)/, `$1${appId}$2`);
} else {
  strings = strings.replace('</resources>', `    <string name="admob_app_id">${appId}</string>\n</resources>`);
}
fs.writeFileSync(stringsPath, strings);

const manifestPath = 'android/app/src/main/AndroidManifest.xml';
let manifest = fs.readFileSync(manifestPath, 'utf8');
if (!manifest.includes('com.google.android.gms.ads.APPLICATION_ID')) {
  manifest = manifest.replace(
    '</application>',
    '        <meta-data android:name="com.google.android.gms.ads.APPLICATION_ID" android:value="@string/admob_app_id" />\n    </application>'
  );
}
fs.writeFileSync(manifestPath, manifest);

console.log('AdMob app id set:', appId, '| testing:', cfg.testing);

// App icons: replace the default launcher icons with the ones in resources/android (made by resources/make_icons.py).
const iconSrc = 'resources/android';
const resRoot = 'android/app/src/main/res';
if (fs.existsSync(iconSrc)) {
  for (const dir of fs.readdirSync(iconSrc)) {
    const dst = `${resRoot}/${dir}`;
    fs.mkdirSync(dst, { recursive: true });
    for (const f of fs.readdirSync(dst)) {
      if (f.startsWith('ic_launcher')) fs.rmSync(`${dst}/${f}`);
    }
    for (const f of fs.readdirSync(`${iconSrc}/${dir}`)) {
      fs.copyFileSync(`${iconSrc}/${dir}/${f}`, `${dst}/${f}`);
    }
  }
  const any = `${resRoot}/mipmap-anydpi-v26`;
  fs.mkdirSync(any, { recursive: true });
  for (const f of fs.readdirSync(any)) {
    if (f.startsWith('ic_launcher')) fs.rmSync(`${any}/${f}`);
  }
  const adaptive = `<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@mipmap/ic_launcher_bg"/>
    <foreground android:drawable="@mipmap/ic_launcher_fg"/>
</adaptive-icon>
`;
  fs.writeFileSync(`${any}/ic_launcher.xml`, adaptive);
  fs.writeFileSync(`${any}/ic_launcher_round.xml`, adaptive);
  console.log('App icons installed');
}
