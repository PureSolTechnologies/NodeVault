# NodeVault (NoVA) - Extended NodeJS Package Manager #

NodeVault was created in order to overcome limitations of other NodeJS package
managers like npm, pnpm, yarn, and others. Some of the limitations tackled 
are:

* SNAPSHOT support like provided for Java by Maven. Devlopment versions can be used locally and shared via registry managers like Nexus
* Special development support:
  * mulitple libraries on local machine (local SNAPSHOTs)
  * Support for development with multiple people (remote SNAPSHOTs)
* Stable dependencie versions

## Naming

The name "NodeVault" plays on the idea of a secure registry where you can store and manage your NodeJS packages with confidence. It's concise, evokes the sense of security, and hints at the valuable packages stored within.

The command line shortcut `nova` means something like a new star what we hope this tool becomes. ;-) "NoVa" is a shortcut, adding a modern touch to the name. It's catchy and easy to remember.


## Development and Contributions

### Suggestions

Install the following plugins:

- TypeScript
- Jest Runner

In VS Code, enable auto-formatting and import organization:

````
    "editor.formatOnSave": true,
    "[typescript]": {
        "editor.codeActionsOnSave": {
            "source.organizeImports": true
        }
    }
````