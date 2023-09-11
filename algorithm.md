# TailorD Sizing Algorithm

- User data measurements stored in Firebase
- Site data measurements loaded on content.js

Label key mapping array defined:
```js
const filteredDataToMeasurementKeyMap = {
  "bust or chest": "chest",
  "hip": "hip",
  "sleeve tall": "armslength",
}
```

`matrix` & `style` are defined by the user.

Each line item in the site data that matches user-specified matrix and style values is a candidate.

Each candidate has a series of measurements and values. For each of these measurements, the difference between the user's measurement and the candidate's measurement is appended to a "difference" number representing this candidate's overall fit.

If either values are a range, the average is used:

```js
  if (candidateMeasurement.includes("-")) {
    const split = candidateMeasurement.split("-");
    const first = parseFloat(split[0]);
    const second = parseFloat(split[1]);
    candidateMeasurement = (first + second) / 2;
  }
```

These candidates are then sorted by their difference value, and the top 1 is returned to the user:

```js
Object.keys(results).forEach((resultKey) => {
  const result = results[resultKey];
  if (lowestDifference == null || result.difference < lowestDifference) {
    lowestDifference = result.difference;
    lowestDifferenceSize = result
  }
})
```

Some processing is done to calculate the listed size, US, pant, etc.

<b>The complete algorithm needs to be much improved and organized. Code quality is very bad right now, but this is a general idea of how it works.</b>