Development on AnzuSystems Admin-DAM by Petit Press a.s. (www.sme.sk)
=====

Simple guide on how to develop on the project, run dev server, etc.

---

# Installation

## 1.a. Start Core-DAM containers

Start Core-DAM docker containers if not started yet - needed for backend API communication.

See [the official Core-DAM Development documentation][core-dam-dev-docu] on how to start Core-DAM containers.

## 1.b. Start Notification-Server container

Start Notification-Server docker container if not started yet - needed for websockets.

See [the official Notification-Server Development documentation][notification-server-dev-docu] on how to start Notification-Server containers.

## 2. Clone the repository

    git clone https://github.com/anzusystems/admin-dam.git

## 3. Start containers

Start project docker containers:

    bin/docker-compose up --build -d

Arguments:

- `--build` - Build all images to run fresh docker containers
- `-d` - Run docker containers in the detached mode as background processes

## 4. Build the application

    bin/build

## 5. Open your application

Open http://admin-dam.anzusystems.localhost in your browser.

# Scripts

Scripts available in the project.

## Bash

Script used to run bash in the application docker container.

    bin/bash

Execute `bin/bash -h` for all bash containers and options.

## Build

Script used to run build in the application docker container.

    bin/build

## Docker-compose script wrapper

Wrapper script used to run `docker-compose`:

    bin/docker-compose

Options:

- see [the official docker-compose docu][docker-compose-overview] for all options

Script will:

- setup correct permissions for the user if needed (sync UID and GID in docker container with host user, etc.)
- run `docker-compose` command

## Dev - Run dev server

Script used to run node `dev` server in the application docker container:

    bin/dev

Execute `bin/dev -h` for all command arguments.

## Lint

Script used to run the linter check inside the application docker container:

    bin/lint

## Security

Script used to run the security check inside the application docker container:

    bin/security

[core-dam-dev-docu]: https://github.com/anzusystems/core-dam/blob/main/README-DEV.md
[docker-compose-overview]: https://docs.docker.com/compose/reference/overview
[notification-server-dev-docu]: https://github.com/anzusystems/notification-server/blob/main/README-DEV.md
