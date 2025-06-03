# React Native DateTimePicker

This repository was moved out of the react native community GH organization, in accordance to [this proposal](https://github.com/react-native-community/discussions-and-proposals/issues/463). The module is still published on npm under the old namespace (as documented) but will be published under a new namespace at some point, with a major version bump.

[![CircleCI Status](https://circleci.com/gh/react-native-community/react-native-datetimepicker.svg?style=shield)](https://circleci.com/gh/react-native-community/react-native-datetimepicker) [![Supports Android and iOS](https://img.shields.io/badge/platforms-android%20|%20ios%20|%20windows-lightgrey.svg)](https://github.com/react-native-community/react-native-datetimepicker) [![MIT License](https://img.shields.io/npm/l/@react-native-community/datetimepicker.svg)](https://github.com/react-native-community/react-native-datetimepicker/blob/master/LICENSE) [![Lean Core Badge](https://img.shields.io/badge/Lean%20Core-Extracted-brightgreen.svg)](https://github.com/facebook/react-native/issues/23313)

React Native date & time picker component for iOS, Android and Windows (please note Windows is not actively maintained).

## Screenshots
<details>
<summary>Expand for screenshots</summary>

| iOS Date | iOS Time | iOS DateTime | iOS Countdown |
|---|---|---|---|
| ![ios date picker](https://user-images.githubusercontent.com/716980/159198891-4713f110-f11c-4115-841e-461150161e1d.png) | ![ios time picker](https://user-images.githubusercontent.com/716980/159198900-80f3f110-f11c-4115-841e-461150161e1d.png) | ![ios datetime picker](https://user-images.githubusercontent.com/716980/159198905-c1f3f110-f11c-4115-841e-461150161e1d.png) | ![ios countdown picker](https://user-images.githubusercontent.com/716980/159198910-05f3f110-f11c-4115-841e-461150161e1d.png) |

| Android Date | Android Time |
|---|---|
| ![android date picker](https://user-images.githubusercontent.com/716980/159198915-4713f110-f11c-4115-841e-461150161e1d.png) | ![android time picker](https://user-images.githubusercontent.com/716980/159198920-80f3f110-f11c-4115-841e-461150161e1d.png) |

| Windows Date | Windows Time |
|---|---|
| ![windows date picker](https://user-images.githubusercontent.com/716980/159198925-c1f3f110-f11c-4115-841e-461150161e1d.png) | ![windows time picker](https://user-images.githubusercontent.com/716980/159198930-05f3f110-f11c-4115-841e-461150161e1d.png) |

</details>

## Table of contents

- [React Native DateTimePicker](#react-native-datetimepicker)
  - [Screenshots](#screenshots)
  - [Table of contents](#table-of-contents)
  - [Requirements](#requirements)
  - [Expo users notice](#expo-users-notice)
  - [Getting started](#getting-started)
    - [RN \>= 0.60](#rn--060)
  - [React Native Support](#react-native-support)
  - [Usage](#usage)
  - [Localization note](#localization-note)
  - [Android imperative api](#android-imperative-api)
  - [Android styling](#android-styling)
  - [Component props / params of the Android imperative api](#component-props--params-of-the-android-imperative-api)
    - [mode (optional)](#mode-optional)
    - [display (optional)](#display-optional)
    - [design (optional, Android only)](#design-optional-android-only)
    - [onChange (optional)](#onchange-optional)
    - [value (required)](#value-required)
    - [maximumDate (optional)](#maximumdate-optional)
    - [minimumDate (optional)](#minimumdate-optional)
    - [timeZoneName (optional, iOS and Android only)](#timezonename-optional-ios-and-android-only)
    - [timeZoneOffsetInMinutes (optional, iOS and Android only)](#timezoneoffsetinminutes-optional-ios-and-android-only)
    - [timeZoneOffsetInSeconds (optional, Windows only)](#timezoneoffsetinseconds-optional-windows-only)
    - [dayOfWeekFormat (optional, Windows only)](#dayofweekformat-optional-windows-only)
    - [dateFormat (optional, Windows only)](#dateformat-optional-windows-only)
    - [firstDayOfWeek (optional, Android and Windows only)](#firstdayofweek-optional-android-and-windows-only)
    - [textColor (optional, iOS only)](#textcolor-optional-ios-only)
    - [accentColor (optional, iOS only)](#accentcolor-optional-ios-only)
    - [themeVariant (optional, iOS only)](#themevariant-optional-ios-only)
    - [locale (optional, iOS only)](#locale-optional-ios-only)
    - [is24Hour (optional, Windows and Android only)](#is24hour-optional-windows-and-android-only)
    - [initialInputMode (optional, Android only)](#initialinputmode-optional-android-only)
    - [title (optional, Android only)](#title-optional-android-only)
    - [fullscreen (optional, Android only)](#fullscreen-optional-android-only)
    - [positiveButton (optional, Android only)](#positivebutton-optional-android-only)
    - [neutralButton (optional, Android only)](#neutralbutton-optional-android-only)
    - [negativeButton (optional, Android only)](#negativebutton-optional-android-only)
    - [positiveButtonLabel (optional, Android only, deprecated)](#positivebuttonlabel-optional-android-only-deprecated)
    - [negativeButtonLabel (optional, Android only, deprecated)](#negativebuttonlabel-optional-android-only-deprecated)
    - [neutralButtonLabel (optional, Android only, deprecated)](#neutralbuttonlabel-optional-android-only-deprecated)
    - [minuteInterval (optional)](#minuteinterval-optional)
    - [style (optional, iOS only)](#style-optional-ios-only)
    - [disabled (optional, iOS only)](#disabled-optional-ios-only)
    - [testID (optional)](#testid-optional)
    - [View Props (optional, iOS only)](#view-props-optional-ios-only)
    - [onError (optional, Android only)](#onerror-optional-android-only)
  - [Testing with Jest](#testing-with-jest)

## Requirements

Only Android API level >=21 (Android 5), iOS >= 11 are supported.
Tested with Xcode 14.0 and RN 0.72.7. Other configurations are very likely to work as well but have not been tested.
The module supports the new React Native architecture (Fabric rendering of iOS components, and turbomodules on Android). If you are using the new architecture, you will need to use React Native 0.71.4 or higher.

## Expo users notice

This module is part of Expo Managed Workflow - see [docs](https://docs.expo.dev/versions/latest/sdk/date-time-picker/). However, Expo SDK in the Managed Workflow may not contain the latest version of the module and therefore, the newest features and bugfixes may not be available in Expo Managed Workflow. If you use the Managed Workflow, use the command `expo install @react-native-community/datetimepicker` (not `yarn` or `npm`) to install this module - Expo will automatically install the latest version compatible with your Expo SDK (which may not be the latest version of the module available).

If you're using a Dev Client, rebuild the Dev Client after installing the dependencies.

If you're using the `expo prebuild` command and building your native app projects (e.g. with EAS Build or locally), you can use the latest version of the module.

## Getting started

```bash
npm install @react-native-community/datetimepicker --save
```

or

```bash
yarn add @react-native-community/datetimepicker
```

Autolinking is not yet implemented on Windows, so [manual installation](#manual-installation) is needed.

### RN >= 0.60

If you are using RN >= 0.60, only run `npx pod-install`. Then rebuild your project.

## React Native Support

Check the react-native version support table below to find the corresponding datetimepicker version to meet support requirements. Maintenance is only provided for last 3 stable react-native versions.

| react-native version | version |
| -------------------- | ------- |
| 0.73.0+              | 7.6.3+  |
| <=0.72.0             | <=7.6.2 |
| 0.70.0+              | 7.0.1+  |
| <0.70.0              | <=7.0.0 |

## Usage

```javascript
import DateTimePicker from '@react-native-community/datetimepicker';
```

<details>
<summary>Expand for examples</summary>

```javascript
import React, {useState} from 'react';
import {View, Button, Platform} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';

export const App = () => {
  const [date, setDate] = useState(new Date(1598051730000));
  const [mode, setMode] = useState('date');
  const [show, setShow] = useState(false);

  const onChange = (event, selectedDate) => {
    const currentDate = selectedDate || date;
    setShow(Platform.OS === 'ios');
    setDate(currentDate);
  };

  const showMode = (currentMode) => {
    setShow(true);
    setMode(currentMode);
  };

  const showDatepicker = () => {
    showMode('date');
  };

  const showTimepicker = () => {
    showMode('time');
  };

  return (
    <View>
      <View>
        <Button onPress={showDatepicker} title="Show date picker!" />
      </View>
      <View>
        <Button onPress={showTimepicker} title="Show time picker!" />
      </View>
      {show && (
        <DateTimePicker
          testID="dateTimePicker"
          value={date}
          mode={mode}
          is24Hour={true}
          display="default"
          onChange={onChange}
        />
      )}
    </View>
  );
};
```

</details>

## Localization note

By localization, we refer to the language (names of months and days), as well as order in which date can be presented in a picker (month/day vs. day/month) and 12 / 24 hour-format.

On Android, the picker will be controlled by the system locale. If you wish to change it, see instructions [here](https://developer.android.com/guide/topics/resources/localization).

On iOS, use XCode, as documented [here](https://developer.apple.com/library/archive/documentation/MacOSX/Conceptual/BPInternational/LocalizingYourApp/LocalizingYourApp.html) to inform the OS about the locales your application supports. iOS will automatically display the correctly localized DateTimePicker as long as the target language is contained in `project.pbxproj`.

If you use a library like `i18next` or `react-localize-redux` to manage your translations, it is sufficient to add your target languages as described in the Apple Documentation - but you are not required to add any localization keys (like, for example, the days of the week). iOS will automatically display the correct localized strings as long as the target language is contained in `project.pbxproj`.

For testing your localization setup, refer [here](https://developer.apple.com/library/archive/documentation/MacOSX/Conceptual/BPInternational/TestingYourInternationalApp/TestingYourInternationalApp.html).

There is also the iOS-only `locale` prop that can be used to force locale in some cases but its usage is discouraged due to not working robustly in all picker modes (note the mixed month and day names). To the best of our knowledge, it works reliably in the `spinner` mode.

For Expo, follow the [localization docs](https://docs.expo.dev/guides/localization/).

## Android imperative api

On Android, you have a choice between using the component API (regular React component) or an imperative api (think of something like `ReactNative.alert()`).

While the component API has the benefit of writing the same code on all platforms, for start we recommend using the imperative API on Android.

The `params` is an object with the same properties as the component props documented in the next paragraph. (This is also because the component api internally uses the imperative one.)

```javascript
import { DateTimePickerAndroid } from '@react-native-community/datetimepicker';

DateTimePickerAndroid.open(params: AndroidNativeProps)
DateTimePickerAndroid.dismiss(mode: AndroidNativeProps['mode'])
```

The reason we recommend the imperative API is: on Android, the date/time picker opens in a dialog, similar to `ReactNative.alert()` from core react native. The imperative api models this behavior better than the declarative component api. While the component approach is perfectly functional, based on the issue tracker history, it appears to be more prone to introducing bugs.

## Android styling

If you'd like to use the Material pickers, your app theme will need to inherit from `Theme.Material3.DayNight.NoActionBar` in `styles.xml`.

Styling of the dialogs on Android can be easily customized by using the provided config plugin, provided that you use a Expo development build. The plugin allows you to configure color properties that cannot be set at runtime and requires building a new app binary to take effect.

Refer to this documentation for more information: [android-styling.md](https://github.com/react-native-community/react-native-datetimepicker/blob/master/docs/android-styling.md).

## Component props / params of the Android imperative api

Please note that this library currently exposes functionality from `UIDatePicker` on iOS and `DatePickerDialog` + `TimePickerDialog` on Android, and `CalendarDatePicker` + `TimePicker` on Windows.

These native classes offer only limited configuration, while there are dozens of possible options you as a developer may need. It follows that if your requirement is not supported by the backing native views, this library will not be able to implement your requirement. When you open an issue with a feature request, please document if (or how) the feature can be implemented using the aforementioned native views. If the native views do not support what you need, such feature requests will be closed as not actionable.

### mode (optional)

Defines the type of the picker.

List of possible values:

- `"date"` (default for iOS and Android and Windows)
- `"time"`
- `"datetime"` (iOS only)
- `"countdown"` (iOS only)

```jsx
<RNDateTimePicker mode="time" />
```

### display (optional)

Defines the visual display of the picker. The default value is `"default"`.

List of possible values for Android

- `"default"` - Recommended. Show a default date picker (spinner/calendar/clock) based on mode.
- `"spinner"`
- `"calendar"` (only for `date` mode)
- `"clock"` (only for `time` mode)

List of possible values for iOS (maps to `preferredDatePickerStyle`)

- `"default"` - Automatically pick the best style available for the current platform & mode.
- `"spinner"` - the usual pre-iOS 14 appearance with a wheel from which you choose values
- `"compact"` - Affects only iOS 14 and later. Will fall back to `"spinner"` if not supported.
- `"inline"` - Affects only iOS 14 and later. Will fall back to `"spinner"` if not supported.

```jsx
<RNDateTimePicker display="spinner" />
```

### design (optional, Android only)

Defines if the picker should use Material 3 components or the default picker. The default value is `"default"`.

List of possible values

- `"default"`
- `"material"`

```jsx
<RNDateTimePicker design="material" />
```

### onChange (optional)

Date change handler.

This is called when the user changes the date or time in the UI. It receives the event and the date as parameters. It is also called when user dismisses the picker, which you can detect by checking the `event.type` property. The values can be: `'set' | 'dismissed' | 'neutralButtonPressed'`. (`neutralButtonPressed` is only available on Android).

The `utcOffset` field is only available on Android and iOS. It is the offset in minutes between the selected date and UTC time.

```javascript
const setDate = (event: DateTimePickerEvent, date: Date) => {
  const {
    type,
    nativeEvent: {timestamp, utcOffset},
  } = event;
};

<RNDateTimePicker onChange={this.setDate} />;
```

### value (required)

Defines the date or time value used in the component.

```jsx
<RNDateTimePicker value={new Date()} />
```

### maximumDate (optional)

Defines the maximum date that can be selected. Note that on Android, this only works for `date` mode because `TimePicker` does not support this.

```jsx
<RNDateTimePicker maximumDate={new Date(2030, 10, 20)} />
```

### minimumDate (optional)

Defines the minimum date that can be selected. Note that on Android, this only works for `date` mode because `TimePicker` does not support this.

```jsx
<RNDateTimePicker minimumDate={new Date(1950, 0, 1)} />
```

### timeZoneName (optional, iOS and Android only)

Allows changing of the time zone of the date picker. By default, it uses the device's time zone. Use the time zone name from the IANA (TZDB) database name in https://en.wikipedia.org/wiki/List_of_tz_database_time_zones.

```jsx
<RNDateTimePicker timeZoneName={'Europe/Prague'} />
```

### timeZoneOffsetInMinutes (optional, iOS and Android only)

Allows changing of the time zone of the date picker. By default, it uses the device's time zone. We strongly recommend using `timeZoneName` prop instead; this prop has known issues in the android implementation (eg. [#528](https://github.com/react-native-community/react-native-datetimepicker/issues/528)).

This prop will be removed in a future release.

```jsx
// GMT+1
<RNDateTimePicker timeZoneOffsetInMinutes={60} />
```

### timeZoneOffsetInSeconds (optional, Windows only)

Allows changing of the time zone of the date picker. By default, it uses the device's time zone.

```jsx
// UTC+1
<RNDateTimePicker timeZoneOffsetInSeconds={3600} />
```

### dayOfWeekFormat (optional, Windows only)

Sets the display format for the day of the week headers. Reference: https://docs.microsoft.com/en-us/uwp/api/windows.ui.xaml.controls.calendarview.dayofweekformat?view=winrt-18362#remarks

```jsx
<RNDateTimePicker dayOfWeekFormat={'{dayofweek.abbreviated(2)}'} />
```

### dateFormat (optional, Windows only)

Sets the display format for the date value in the picker's text box. Reference: https://docs.microsoft.com/en-us/uwp/api/windows.globalization.datetimeformatting.datetimeformatter?view=winrt-18362#examples

```jsx
<RNDateTimePicker dateFormat="dayofweek day month" />
```

### firstDayOfWeek (optional, Android and Windows only)

Indicates which day is shown as the first day of the week.

```jsx
<RNDateTimePicker firstDayOfWeek={DAY_OF_WEEK.Wednesday} />
// The native parameter type is an enum defined in defined https://docs.microsoft.com/en-us/uwp/api/windows.globalization.dayofweek?view=winrt-18362 - meaning an integer needs to passed here (DAY_OF_WEEK).
```

### textColor (optional, iOS only)

Allows changing of the textColor of the date picker. Has effect only when `display` is `"spinner"`.

```jsx
<RNDateTimePicker textColor="red" />
```

### accentColor (optional, iOS only)

Allows changing the `accentColor` (`tintColor`) of the date picker. Has no effect when `display` is `"spinner"`.

### themeVariant (optional, iOS only)

Allows overriding system theme variant (dark or light mode) used by the date picker. However, we recommend that you instead control the theme of the whole application using [react-native-theme-control](https://github.com/vonovak/react-native-theme-control).

⚠️ Has effect only on iOS 14 and later. On iOS 13 & less, use `textColor` to make the picker dark-theme compatible

List of possible values:

- `"light"`
- `"dark"`

```jsx
<RNDateTimePicker themeVariant="light" />
```

### locale (optional, iOS only)

Allows changing the locale of the component. This affects the displayed text and the date / time formatting. By default, the device's locale is used. Please note using this prop is discouraged due to not working reliably in all picker modes. Prefer localization as documented in [Localization note](#localization-note).

```jsx
<RNDateTimePicker locale="es-ES" />
```

### is24Hour (optional, Windows and Android only)

Allows changing of the time picker to a 24-hour format. By default, this value is decided automatically based on the locale and other preferences.

```jsx
<RNDateTimePicker is24Hour={true} />
```

### initialInputMode (optional, Android only)

⚠️ Has effect only when `design` is `"material"`. Allows setting the initial input mode of the picker.

List of possible values:

- `"default"` - Recommended. Date pickers will show the calendar view by default, and time pickers will show the clock view by default.
- `"keyboard"` - Both pickers will show an input where the user can type the date or time.

```jsx
<RNDateTimePicker initialInputMode="default" />
```

### title (optional, Android only)

⚠️ Has effect only when `design` is `"material"`. Allows setting the title of the dialog for the pickers.

```jsx
<RNDateTimePicker title="Choose anniversary" />
```

### fullscreen (optional, Android only)

⚠️ Has effect only when `design` is `"material"`. Allows setting the date picker dialog to be fullscreen.

```jsx
<RNDateTimePicker fullscreen={true} />
```

### positiveButton (optional, Android only)

Set the positive button label and text color.

```jsx
<RNDateTimePicker positiveButton={{label: 'OK', textColor: 'green'}} />
```

### neutralButton (optional, Android only)

Allows displaying neutral button on picker dialog. Pressing button can be observed in `onChange` handler as `event.type === 'neutralButtonPressed'`

```jsx
<RNDateTimePicker neutralButton={{label: 'Clear', textColor: 'grey'}} />
```

### negativeButton (optional, Android only)

Set the negative button label and text color.

```jsx
<RNDateTimePicker negativeButton={{label: 'Cancel', textColor: 'red'}} />
```

### positiveButtonLabel (optional, Android only, deprecated)

Changes the label of the positive button.

```jsx
<RNDateTimePicker positiveButtonLabel="OK!" />
```

### negativeButtonLabel (optional, Android only, deprecated)

Changes the label of the negative button.

```jsx
<RNDateTimePicker negativeButtonLabel="Negative" />
```

### neutralButtonLabel (optional, Android only, deprecated)

Allows displaying neutral button on picker dialog. Pressing button can be observed in `onChange` handler as `event.type === 'neutralButtonPressed'`

```jsx
<RNDateTimePicker neutralButtonLabel="clear" />
```

### minuteInterval (optional)

The interval at which minutes can be selected. Possible values are: `1, 2, 3, 4, 5, 6, 10, 12, 15, 20, 30`

On Windows, this can be any number between 0-59.

on iOS, this in only supported when `display="spinner"`

```jsx
<RNDateTimePicker minuteInterval={10} />
```

### style (optional, iOS only)

Sets style directly on picker component. By default, the picker dimensions are determined based on the props.

Please note that by default, picker's text color is controlled by the application theme (light / dark mode). In dark mode, text is white and in light mode, text is black. If you want to control the application theme, we recommend using [react-native-theme-control](https://github.com/vonovak/react-native-theme-control).

This means that e.g. if the device has dark mode turned on, and your screen background color is white, you will not see the picker. Please use the `Appearance` api to adjust the picker's background color so that it is visible, as we do in the example App. Alternatively, use the `themeVariant` prop.

```jsx
<RNDateTimePicker style={{flex: 1}} />
```

### disabled (optional, iOS only)

If true, the user won't be able to interact with the view.

### testID (optional)

Usually used by app automation frameworks. Fully supported on iOS. On Android, only supported for `mode="date"`.

```jsx
<RNDateTimePicker testID="datePicker" />
```

### View Props (optional, iOS only)

On iOS, you can pass any `View` props to the component. Given that the underlying component is a native view, not all of them are guaranteed to be supported, but `testID` and `onLayout` are known to work.

### onError (optional, Android only)

Callback that is called when an error occurs inside the date picker native code (such as null activity).

## Testing with Jest