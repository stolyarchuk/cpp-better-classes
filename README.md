# VS Code CPP Better Classes Extension

## Features

* Auto creates header and source files from the given class name
* Filenames are transformed to snake case (configurable)
* Handles namespace names in class name
* Namespace names are transormed to lower case (configurable)
* Follows current active directory

## Usage

* Open command pallete (`ctrl+shift+p`)
* Type `C/C++: Create New Class...`

## Keyboard Shortcut

* CTRL+K N

## Settings

* `cpp.betterclasses.hppExtension` - extension for the header file created (defaults to `'hpp'`)
* `cpp.betterclasses.cppExtension` - extension for the source file created (defaults to `'cpp'`)
* `cpp.betterclasses.useIfndef` - whether to to use `'ifndef'` header guard or `'#pragma once'` one
* `cpp.betterclasses.lowerCaseNamespace` - transform namespace name to lower case
* `cpp.betterclasses.snakeCaseFilename` - transform file name to snake case
