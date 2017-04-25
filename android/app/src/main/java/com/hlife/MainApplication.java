package com.hlife;

import android.app.Application;
import com.microsoft.codepush.react.CodePush;

import com.avishayil.rnrestart.ReactNativeRestartPackage;
import com.beefe.picker.PickerViewPackage;
import com.burnweb.rnsendintent.RNSendIntentPackage;
import com.facebook.react.ReactApplication;
import com.zachary.reactnative.leancloudsdk.AvOsCloudPackage;
import com.reactnative.ivpusic.imagepicker.PickerPackage;
import com.learnium.RNDeviceInfo.RNDeviceInfo;
import com.facebook.react.ReactNativeHost;
import com.facebook.react.ReactPackage;
import com.facebook.react.shell.MainReactPackage;
import com.facebook.soloader.SoLoader;
import com.github.alinz.reactnativewebviewbridge.WebViewBridgePackage;
import com.hlife.baidumap.BaiduMapPackage;
import com.imagepicker.ImagePickerPackage;
import com.rnfs.RNFSPackage;

import java.util.Arrays;
import java.util.List;

import com.lwansbrough.RCTCamera.RCTCameraPackage;
import com.BV.LinearGradient.LinearGradientPackage;
import com.hlife.RCTPingPP.RCTPingPPPackage;

public class MainApplication extends Application implements ReactApplication {

    private final ReactNativeHost mReactNativeHost;

    {
        mReactNativeHost = new ReactNativeHost(this) {

    @Override
    protected String getJSBundleFile() {
      return CodePush.getJSBundleFile();
    }

//    @Override
//    protected String getJSBundleFile() {
//      return CodePush.getJSBundleFile();
//    }

            @Override
            protected boolean getUseDeveloperSupport() {
                return BuildConfig.DEBUG;
            }

            @Override
            protected List<ReactPackage> getPackages() {
                return Arrays.<ReactPackage>asList(
                        new MainReactPackage(),
                        new CodePush("LRFxUILuHnlMKRCW_JBlR6hpihP9Ek1T6J40f", MainApplication.this, BuildConfig.DEBUG),
                        new AvOsCloudPackage(),
                        new PickerPackage(),
                        new RNDeviceInfo(),
                        new RCTCameraPackage(),
                        new RNSendIntentPackage(),
                        new ReactNativeRestartPackage(),
                        new PickerViewPackage(),
                        new WebViewBridgePackage(),
                        new RNFSPackage(),
                        new ImagePickerPackage(),
                        new BaiduMapPackage(getApplicationContext()),
                        new LinearGradientPackage(),
                        new RCTPingPPPackage()
//                        new CodePush(BuildConfig.CODEPUSH_KEY, MainApplication.this, BuildConfig.DEBUG)
                        // Add/change this line.

                );
            }
        };
    }

    @Override
    public ReactNativeHost getReactNativeHost() {
        return mReactNativeHost;
    }

    @Override
    public void onCreate() {
        super.onCreate();
        SoLoader.init(this, /* native exopackage */ false);
    }
}
