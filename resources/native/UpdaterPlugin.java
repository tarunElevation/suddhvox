package __PACKAGE__;

import android.content.Intent;
import android.content.pm.PackageInfo;
import android.net.Uri;
import android.os.Build;
import androidx.core.content.FileProvider;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;

/** Downloads a new APK with progress and hands it to Android's installer. */
@CapacitorPlugin(name = "Updater")
public class UpdaterPlugin extends Plugin {

    @PluginMethod
    public void getVersion(PluginCall call) {
        try {
            PackageInfo p = getContext().getPackageManager().getPackageInfo(getContext().getPackageName(), 0);
            long code = Build.VERSION.SDK_INT >= 28 ? p.getLongVersionCode() : (long) p.versionCode;
            JSObject r = new JSObject();
            r.put("versionCode", code);
            r.put("versionName", p.versionName);
            call.resolve(r);
        } catch (Exception e) {
            call.reject(String.valueOf(e.getMessage()));
        }
    }

    @PluginMethod
    public void canInstall(PluginCall call) {
        boolean ok = Build.VERSION.SDK_INT < 26 || getContext().getPackageManager().canRequestPackageInstalls();
        JSObject r = new JSObject();
        r.put("value", ok);
        call.resolve(r);
    }

    @PluginMethod
    public void openInstallSettings(PluginCall call) {
        try {
            Intent i = new Intent("android.settings.MANAGE_UNKNOWN_APP_SOURCES", Uri.parse("package:" + getContext().getPackageName()));
            i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getContext().startActivity(i);
            call.resolve();
        } catch (Exception e) {
            call.reject(String.valueOf(e.getMessage()));
        }
    }

    @PluginMethod
    public void download(final PluginCall call) {
        final String urlStr = call.getString("url");
        if (urlStr == null) {
            call.reject("url is missing");
            return;
        }
        new Thread(new Runnable() {
            @Override
            public void run() {
                HttpURLConnection c = null;
                try {
                    File dir = new File(getContext().getCacheDir(), "updates");
                    if (!dir.exists()) {
                        dir.mkdirs();
                    }
                    File[] old = dir.listFiles();
                    if (old != null) {
                        for (File f : old) {
                            f.delete();
                        }
                    }
                    File out = new File(dir, "update.apk");
                    c = (HttpURLConnection) new URL(urlStr).openConnection();
                    c.setConnectTimeout(15000);
                    c.setReadTimeout(30000);
                    c.setInstanceFollowRedirects(true);
                    c.connect();
                    int code = c.getResponseCode();
                    if (code != 200) {
                        call.reject("Server answered " + code);
                        return;
                    }
                    long total = c.getContentLengthLong();
                    InputStream in = c.getInputStream();
                    FileOutputStream os = new FileOutputStream(out);
                    byte[] buf = new byte[65536];
                    long got = 0;
                    int lastPct = -1;
                    int n;
                    while ((n = in.read(buf)) > 0) {
                        os.write(buf, 0, n);
                        got += n;
                        int pct = total > 0 ? (int) (got * 100 / total) : 0;
                        if (pct != lastPct) {
                            lastPct = pct;
                            JSObject e = new JSObject();
                            e.put("percent", pct);
                            e.put("received", got);
                            e.put("total", total);
                            notifyListeners("progress", e);
                        }
                    }
                    os.close();
                    in.close();
                    if (total > 0 && got != total) {
                        call.reject("The download was cut off");
                        return;
                    }
                    JSObject r = new JSObject();
                    r.put("path", out.getAbsolutePath());
                    call.resolve(r);
                } catch (Exception e) {
                    call.reject(String.valueOf(e.getMessage()));
                } finally {
                    if (c != null) {
                        c.disconnect();
                    }
                }
            }
        }).start();
    }

    @PluginMethod
    public void install(PluginCall call) {
        try {
            File f = new File(getContext().getCacheDir(), "updates/update.apk");
            if (!f.exists()) {
                call.reject("The update file was not found");
                return;
            }
            Uri uri = FileProvider.getUriForFile(getContext(), getContext().getPackageName() + ".updater", f);
            Intent i = new Intent(Intent.ACTION_VIEW);
            i.setDataAndType(uri, "application/vnd.android.package-archive");
            i.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_ACTIVITY_NEW_TASK);
            getContext().startActivity(i);
            call.resolve();
        } catch (Exception e) {
            call.reject(String.valueOf(e.getMessage()));
        }
    }
}
