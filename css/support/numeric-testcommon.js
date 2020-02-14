'use strict';

/*
Provides functions to help test that two numeric values are equivalent.
These *do not* rely on you predicting what one value will serialize to;
instead, they set and serialize *both* values,
and just ensure that they serialize to the same thing.

They rely on a #target element existing in the document,
as this might rely on layout to resolve styles,
and so it needs to be in the document.

Two main functions are defined, with the same signatures:
test_math_used() (for testing used values)
and test_math_computed() (for testing computed values).
Signature for both is:

test_math_X(
    testString, // A numeric value; required.
    expectedString, // A hopefully-equivalent numeric value; required.
    { // all of these are optional
        type, // "number", "length", etc. See impl for full list. Defaults to "length".
        base, // a valid value that neither test nor expected should serialize to.
              // Defaults to an appropriate value for the given 'type'.
        msg, // The message to display for the test; autogenned if not provided.
        msgExtra, // Extra info to put after the auto-genned message.
        prop, // If you want to override the automatic choice of tested property.
        extraStyle, // Styles that need to be set at the same time to properly test the value.
    }
);


Additionally, five specialized functions are provided
to test that a given value is ±∞, ±0, or NaN:

* test_plus_infinity(testString)
* test_minus_infinity(testString)
* test_plus_zero(testString)
* test_minus_zero(testString)
* test_nan(testString)

*/



function test_math_used(testString, expectedString, {base, msg, msgExtra, prop, type, extraStyle={}}={}) {
    if(type === undefined) type = "length";
    let prefix, suffix;
    if(!prop) {
        switch(type) {
            case "number":     prop = "transform"; prefix="scale("; suffix=")"; break;
            case "integer":    prop = "z-index"; extraStyle.position="absolute"; break;
            case "length":     prop = "margin-left"; break;
            case "angle":      prop = "transform"; prefix="rotate("; suffix=")"; break;
            case "time":       prop = "transition-delay"; break;
            case "resolution": prop = "image-resolution"; break;
            case "flex":       prop = "grid-template-rows"; break;
            default: throw Exception(`Value type '${type}' isn't capable of math.`);
        }

    }
    if(!base) {
        switch(type) {
            case "number":     base = "1.23"; break;
            case "integer":    base = "123"; break;
            case "length":     base = "123px"; break;
            case "angle":      base = "123deg"; break;
            case "time":       base = "123s"; break;
            case "resolution": base = "123dpi"; break;
            case "flex":       base = "123fr"; break;
        }
    }
    _test_math({stage:'used', testString, expectedString, base, msg, msgExtra, prop, prefix, suffix, extraStyle});
}

function test_math_computed(testString, expectedString, {base, msg, msgExtra, type}={}) {
    if(type === undefined) type = "length";
    if(!prop) {
        switch(type) {
            case "number":     prop = "transform"; prefix="scale("; suffix=")"; break;
            case "integer":    prop = "z-index"; extraStyle.position="absolute"; break;
            case "length":     prop = "flex-basis"; break;
            case "angle":      prop = "transform"; prefix="rotate("; suffix=")"; break;
            case "time":       prop = "transition-delay"; break;
            case "resolution": prop = "image-resolution"; break;
            case "flex":       prop = "grid-template-rows"; break;
            default: throw Exception(`Value type '${type}' isn't capable of math.`);
        }

    }
    if(!base) {
        switch(type) {
            case "number":     base = "1.23"; break;
            case "integer":    base = "123"; break;
            case "length":     base = "123px"; break;
            case "angle":      base = "123deg"; break;
            case "time":       base = "123s"; break;
            case "resolution": base = "123dpi"; break;
            case "flex":       base = "123fr"; break;
        }
    }
    _test_math({stage:'computed', testString, expectedString, base, msg, msgExtra, prop, prefix, suffix, extraStyle});
}

/*
All of these expect the testString to evaluate to a <number>.
*/
function test_plus_infinity(testString) {
    test_math_used(testString, "calc(infinity)", {type:"number"});
}
function test_minus_infinity(testString) {
    test_math_used(testString, "calc(-infinity)", {type:"number"});
}
function test_plus_zero(testString) {
    test_math_used(`calc(1 / ${testString})`, "calc(infinity)", {type:"number"});
}
function test_minus_zero(testString) {
    test_math_used(`calc(1 / ${testString})`, "calc(-infinity)", {type:"number"});
}
function test_nan(testString) {
    // Make sure that it's NaN, not an infinity,
    // by making sure that it's the same value both pos and neg.
    test_math_used(testString, "calc(NaN)", {type:"number"});
    test_math_used(`calc(-1 * ${testString})`, "calc(NaN)", {type:"number"});
}


function _test_math({stage, testEl, testString, expectedString, base, msg, msgExtra, prop, prefix, suffix, extraStyle}={}) {
    // Find the test element
    if(!testEl) testEl = document.getElementById('target');
    if(testEl == null) throw "Couldn't find #target element to run tests on.";
    // Then reset its styles
    testEl.style = "";
    for(const p in extraStyle) {
        testEl.style[p] = extraStyle[p];
    }
    if(!msg) {
        msg = `${testString} should be ${stage}-value-equivalent to ${expectedString}`;
        if(msgExtra) msg += "; " + msgExtra;
    }
    let t = testString;
    let e = expectedString;
    let b = base;
    if(prefix) {
        t = prefix + t;
        e = prefix + e;
        b = prefix + b;
    }
    if(suffix) {
        t += suffix;
        e += suffix;
        b += suffix;
    }
    test(()=>{
        testEl.style[prop] = base;
        testEl.style[prop] = t;
        const usedValue = getComputedStyle(testEl)[prop];
        assert_not_equals(usedValue, base, `${testString} isn't valid in '${prop}'; got the default value instead.`);
        testEl.style[prop] = base;
        testEl.style[prop] = e;
        const expectedValue = getComputedStyle(testEl)[prop];
        assert_not_equals(expectedValue, base, `${expectedString} isn't valid in '${prop}'; got the default value instead.`)
        assert_equals(usedValue, expectedValue, `${testString} and ${expectedString} serialize to the same thing in ${stage} values.`);
    }, msg || `${testString} should be ${stage}-value-equivalent to ${expectedString}`);
}