# Cypress Playback

> :arrows_counterclockwise: **_Automatically record and playback HTTP requests made in
> Cypress tests._**

[![NPM](https://img.shields.io/npm/v/@oreillymedia/cypress-playback)][9]
[![Contributor Covenant](https://img.shields.io/badge/Contributor%20Covenant-2.1-4baaaa.svg)][8]

Cypress Playback is a plugin and a set of commands that allows [Cypress][7] to
automatically record responses to network requests made during a test run. These
responses are then saved to disk and made available for playback in later test
runs. This allows for applications or components under test to always receive
the same response to a request, no matter where or when they run.

This plugin is *not* a replacement for the `cy.intercept` command, but is
instead a wrapper around that command. It handles situations where a developer
isn't concerned with the contents of a response to a network request, just that
the response is always the same.

## Quick start

This README contains the full documentation for Cypress Playback
but this quick start will get you going in just a few minutes.

### Installation

**Step 1.** In a project with Cypress installed, run:

```bash
npm install @oreillymedia/cypress-playback -D
```

**Step 2.** Add the tasks to the project's `setupNodeEvents` in `cypress.config.js` file
([Cypress plugin usage docs][10]):

```JavaScript
setupNodeEvents(on, config) => {
  require('@oreillymedia/cypress-playback/addTasks')(on, config);
  ...
})
```

**Step 3.** Add the commands to the project's `cypress/support/commands.js` file:

```JavaScript
import '@oreillymedia/cypress-playback/addCommands';
```

### Insert `playback` commands

The `playback` command is a wrapper around the [Cypress' `intercept`][1] command
and can be used in much the same way.

A notable exception is that it doesn't provide any way to attach a request
handler or a provide a static response, as that isn't the purpose of this
plugin. This plugin is designed to capture real responses and record them for
later playback. For providing fixtures as responses, the normal `cy.intercept`
command should be used.

#### Syntax

```JavaScript
// Records or plays back network responses, depending on the value of
// `PLAYBACK_MODE` in the Cypress environment.
cy.playback(method, url, playbackOptions);
cy.playback(method, routeMatcher, playbackOptions);
```

#### Usage
```JavaScript
// Capturing a request.
cy.playback('POST', \/users\/);
// Providing playback options.
cy.playback('GET', \/todos\/, { toBeCalledAtLeast: 2 });
// Aliasing the request for later use in the test.
 // In case of static assets, it is best to clear the browser cache to ensure proper interception:
cy.wrap(
  Cypress.automation('remote:debugger:protocol', {
    command: 'Network.clearBrowserCache'
  })
)

cy.playback('GET', 'https://www.example.com/300/150').as('image');
```

### Run Cypress

Run Cypress as you normally would using `cypress open`. By default using
`cypress open` will operate Cypress playback in _hybrid_ mode,
meaning it will save any requests that have not already been saved and
fulfill ones that have and as such, is a great place to start.

That's it! Your specified `playback` URL calls are now stored as static
fixtures and will be automatically fulfilled in further test runs.

Keep reading for further info on the various [playback modes](#playback-mode)
and [playback API](#the-playback-command).

---

## API and usage documentation

### The `playback` command

#### Arguments

##### **method (string)**

Capture requests using this specific HTTP method (`GET`, `POST`, etc).

> 🚨 **NOTE:** Unlike the `intercept` command, the command requires a `method`
> argument.

##### **url (string, glob, RegExp)**

Capture requests that match this value. See the `intercept` command's ["Matching
url"][2] documentation for more details.

##### **routeMatcher (RouteMatcher)**

An object used to define a request that can be captured. See the `intercept`
command's ["RouteMatcher"][3] documentation for more details.

##### **playbackOptions (PlaybackOptions)**

`playbackOptions` is an object used to modify the behavior of the `playback`
command. The example object below is showing the default values for all
available properties.

```JavaScript
{
  allowAllStatusCodes: false,
  toBeCalledAtLeast: 1,
  matching: {
    ignores: {
      attributes: [],
      bodyProperties: [],
      searchParams: []
    }
  },
  rewriteOrigin: undefined
}
```

More detailed examples of how to use these properties can be found in the
["Requests and Responses"][5] section below.

###### **playbackOptions.allowAllStatusCodes (boolean)**

By default, the command will only record responses that have a `2xx` status
code. By setting this to `true`, all responses will be recorded.

Note that trying to record `3xx` responses will lead to some strange behavior
and is area where more work is needed in the plugin.

*Default:* `false`

###### **playbackOptions.toBeCalledAtLeast (number)**

The minimum number of times the system under test must trigger a network request
that matches the `url` or `routeMatcher`. See ["All Requests Complete"
Assertions][6] for more details.

*Default:* `1` - At least 1 request must have been matched.

###### **playbackOptions.matching (object)**

This object modifies how the command tries to match recorded responses to a
network request.

*Default:* `undefined`

###### **playbackOptions.matching.ignores (string[] | object)**

This property supports two different value types:

* **`string[]`:** An array of network request attributes to ignore. See the
  `attributes` entry below.

* **`object:`** An object consisting of one or more of the following properties:

  * **`attributes`:** A string array consisting of one or more of the following
    values.
    * `protocol`
    * `hostname`
    * `port`
    * `pathname`
    * `search`
    * `method`
    * `body`

  * **`bodyProperties`:** A string array consisting of properties in the network
    request body to ignore. This assumes that the body is a JSON object.

  * **`searchParams`:** A string array consisting of search parameters on the
    network request url to ignore.

###### **playbackOptions.rewriteOrigin (string)**

This string will be used in place of the current origin found in the network
request's URL.

*Default:* `undefined`

#### Yields

The command yields the response of the `cy.intercept` command it is wrapping.
See the `intercept` command's ["Yields"][4] section for more details.

### Requests and Responses

Since the words "request" and "response" can have a few meanings, it's helpful
to provide a few definitions first:

* **Request**: A network request made by the browser that may be intercepted by
  a request matcher.
* **Response**: The response sent back to the browser's network request. The
  plugin saves responses to the automatically created fixture file.
* **Request Matcher:** This is what is being created by calling the
  `cy.playback` command. Request matchers are saved to the automatically created
  fixtures file. Depending on how the route matching is setup in the matcher,
  the plugin may record multiple responses for a single matcher.

> 🚨 **A Warning on Secrets:** A response that is recorded in the fixtures file,
> which will likely be committed to the project's repository, will contain both
> the request's and response's headers and body. While this file is binary and
> is compressed, it isn't encrypted or protected in any way. When recording
> responses, make sure there aren't any secrets used by a request or returned in
> a response that you wouldn't want exposed.

#### Request Matching versus Response Matching

Since a developer can create a request matcher that can potentially match
multiple requests, it's important that the plugin know how to return the right
response to any individual request. That means the plugin is performing both
request matching and response matching.

To explain this better, consider the examples below.

#### Example 1: Multiple Requests to the Same Request Matcher

The developer wants to record all requests made to `/api/v1/todo/`. Their app
will be making multiple calls to this Api, each with an id value appended to the
end. The developer sets up the following `playback` command in their test:

```JavaScript
cy.playback('GET', new RegExp('/api/v1/todo/'));
```

Internally, the plugin is calling `cy.intercept` with that RegExp as the route
matcher. The app, over the course of the test, makes requests to
`/api/v1/todo/1` through `/api/v1/todo/5`. The plugin's wrapped `intercept`
command intercepts all of those requests and its custom request handler is
called with the full details for each request that is being made. For example,
that means the request handler will see information such as a request to
`https://example.com/api/v1/todo/1` was made.

What happens next depends on what mode the plugin is in:

* If the plugin is in "record" mode, it will capture the response and write it
  to disk when the test is completed.
* If the plugin is in "playback" mode, it will try to find a previously recorded
  response for that specific request.

More details on the plugin's mode can be found below.

##### Example 2: Differences between Test Environments

The developer is recording requests made to their local instance, which is
hosted at `http://localhost:4200`. As it runs, the app will be making requests
to `http://localhost:4200/api/v1/todo/`. However, in the project's CI job, the
tests will be run in a Docker container, so the app will be hosted at
`http://test:8000`.

This is a problem, because by default the plugin expects every attribute of the
request to match. The attributes that must match are:

* `protocol`
* `hostname`
* `port`
* `pathname`
* `search`
* `method`
* `body`

If any of those are different, the recorded response won't be returned. However,
the `matching.ignores` property allows the developer to specifically say certain
attributes shouldn't be considered.

> ℹ️ Note that while headers are recorded and played back, they are not used
> when trying to look up a matching response. This is because headers tend to
> vary considerably, so they are always ignored. However, functionality could be
> added to the plugin to allow a developer to specify which headers to include
> when matching.

In this case, since the `hostname` and `port` are going to be different, the
developer should write their `playback` command like this:

```JavaScript
cy.playback('GET', new RegExp('/api/v1/todo/'), {
  matching: { ignores: ['hostname', 'port'] }
});
```

Of course, there is a danger that if too many attributes of a request are
ignored, the plugin won't find the correct response. For example, if every
request attribute were ignored, then every recorded response would be a match.
It's best to limit the list of ignored attributes to smallest number possible.

##### Example 3: Ignoring Dynamic Values in a Network Request

The application under test is making a `POST` request to an endpoint. The body
of this network request contains a timestamp:

```JSON
{
  "when": {
    "timestamp": "2022-02-01T14:43:10.023Z"
  }
}
```

In addition, because the backend developer was malicious, the url for the
network request must also contain a search parameter that includes the current
date:

```
https://example.com/api/v1/access?current_date=2022-02-01
```

In this case, though, the developer can tell the playback command to ignore both
that property and the search parameter when trying to find a matching response:

```JavaScript
cy.playback('POST', new RegExp('/api/v1/access'), {
  matching: {
    ignores: {
      bodyProperties: ['when.timestamp'],
      searchParams: ['current_date']
    }
  }
});
```

###### Body Property Paths

As seen above, the values in the `bodyProperties` array are strings defining
where the property can be found in the object. The example below provides
examples of supported paths.

```JavaScript
const example = {
  foo: "value",
  bar: {
    baz: "value",
    qux: [
      {
        'Some whitespace': {
          quux: "value"
        }
      }
    ]
  }
};

// Paths to some of the properties above.
const bodyProperties = [
  'foo',`
  'bar.baz',`
  'bar.qux.0["Some whitespace"].quux',`
];
```

Note that arrays are supported, but the indices are not surrounded by brackets.
In addition, there is currently no concept of a wildcard that would cause a
property to be removed from all object entries in an array.

##### Example 5: Only One Response is Expected

The application under test is only making a certain network request once during
the test run. In addition, the developer is not concerned with any dynamic
values that may be found in the request. In such a case, the `matching.anyOnce`
property can be used:

```JavaScript
cy.playback('POST', new RegExp('/api/v1/access'), {
  matching: { anyOnce: true }
});
```

As its name implies, the `anyOnce` property expects there to only be one
response recorded for a request matcher. During playback, it expects only a
single network request will match that request matcher and, in that case, it
provides the recorded response. If it ever tries to handle more than one network
request, an error is thrown an the test will fail.

The advantage of this property is that it can greatly simplify setting up
response matching. In these cases, the developer doesn't have to pull apart the
request and provide the dynamic elements to the `playback` command.

### Playback Mode

The plugin can be run in one of three different modes:

* `playback` - Previously recorded responses are played back. If a matching
  response is not found for the intercepted request, an error is thrown and the
  test will fail. This is the default mode when Cypress is started with the
  `run` option.
* `record` - All request responses are recorded and any previously recorded
  responses are ignored.
* `hybrid` - If a previously recorded response matches the intercepted request,
  the plugin plays back that response. Otherwise, the response is recorded when
  the request completes. This is the default mode when Cypress is started with
  the `open` option.

The mode can be overridden through an environment variable:

```bash
CYPRESS_PLAYBACK_MODE=record npx cypress open
```

It can also be set in the `cypress.json`:

```json
{
  "env": {
    "PLAYBACK_MODE": "record"
  }
}
```

### "All Requests Complete" Assertion

During the `afterEach` stage of a test, the plugin will assert that all request
matchers were matched a minimum number of times. The default number of times is
`1`, but that value can be changed through the `toBeCalledAtLeast` option.

```JavaScript
// This request matcher is considered optional, so don't fail the test. There
// is a danger in this, though. See the "Why This is Important" section below.
cy.playback('GET', new RegExp('/api/v1/todo/'), { toBeCalledAtLeast: 0 });
// This request matcher must be matched 5 times, or the test will fail.
cy.playback('GET', new RegExp('/api/v1/todo/'), { toBeCalledAtLeast: 5 });
```

What the plugin is doing during the `afterEach` stage is, over a period of time,
checking to see if any request matchers still have not been matched their
minimum number of times. If after 10 seconds, the expected number of requests is
still not met, the plugin fails the test.

#### Why This is Important

There are two factors that make this assertion important. One factor is that
Cypress may consider a test complete before all the network requests made by the
system under test are received. The other factor is that the order in which
network requests complete is non-deterministic. This means that during one test
run one request may complete before Cypress considers the test does, while in
another run that same request has not.

To handle that, the plugin tries to make sure every `playback` command has
received at least one response that can be recorded. This is to ensure that all
request matchers have responses available when the test is run in "playback"
mode.

All of this is to explain why an "optional" request matcher can be dangerous.
Setting `toBeCalledAtLeast` to `0` tells the plugin that not receiving a request
matching that `playback` command is fine. When the plugin is running in "record"
or "hybrid" mode, the test will not be failed because of this. However, when the
plugin is running in "playback" mode and a request is made that matches that
`playback` command, the plugin returns a `404`. That may result in a flaky test
that can be hard to debug.

#### "Stale" Request Matchers and Responses

As applications and tests change over time, requests that were once made may not
be in the future. To keep these old request matchers and responses from building
up in the recorded fixtures file, the plugin considers any request matcher or
response loaded from disk as "stale". These stale entities are automatically
removed when the fixtures file is written to disk.

A "stale" entity becomes "fresh" when...

* Request matchers are considered "fresh" if a `cy.playback` command is invoked
  in the test that matches their `method`, `url` or `routeMatcher`, and playback
  options.
* Responses are considered "fresh" if a single request is made that exactly
  matches the request attributes they match on. Meaning, a request was made that
  matches the `post`, `hostname`, etc. they match on.

### The Recorded Fixtures File

All the captured responses for a test are grouped together into a single
`.cy-playbacks` file that is saved to the Cypress fixtures folder. A subdirectory
is created in the fixtures folder for each spec file. Within that folder, a
fixture file is created for each test in the spec file. The file name is a
combination of the test's name and any `describe` blocks it is nested under.

Consider the following example spec file.

* **File Name:** `./cypress/integration/app/basic.spec.js`
* **Spec File Contents:**
  ```JavaScript
  describe('app', () => {
    it('works', () => {
      // Test code.
    });
    it('still works', () => {
      // Test code.
    });
    describe('another language', () => {
      it('works', () => {
        // Test code.
      });
    });
  });
  ```
* **Generated Fixture Files:**
  ```bash
  ./cypress/fixtures/app/basic-spec/app-works.cy-playbacks
  ./cypress/fixtures/app/basic-spec/app-still-works.cy-playbacks
  ./cypress/fixtures/app/basic-spec/app-another-language-works.cy-playbacks
  ```

> ⚠️ As can seen, if the location of the spec file or the structure or name of
> the test changes, the generated file location and name will change as well.
> This means your project could end up with orphaned fixture files, as the
> plugin doesn't keep track of changes made to file names.

#### File Format

The `.cy-playbacks` file is a binary file, which is created by JSON stringifying
the request matchers and requests and compressing that output with Node's
`zlib.deflate` function. There are two reasons for this approach:

* As a compressed binary file it will take up less space on disk and Git LFS can
  be used to store them.
* The unreadable nature of the file prevents developers from easily being able
  to edit them. This is important, because the plugin overwrites the fixture
  file whenever a test completes, so any manual edits would be immediately lost.

## The `isPlayingBackRequests` command

This command can be used to allow conditional logic in a test when the plugin
will playback recorded requests.

### Syntax

```JavaScript
cy.isPlayingBackRequests();
```

### Usage

```JavaScript
cy.isPlayingBackRequests().then((isPlayingBack) => {
  cy.log(`isPlayingBack: ${isPlayingBack}`);
});
```

### Arguments

None

### Yields

* `cy.isPlayingBackRequests` yields `true` if the playback mode is `playback` or
  `hybrid.` Otherwise, yields `false`.

## The `isRecordingRequests` command

This command can be used to allow conditional logic in a test when the playback
mode is set to `record`. For example, this could be used to perform a login step
that wouldn't be needed in playback mode.

### Syntax

```JavaScript
cy.isRecordingRequests();
```

### Usage

```JavaScript
cy.isRecordingRequests().then((isRecording) => {
  cy.log(`isRecording: ${isRecording}`);
});
```

### Arguments

None

### Yields

* `cy.isRecordingRequests` yields `true` if the playback mode is `record` or
  `hybrid.` Otherwise, yields `false`.

[1]:https://docs.cypress.io/api/commands/intercept
[2]:https://docs.cypress.io/api/commands/intercept#Matching-url
[3]:https://docs.cypress.io/api/commands/intercept#routeMatcher-RouteMatcher
[4]:https://docs.cypress.io/api/commands/intercept#Yields
[5]:#requests-and-responses
[6]:#all-requests-complete-assertion
[7]:https://github.com/cypress-io/cypress
[8]:code-of-conduct.md
[9]:https://www.npmjs.com/package/@oreillymedia/cypress-playback
[10]:https://docs.cypress.io/guides/tooling/plugins-guide#Using-a-plugin
