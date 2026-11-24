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
