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

// Version number goes up with every GitHub build, so Android treats each new APK as an update.
const run = parseInt(process.env.GITHUB_RUN_NUMBER || '1', 10);
const gradlePath = 'android/app/build.gradle';
let gradle = fs.readFileSync(gradlePath, 'utf8');
if (/versionCode\s+\d+/.test(gradle)) {
  gradle = gradle.replace(/versionCode\s+\d+/, `versionCode ${run}`).replace(/versionName\s+"[^"]*"/, `versionName "1.0.${run}"`);
  fs.writeFileSync(gradlePath, gradle);
  console.log('versionCode set to', run);
} else {
  console.log('versionCode line not found, left as is');
}

// In-app updater: a small native plugin that downloads the new APK with progress and opens Android's installer.
const appPackage = JSON.parse(fs.readFileSync('capacitor.config.json', 'utf8')).appId;
const javaDir = `android/app/src/main/java/${appPackage.replace(/\./g, '/')}`;
if (fs.existsSync(javaDir) && fs.existsSync('resources/native/UpdaterPlugin.java')) {
  for (const f of ['UpdaterPlugin.java', 'UpdaterFileProvider.java']) {
    fs.writeFileSync(`${javaDir}/${f}`, fs.readFileSync(`resources/native/${f}`, 'utf8').replace(/__PACKAGE__/g, appPackage));
  }
  fs.writeFileSync(`${javaDir}/MainActivity.java`, `package ${appPackage};

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(UpdaterPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
`);
  fs.mkdirSync('android/app/src/main/res/xml', { recursive: true });
  fs.copyFileSync('resources/native/updater_paths.xml', 'android/app/src/main/res/xml/updater_paths.xml');
  let man = fs.readFileSync(manifestPath, 'utf8');
  if (!man.includes('REQUEST_INSTALL_PACKAGES')) {
    man = man.replace('</manifest>', '    <uses-permission android:name="android.permission.REQUEST_INSTALL_PACKAGES" />\n</manifest>');
  }
  if (!man.includes('UpdaterFileProvider')) {
    man = man.replace('</application>',
      `        <provider android:name="${appPackage}.UpdaterFileProvider" android:authorities="\${applicationId}.updater" android:exported="false" android:grantUriPermissions="true">
            <meta-data android:name="android.support.FILE_PROVIDER_PATHS" android:resource="@xml/updater_paths" />
        </provider>
    </application>`);
  }
  fs.writeFileSync(manifestPath, man);
  console.log('Updater plugin installed');
} else {
  console.log('Updater plugin NOT installed (java folder or source missing):', javaDir);
}
