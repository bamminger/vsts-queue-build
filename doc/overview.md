This task can be used for release or build definitions to queue further builds. With one task configuration you can start several builds with the same variables.  
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

* Comments  
Comments are defined by starting a line with #.  
![Comments configuration](doc/images/config_build_definition_07.png "Comments configuration")

---

**Configuration**  
You can use the configuration field to configure the variables per build:  
![Build configuration](doc/images/config_build_definition_04.png "Build configuration")

*Syntax (global)*:  
```json
{
    "sourceBranch": "value",
}
```
 
*Syntax (per build)*:  
The "default" configuration will be used for all unspecified builds.  
All the other builds will be associated by their build name or path + buildname.
```json
{
    "default": {
        "sourceBranch": "value",
    },
    "BUILDNAME": {
        "sourceBranch": "value",
    }
}
```

*Possible settings*:  
It is possible to use all supported [VSTS / TFS api](https://www.visualstudio.com/en-us/docs/integrate/api/build/builds#queue-a-build) settings.  
Currently tested configuration settings:

```json
{
    "sourceBranch": "value",
    "sourceVersion": "value",
    "parameters": {
        "parameterName": "value"
    },
    "demands": [
        "customExists",
        "customValue -equals value"
    ]
}
```

**Configuration type**
* JSON  
The content of the configuration field will be interpreted as JSON.

* Single \\ JSON  
Before the configuration content is interpreted as JSON, all backslash (\\) occurrences are replaced by \\\\. This is necessary to process file paths (e.g. \\\\remote\\folder).  

![Configuration type](doc/images/config_build_definition_06.png "Configuration type")

---

**Async**  
The async flag defines whether the build task waits till the builds are finished or just queues them.  
![Async configuration](doc/images/config_async.png "Async configuration")

---

**Authentication & Authorization**
* Use Requestor User  
This setting controls whether the user who has triggered this build or release is used for triggering the new build or the default collection service account.

* Auth Token  
This input field makes it possible to define a custom authentication token, if the default behavior of this task does not work.  
If this field is empty, the tasks tries to use the authentication token of the build agent or the system.accesstoken variable which can be enabled in the build settings.

![Authentication configuration](doc/images/config_build_definition_05.png "Authentication configuration")

---
 
**Debug**  
Enables the debug mode. Additional information about your build definitions and the processed input will be provided.  
![Debug configuration](doc/images/config_debug.png "Debug configuration")

<br />

# Further information

Supported: Visual Studio Team Services    
Unsupported: TFS On Premise

If you need some special kind of setting or a new feature for this extension, don't hesitate to create a github issue or leave your comments below.

Please leave a review below. Thanks!