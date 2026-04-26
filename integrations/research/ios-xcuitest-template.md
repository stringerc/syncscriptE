# Xcode UI tests — where to add them

If the `ios/` tree is not writable from your environment, add the **UI Testing Bundle** in Xcode locally. Recommended target path: `ios/App/AppUITests/`.

**Minimum smoke:** launch app → assert web shell loaded.

**Deep link:** exercise `syncscript://open?path=...` per [`src/native/CAPACITOR_IOS_QUICKSTART.md`](../../src/native/CAPACITOR_IOS_QUICKSTART.md).

Full matrix: [`VERIFY_UNIFIED_PLATFORM.md`](./VERIFY_UNIFIED_PLATFORM.md).
