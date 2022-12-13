FROM node:18

# ----------------------------------------------------------------------------------------------------------------------
# ENVIRONMENT VARIABLES
# ----------------------------------------------------------------------------------------------------------------------
ARG DOCKER_USER
ARG DOCKER_USER_ID
ARG DOCKER_GROUP_ID
# Versions
# Nginx version
ENV NGINX_VERSION=1.22.1 \
    NGINX_NJS_VERSION=0.7.9 \
    NGINX_PKG_RELEASE=1~bullseye \
# Supervisor version
    SUPERVISOR_VERSION=4.2.2 \
    SUPERVISOR_PKG_RELEASE=2 \
# NPM version
    NPM_VERSION=9.2.0 \
# Yarn version
    DOCKER_YARN_VERSION=3.3.0 \
    DOCKER_YARN_PLUGIN_OUTDATED=3.1.0 \
# Browsers version
    CHROME_VERSION=108.0.5359.98 \
    FIREFOX_VERSION=107.0.1
# Common environment variables
ENV CONTAINER_STOP_LOG_FILE="/var/www/html/var/log/container_stop.log" \
    COREPACK_HOME="/usr/lib/node/corepack" \
    DBUS_SESSION_BUS_ADDRESS=/dev/null \
    DISPLAY=:99 \
    MAIN_TERMINATED_FILE="/var/www/html/var/log/main-terminated" \
    NPM_CONFIG_LOGLEVEL=notice \
    YARN_CACHE_FOLDER="/var/cache/yarn" \
    YARN_ENABLE_TELEMETRY=0 \
    # Unset yarn version - it could break things
    YARN_VERSION=
# Packages
ENV RUN_DEPS="ca-certificates \
              curl \
              g++ \
              gcc \
              gettext-base \
              git \
              gnupg \
              less \
              logrotate \
              lsb-release \
              make \
              openssh-client \
              procps \
              vim \
              wget"
# Yarn plugins
ENV OFFICIAL_YARN_PLUGINS="interactive-tools" \
    UNOFFICIAL_YARN_PLUGINS="outdated=https://mskelton.dev/yarn-outdated/v${DOCKER_YARN_PLUGIN_OUTDATED}"

# ----------------------------------------------------------------------------------------------------------------------
# PACKAGES
# ----------------------------------------------------------------------------------------------------------------------
RUN apt-get update && \
    apt-get install -y \
        ${RUN_DEPS} \
        supervisor=${SUPERVISOR_VERSION}-${SUPERVISOR_PKG_RELEASE} && \
