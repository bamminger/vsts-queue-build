# Visual Studio Team Services - Queue Build(s) Task  
**Build & Release task to queue further builds**

**Features:**
* Queue one or multiple builds at the same time
* Define build specific parameters
    * Branch
    * Commit version
    * Build parameters
* Queue builds async
* Configurable authentication
* Team project indepentent queuing
* Build & Release summary

![Single build configuration](doc/images/task_overview.png "Single build configuration")  
A simple task configuration to start several builds with the same variables.  
At the end you find all queued builds in the summary page of your build or release.

![Summary view](doc/images/task_summary.png "Summary view") 

# Settings

**Build Definition Name**  
The path to your build definitions. Supports:
* Single build
* Multiple builds
* Subfolders
* Comments
* Wildcards

![Single build configuration](doc/images/config_build_definition_01.png "Single build configuration")

Detailed documentation on Github: [Build Definition Name](https://github.com/bamminger/vsts-queue-build/blob/master/doc/build-definition.md)

---

**Configuration**  
You can use the configuration field to configure the variables per build:
* Shared parameters
* Team project
* Branch
* Commit version
* Build ID output variable
* Build parameters  

![Build configuration](doc/images/config_build_definition_04.png "Build configuration")

Detailed documentation on Github: [Configuration](https://github.com/bamminger/vsts-queue-build/blob/master/doc/configuration.md)

---

**Team project**  
Use the build or release team project, define it on your own or specify it within the configuration setting.

![Team project configuration](doc/images/config_team-project_01.png "Team project configuration")

Detailed documentation on Github: [Team project](https://github.com/bamminger/vsts-queue-build/blob/master/doc/team-project.md)

---

**Authentication & Authorization**  
Use a custom authentication token and define whether the current user should be used to queue the new builds.

![Authentication configuration](doc/images/config_auth.png "Authentication configuration")

Detailed documentation on Github: [Authentication](https://github.com/bamminger/vsts-queue-build/blob/master/doc/authentication.md)

---
 
**Advanced**  
Define a variable name for the result build ids and enable debug mode for Troubleshooting. Additional information about your build definitions and the processed input will be provided.  

![Advanced configuration](doc/images/config_advanced.png "Advanced configuration")


# API and TFS Mapping

To support newer and older versions of TFS, the task has two different versions:
* v1 - Support for TFS >= 2017 Update 1
* v2 - Support for TFS >= 2018 Update 2 & Azure DevOps


# Further information

If you need some special kind of setting or a new feature for this extension, don't hesitate to create a github issue or leave a comment at the vsts extension page.
https://marketplace.visualstudio.com/items?itemName=jb.queue-build  

Please leave a review in the marketplace with your feedback.


## Donation  
If you like my work, please consider buying me a coffee
<link href="https://fonts.googleapis.com/css?family=Cookie" rel="stylesheet"><a class="bmc-button" target="_blank" href="https://www.buymeacoffee.com/bamminger"><img src="https://www.buymeacoffee.com/assets/img/BMC-btn-logo.svg" alt="Buy me a coffee"><span style="margin-left:5px">Buy me a coffee</span></a>

