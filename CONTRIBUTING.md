# Contributing

We appreciate every contribution to this project and we want to make it easy for
you to do so. We'll try to provide clear and consistent guidelines for:

* Reporting a bug.
* Submitting a fix or feature.
* Asking questions.
* Proposing new features.

## Reporting a Bug

Please use the bug issue template when reporting a bug and try to fill out all
the sections of the template as best you can. Sample code can also go a long way
toward helping identify and resolve the issue.

## Submitting a Fix or Feature

Please fork the repo and create a branch from `main`, and when the work is
complete, create a pull request for the maintainers to review. Some additional
information about how this project is setup is found below:

1. The package's version is generated based on commit messages using the
   [conventional commit syntax][1]. Please make sure the PR's title conforms to
   that standard.

   * This project is set to squash all of a PR's commits into a single commit,
     that's why its necessary for the PR title to conform to the standard.

2. Primarily, we are using unit tests to test the plugin and the unit test
   tooling requires 100% coverage. However, it's acceptable to have certain
   pathways or even entire files ignored from code coverage, where instrumenting
   a test is too difficult or simply not worth it.

   * A good rule of thumb: try to cover what you can and, if you hit a wall,
     ignore that code. We may be able to provide some suggestions to get around
     that in the code review.

3. If adding a new feature, try to extend the Sandbox app and spec to test that
   functionality.

   * The app spec file is primarily there just to test the happy path use case,
     so don't worry about handling edge cases there. Edge cases can be covered
     in unit tests.

4. When adding a new feature please update the documentation with how it works.

Before submitting your PR, please make sure that...

1. The tests pass.
2. The code has been linted.
3. Your PR title follows [conventional commit syntax][1].

## Asking Questions and Proposing Features

We've enabled GitHub discussions for this project, so please start a new
discussion thread for questions or proposing features.

## All Contributions Will Be Included in the Project's License

In short, when you submit code changes, your submissions are understood to be
under the same license as the project. Feel free to contact the maintainers if
that's a concern.

[1]:https://www.conventionalcommits.org/en/v1.0.0/#summary