# Cleanup
    apt-get clean && \
	rm -rf /var/lib/apt/lists/*

# ----------------------------------------------------------------------------------------------------------------------
# NPM
# Install static npm version
# ----------------------------------------------------------------------------------------------------------------------
RUN npm install --location=global npm@${NPM_VERSION} && \
    mkdir -p ${COREPACK_HOME} && \
    corepack prepare yarn@${DOCKER_YARN_VERSION} --activate && \
    corepack enable && \
# Install yarn plugins
    mkdir -p /home/node/.yarn/plugins/@yarnpkg && \
    echo "plugins:" >> /home/node/.yarnrc.yml && \
    for plugin in ${OFFICIAL_YARN_PLUGINS}; do \
        wget -q -O /home/node/.yarn/plugins/@yarnpkg/plugin-$plugin.cjs https://github.com/yarnpkg/berry/raw/@yarnpkg/cli/${DOCKER_YARN_VERSION}/packages/plugin-$plugin/bin/%40yarnpkg/plugin-$plugin.js && \
        echo "  - path: /home/node/.yarn/plugins/@yarnpkg/plugin-$plugin.cjs" >> /home/node/.yarnrc.yml; \
        echo "    spec: \"@yarnpkg/plugin-$plugin\"" >> /home/node/.yarnrc.yml; \
    done && \
    for plugin in ${UNOFFICIAL_YARN_PLUGINS}; do \
        plugin_name=${plugin%%=*} && \
        plugin_url=${plugin#*=} && \
        wget -q -O /home/node/.yarn/plugins/@yarnpkg/plugin-$plugin_name.cjs $plugin_url && \
        echo "  - path: /home/node/.yarn/plugins/@yarnpkg/plugin-$plugin_name.cjs" >> /home/node/.yarnrc.yml; \
        echo "    spec: \"@yarnpkg/plugin-$plugin_name\"" >> /home/node/.yarnrc.yml; \
    done && \
# Node cache cleanup
    npm cache clean --force && \
    yarn cache clean --all

# ----------------------------------------------------------------------------------------------------------------------
# NGINX
# ----------------------------------------------------------------------------------------------------------------------
# Inspiration taken from the official Nginx Dockerfile
RUN NGINX_GPGKEY=573BFD6B3D8FBC641079A6ABABF5BD827BD9BF62; \
    found=''; \
    for server in \
        ha.pool.sks-keyservers.net \
        hkp://keyserver.ubuntu.com:80 \
        hkp://p80.pool.sks-keyservers.net:80 \
        pgp.mit.edu; \
    do \
        echo "Fetching GPG key $NGINX_GPGKEY from $server"; \
        apt-key adv --keyserver "$server" --keyserver-options timeout=10 --recv-keys "$NGINX_GPGKEY" && found=yes && break; \
    done; \
    test -z "$found" && echo >&2 "error: failed to fetch GPG key $NGINX_GPGKEY" && exit 1; \
    echo "deb http://nginx.org/packages/debian $(lsb_release -cs) nginx" \
        | tee /etc/apt/sources.list.d/nginx.list && \
    apt-get update && \
    apt-get install --no-install-recommends --no-install-suggests -y \
        nginx=${NGINX_VERSION}-${NGINX_PKG_RELEASE} \
        nginx-module-xslt=${NGINX_VERSION}-${NGINX_PKG_RELEASE} \
        nginx-module-geoip=${NGINX_VERSION}-${NGINX_PKG_RELEASE} \
        nginx-module-image-filter=${NGINX_VERSION}-${NGINX_PKG_RELEASE} \
        nginx-module-njs=${NGINX_VERSION}+${NGINX_NJS_VERSION}-${NGINX_PKG_RELEASE} && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# ----------------------------------------------------------------------------------------------------------------------
# USER SETUP
# ----------------------------------------------------------------------------------------------------------------------
RUN ln -sf /dev/stdout /var/log/nginx/access.log && \
    ln -sf /dev/stderr /var/log/nginx/error.log && \
    mkdir -p /run/nginx && \
    chown node:node -R \
        /etc/nginx \
        /run/nginx \
        /var/log/nginx && \
    sed -i 's/^#alias l/alias l/g' /home/node/.bashrc && \
    echo "update-notifier=false" > /home/node/.npmrc && \
    mkdir -p \
        ${YARN_CACHE_FOLDER} \
        /var/cache/nginx \
        /usr/local/lib/node_modules \
        /var/run/supervisor \
        /var/www/html/var && \
    chown node:node -R \
        ${COREPACK_HOME} \
        ${YARN_CACHE_FOLDER} \
        /etc/nginx \
        /home/node/.npmrc \
        /home/node/.yarn \
        /home/node/.yarnrc.yml \
        /run/nginx \
        /usr/local/bin \
        /usr/local/lib/node_modules \
        /var/cache/nginx \
        /var/log/nginx \
        /var/run/supervisor \
        /var/www/html

# ----------------------------------------------------------------------------------------------------------------------
# BROWSERS SETUP
# ----------------------------------------------------------------------------------------------------------------------
# Install Needed packages
RUN apt-get update && \
    apt-get install --no-install-recommends -y \
        bzip2 \
        dbus-x11 \
        libasound2 \
        libgbm-dev \
        libgconf-2-4 \
        libgtk-3-0 \
        libgtk2.0-0 \
        libnotify-dev \
        libnss3 \
        libxss1 \
        libxtst6 \
        xauth \
        xvfb && \
# Cleanup
    apt-get clean && \
    rm -r /var/lib/apt/lists/*
# Install Google Chrome
RUN wget -q -O /usr/src/google-chrome-stable_current_amd64.deb "https://dl.google.com/linux/chrome/deb/pool/main/g/google-chrome-stable/google-chrome-stable_107.0.5304.68-1_amd64.deb" && \
    apt-get update && \
    dpkg -i /usr/src/google-chrome-stable_current_amd64.deb ; \
    apt-get install -f -y && \
    rm -f /usr/src/google-chrome-stable_current_amd64.deb && \
# Cleanup
    apt-get clean && \
    rm -r /var/lib/apt/lists/*
# Install Firefox
RUN wget -q -O /tmp/firefox.tar.bz2 "https://download-installer.cdn.mozilla.net/pub/firefox/releases/106.0.2/linux-x86_64/en-US/firefox-106.0.2.tar.bz2" && \
    tar -C /opt -xjf /tmp/firefox.tar.bz2 && \
    rm -f /tmp/firefox.tar.bz2 && \
    ln -fs /opt/firefox/firefox /usr/bin/firefox

# ----------------------------------------------------------------------------------------------------------------------
# RUN CONFIGURATION
# ----------------------------------------------------------------------------------------------------------------------
COPY --chown=node:node ./docker/app/local/etc /etc
COPY --chown=node:node ./docker/app/local/usr /usr

# ----------------------------------------------------------------------------------------------------------------------
# PERMISSIONS FIX
# ----------------------------------------------------------------------------------------------------------------------
# Change USER_ID and GROUP_ID for nonroot container user if needed and install mysql-client
RUN fix-user ${DOCKER_USER} node ${DOCKER_USER_ID} ${DOCKER_GROUP_ID}

# ----------------------------------------------------------------------------------------------------------------------
# RUN
# Run setup and entrypoint start
# ----------------------------------------------------------------------------------------------------------------------
WORKDIR /var/www/html

# Start
CMD ["start-command"]
