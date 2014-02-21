Runaway!
========

Bring the sexy back to runaway scripts.

##What is it?

Runaway! is a graphical web-based frontend to check for runaway processes
in a unix environment. A runaway check may be performed directly from the
browser; no terminal access required.

##How it Works

Runaway! operates within an Apache environment. When you click the 'Run'
button, your browser will send an HTTP GET request to the backend
runaway script. (runaway.script) The backend script will SSH into remote
hosts specified in a hosts.txt (delimited by newlines) file in the
script's working directory. As the backend script is SSHing into these
remote hosts it also streams a progress indication to the frontend. After
the backend script completes, the frontend displays the results of the
runaway check.

##Want to use it yourself?

Warning, there be bugs and hacks within. Use at your own risk. **Be
forewarned, YMMV.**

Farmiliarize yourself with the source. Some changes may need to be made
in order to get the script to work in your environment.

###SSH and Remote Hosts

Because the backend script SSHes into remote hosts autonomously, one of
the following contitions **must** be met:

* Have an instance of ssh-agent running with properly added keys on the
  Apache host, or
* Have a passphrase-free SSH key available to the Apache host added to
  each of the remote host's .ssh/authorized\_keys files.

You will not receive results if the backend script can not successfully
SSH into the specified remote hosts.
