# kuma-init

This is a simple cli script, mostly designed to initialize
a fresh installation of Uptime Kuma with HTTPs monitors
from a csv file.

The script expects input in the format `name,url` from stdin,
so you can use this with cat, grep and pipe. It's written
in TypeScript, so make sure to build first using `tsc`

Usage:

```
$ node client.js -h
Usage: client [options]

Options:
  -s, --server <url>         URL of the Uptime Kuma server
  -u, --username <username>  Username of the Uptime Kuma server
  -p, --password <password>  Password of the Uptime Kuma server
  -V, --version              output the version number
  -h, --help                 display help for command
```

Example:

```
$ cat monitors.csv | node client.js -s kuma.example.com -u foo -p bar
```
