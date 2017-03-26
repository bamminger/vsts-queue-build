This task can be used for release or build definitions to queue further builds. With one task configuration you can start several builds.
By the use of the async setting the task is also able to wait for all builds to be finished.
![Single build configuration](doc/images/task_overview.png "Single build configuration")

# Configuration

**Build Definition Name**
The path to your build definitions.

* Single build
A build definition is simply queued by its name.
![Single build configuration](doc/images/config_build_definition_01.png "Single build configuration")

* Multiple builds
Multiple definitions are separated by a new line.
![Multiple builds configuration](doc/images/config_build_definition_02.png "Multiple builds configuration")

* Subfolders
Folders are separated by a backslash. The starting backslash is optional. Subfolders can also be used for single builds.
![Subfolders configuration](doc/images/config_build_definition_03.png "Subfolders configuration")


**Build configuration**
The following settings can be configured per build:
![Build configuration](doc/images/config_build_definition_04.png "Build configuration")

*Syntax (global)*:
```json
 {
    "sourceBranch": "value",
    "sourceVersion": "value",
    "parameters": {
        "parameterName": "value"
    }
}
```

*Syntax (per build)*:
The default configuration will be used for all unspecified builds.
All other builds will be associated by their build name or path + buildname.
```json
{
    "default": {
        "sourceBranch": "value",
        "sourceVersion": "value",
        "parameters": {
            "parameterName": "value"
        }
    },
    "BUILDNAME": {
        "sourceBranch": "value",
        "sourceVersion": "value",
        "parameters": {
            "parameter": "value"
        }
    }
}
```


**Async**
The async flag defines whether the build task waits till the builds are finished or just queues them.
![Async configuration](doc/images/config_async.png "Async configuration")


**Debug**
Enables the debug mode. Additional information about your build definitions and the processed input will be provided.
![Debug configuration](doc/images/config_debug.png "Debug configuration")

# Further information

If you need some special kind of setting or a new feature for this extension, don't hesitate to create a github issue or leave your comments below.
