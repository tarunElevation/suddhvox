# ShuddhVox (शुद्ध Vox)

ऑडियो और वीडियो से बैकग्राउंड शोर हटाने वाला Android ऐप। Created by Tarun.

## APK कैसे बनाएँ (फ़ोन से)

1. GitHub में इस repository के **Actions** टैब पर जाइए।
2. बाईं तरफ़ **Build APK** चुनिए, फिर **Run workflow** दबाइए।
3. 5 से 10 मिनट बाद उस run को खोलिए। नीचे **Artifacts** में **ShuddhVox-apk** मिलेगा।
4. उसे डाउनलोड करके खोलिए (ZIP है), अंदर `app-debug.apk` है। फ़ोन में इंस्टॉल कीजिए।

पहली बार इंस्टॉल करते समय फ़ोन "अज्ञात स्रोत" की अनुमति माँगेगा। दे दीजिए।

यह debug APK है, दोस्तों के साथ टेस्ट करने के लिए। Play Store के लिए signed release बिल्ड अलग से चाहिए, वह अगला क़दम है।

## विज्ञापन (AdMob)

सब सेटिंग `www/admob.json` में हैं:

| नाम | मतलब |
|---|---|
| `testing` | `true` पर Google के टेस्ट ऐड दिखते हैं। असली ऐड के लिए `false` कीजिए |
| `appId` | AdMob की App ID, `ca-app-pub-xxxxxxxx~yyyyyyyy` जैसी |
| `bannerAdUnitId` | AdMob की Ad unit ID, `ca-app-pub-xxxxxxxx/yyyyyyyy` जैसी |
| `idleBanner` | `true` करने पर प्रोसेस के बाहर भी नीचे छोटा बैनर रहेगा |

अभी इसमें Google के आधिकारिक **टेस्ट** ID हैं। इनसे कमाई नहीं होती।

असली ऐड चालू करने के क़दम:
1. admob.google.com पर खाता बनाइए और अपना ऐप जोड़िए। App ID मिलेगी।
2. उस ऐप में एक **Banner** ad unit बनाइए। Ad unit ID मिलेगी।
3. `www/admob.json` में दोनों ID चिपकाइए और `testing` को `false` कीजिए।
4. Actions में दोबारा **Build APK** चलाइए।

अपने ही असली ऐड पर बार-बार टैप मत कीजिए। इससे AdMob खाता बंद हो सकता है। टेस्टिंग में टेस्ट ऐड ही रखिए।

## ऐड कहाँ दिखते हैं

जब फ़ाइल प्रोसेस होती है, ऊपर वाला हिस्सा तरंग और प्रगति दिखाता है और नीचे 300x250 का ऐड चलता है। प्रोसेस पूरी होते ही ऐड हट जाता है।

## बदलाव कैसे करें

- ऐप का रूप और काम: `www/index.html`
- ऐड की सेटिंग: `www/admob.json`
- ऐप का नाम और ID: `capacitor.config.json`

बदलाव के बाद दोबारा **Build APK** चलाइए।

## Play Store से पहले

- Play Console का डेवलपर खाता
- Signed release बिल्ड (keystore)
- Privacy Policy का पेज, क्योंकि ऐप में विज्ञापन हैं
- AdMob की असली ID
- ऐप का आइकन और स्क्रीनशॉट
