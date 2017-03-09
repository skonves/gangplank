## Contributing

### Design Philosophy

This project has grown out of our need to design web APIs "top-down" using Swagger and then implement them with ExpressJs in Node.  Gangplank was our solution to automatically validating routes and parameters based on the `swagger.json` spec. Doing so facilitates thin route handlers while maintaining robust, heavily tested, reusable validation logic.

If this is your first time contributing to an open source project, thanks for taking the time to make this project better!  We want your experience to be a positive one, so here are some lists of things that we are and are not looking for as far as changes go:

Where we need help:
* Fixes or feedback for known issues (see the the Issues tab)
* Discovering bugs in existing features.  If you just want to open an issue, that's awesome! Pull Request? Even better!
* Adding any new functionality that is defined by the Swagger Specification and usable by ExpressJs.

What we aren't looking to do right now:
* Add code-gen functionality.  There are already several fantastic tools for scaffolding ExpressJs projects, but with this project, we want to stick to just validation.
* Add features that don't derive from the Swagger Specification.

### What do I need to know to help?

If you are interested in making a code contribution and would like to learn more about the technologies that we use, check out the list below.

* [Swagger Specification](http://swagger.io/specification/) - This is the bread and butter right here!
* [ExpressJs](https://expressjs.com/) - Fast, unopinionated, minimalist web framework for Node.js
* [JSON Schema](http://json-schema.org/) - Swagger uses JSON Schema v4 throughout.
* [jsonschema npm package](https://www.npmjs.com/package/jsonschema) - Super popular JSON Schema validator.  It does all the heavy lifting.
* [Mocha](https://mochajs.org/) - Testing validation code is so meta.
* [Supertest](https://www.npmjs.com/package/supertest) - A fantastic library for testing Express APIs.

### How do I make a contribution?

Never made an open source contribution before? Wondering how contributions work in the in our project? Here's a quick rundown!

1. Find an issue that you are interested in addressing or a feature that you would like to add.
1. Fork the repository associated with the issue to your local GitHub organization. This means that you will have a copy of the repository under your-GitHub-username/repository-name.
1. Clone the repository to your local machine using `git clone https://github.com/your-GitHub-username/gangplank.git`.
1. Create a new branch for your fix using `git checkout -b branch-name-here`.
1. Make the appropriate changes for the issue you are trying to address or the feature that you want to add.
1. Add tests for new code.  If you are submitting a bug fix, consider writing the test first.  A good test will fail until your finish writing the fix.
1. Use `git add insert-paths-of-changed-files-here` to add the file contents of the changed files to the "snapshot" git uses to manage the state of the project, also known as the index.
1. Use `git commit -m "Insert a short message of the changes made here"` to store the contents of the index with a descriptive message.
1. Push the changes to the remote repository using `git push origin branch-name-here`.
1. Submit a pull request to the upstream repository.
1. Title the pull request with a short description of the changes made and the issue or bug number associated with your change. For example, you can title an issue like so "Added more log outputting to resolve #4352".
1. In the description of the pull request, explain the changes that you made, any issues you think exist with the pull request you made, and any questions you have for the maintainer. It's OK if your pull request is not perfect (no pull request is), the reviewer will be able to help you fix any problems and improve it!
1. Wait for the pull request to be reviewed by a maintainer.
1. Make changes to the pull request if the reviewing maintainer recommends them.
1. Celebrate your success after your pull request is merged!