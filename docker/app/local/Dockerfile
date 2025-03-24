FROM anzusystems/node:2.0.0-node22-nginx-browsers

#
### Basic arguments and variables
ARG DOCKER_USER
ARG DOCKER_USER_ID
ARG DOCKER_GROUP_ID
ENV DISPLAY=:99
#
### Copy configuration files in to the container
COPY --chown=node:node docker/app/local/bin /usr/local/bin/
#
### Change USER_ID and GROUP_ID for nonroot container user if needed
USER root
RUN fix-user ${DOCKER_USER} node ${DOCKER_USER_ID} ${DOCKER_GROUP_ID}
#
### Basic user setup and start
USER root
CMD ["start-command"]
